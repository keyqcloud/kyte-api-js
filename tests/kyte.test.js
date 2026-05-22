// Baseline tests for the Kyte class — exercises the v1.4 surface that ships
// today on master. JWT-specific tests will land alongside the v2 merge.
//
// These tests deliberately stay clear of AJAX paths (sign(), sendData()) so
// they don't require a network mock. The utility methods covered here are
// where regressions tend to bite first: cookie handling, URL parsing, and
// the constructor's invariants.

import { describe, it, expect, vi } from 'vitest';

describe('Kyte — constructor', () => {
  it('stores all positional credentials', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345', 'myapp');
    expect(k.url).toBe('https://api.test');
    expect(k.access_key).toBe('pubkey');
    expect(k.identifier).toBe('iden');
    expect(k.account_number).toBe('12345');
    expect(k.applicationId).toBe('myapp');
  });

  it('captures initial credentials separately for handoff reset', () => {
    // When sendData() lands on a response that lacks kyte_pub/iden/num, the
    // class falls back to the constructor-time values via initial_access_key
    // et al. The invariant is that initial_* is never mutated after
    // construction.
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345', 'myapp');
    k.access_key = 'rotated';
    expect(k.initial_access_key).toBe('pubkey');
    expect(k.initial_identifier).toBe('iden');
    expect(k.initial_account_number).toBe('12345');
  });

  it('exposes KyteJS.VERSION as a static', () => {
    expect(typeof Kyte.VERSION).toBe('string');
    expect(Kyte.VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('defaults sessionController to "Session"', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    expect(k.sessionController).toBe('Session');
  });
});

describe('Kyte — cookies', () => {
  it('setCookie / getCookie round-trips a simple value', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    k.setCookie('test_cookie', 'hello', 5);
    expect(k.getCookie('test_cookie')).toBe('hello');
  });

  it('getCookie returns null for a missing cookie', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    expect(k.getCookie('does_not_exist')).toBeNull();
  });

  it('init() reads kyte_pub / kyte_iden / kyte_num cookies into instance state', () => {
    const k = new Kyte('https://api.test', 'fallback_pub', 'fallback_iden', 'fallback_num');
    k.setCookie('kyte_pub', 'cookie_pub', 5);
    k.setCookie('kyte_iden', 'cookie_iden', 5);
    k.setCookie('kyte_num', 'cookie_num', 5);
    k.setCookie('txToken', 'tx-abc', 5);
    k.setCookie('sessionToken', 'sess-xyz', 5);

    k.init();

    expect(k.access_key).toBe('cookie_pub');
    expect(k.identifier).toBe('cookie_iden');
    expect(k.account_number).toBe('cookie_num');
    expect(k.txToken).toBe('tx-abc');
    expect(k.sessionToken).toBe('sess-xyz');
  });
});

describe('Kyte — utilities', () => {
  it('makeid generates a string of the requested length', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    const id = k.makeid(8);
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('makeid produces distinct values across calls', () => {
    // Probabilistic but ~62^16 collision space — practically never collides.
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    const a = k.makeid(16);
    const b = k.makeid(16);
    expect(a).not.toBe(b);
  });

  it('setPageRequest encodes model + value into a base64 URL param', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    const encoded = k.setPageRequest('Model', 42);
    // Round-trip — the decoder lives in getPageRequest but reads from
    // window.location, so we just sanity-check the encoding is reversible.
    const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
    expect(decoded).toEqual({ model: 'Model', value: 42 });
  });

  it('getNestedValue resolves dot-paths against an object', () => {
    const k = new Kyte('https://api.test', 'pubkey', 'iden', '12345');
    const obj = { foo: { bar: { baz: 'hit' } } };
    expect(k.getNestedValue(obj, 'foo.bar.baz')).toBe('hit');
    expect(k.getNestedValue(obj, 'foo.missing.baz')).toBeUndefined();
  });
});

// JWT logout — regression coverage for the addLogoutHandler contract.
// _sessionDestroyJwt accepts a completion callback (misnamed `error` for
// historical compatibility with HMAC sessionDestroy) and MUST invoke it on
// every exit path: success, error, and the no-refresh-token early return.
// Without all three, the addLogoutHandler() flow (`location.href = '/'` in
// the callback) silently no-ops on successful logout and users get stuck on
// the post-logout page with cleared tokens.
describe('Kyte — JWT sessionDestroy', () => {
  it('invokes the completion callback when no refresh token is held', () => {
    const k = new Kyte('https://api.test', null, null, null, null, { authMode: 'jwt' });
    // No login happened → no refresh token in state.
    expect(k.jwtRefreshToken).toBeFalsy();

    const onComplete = vi.fn();
    k.sessionDestroy(onComplete);

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('invokes the completion callback after successful POST /jwt/logout', () => {
    const k = new Kyte('https://api.test', null, null, null, null, { authMode: 'jwt' });
    k.jwtRefreshToken = 'kref_v1_fake_test_token';
    k.jwtAccessToken = 'header.payload.sig';
    k.jwtAccessExpiresAt = Date.now() + 900_000;

    // $.ajax is a jQuery function — replace it with our own and restore after.
    // (vi.spyOn doesn't work on it because the descriptor isn't configurable.)
    const realAjax = globalThis.$.ajax;
    let captured;
    globalThis.$.ajax = (opts) => {
      captured = opts;
      opts.success({ ok: true });
    };

    try {
      const onComplete = vi.fn();
      k.sessionDestroy(onComplete);

      expect(captured.url).toBe('https://api.test/jwt/logout');
      expect(JSON.parse(captured.data)).toEqual({ refresh_token: 'kref_v1_fake_test_token' });

      expect(onComplete).toHaveBeenCalledOnce();
      expect(k.jwtRefreshToken).toBeNull();
      expect(k.jwtAccessToken).toBeNull();
    } finally {
      globalThis.$.ajax = realAjax;
    }
  });

  it('invokes the completion callback when POST /jwt/logout fails', () => {
    const k = new Kyte('https://api.test', null, null, null, null, { authMode: 'jwt' });
    k.jwtRefreshToken = 'kref_v1_fake_test_token';

    const realAjax = globalThis.$.ajax;
    globalThis.$.ajax = (opts) => {
      opts.error({ status: 500, statusText: 'Internal Server Error' });
    };

    try {
      const onComplete = vi.fn();
      k.sessionDestroy(onComplete);

      expect(onComplete).toHaveBeenCalledOnce();
      expect(k.jwtRefreshToken).toBeNull();
    } finally {
      globalThis.$.ajax = realAjax;
    }
  });
});
