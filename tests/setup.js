// Test environment bootstrap. Runs once per test file before any test.
//
// kyte-source.js is a vanilla browser script — it expects jQuery to be loaded
// via a <script> tag and the library's classes (Kyte, KyteNav, KyteForm, etc.)
// to land as window-globals. We mirror that here so the library can be loaded
// unmodified.

import jQueryFactory from 'jquery';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { beforeEach } from 'vitest';

// jsdom provides `window` via vitest's environment: 'jsdom'. Bind jQuery to it
// so $ behaves exactly as it does when loaded from a CDN <script>.
globalThis.$ = globalThis.jQuery = jQueryFactory(window);

// Load the library source. We use new Function() rather than import because
// kyte-source.js is a script, not an ESM module — it declares `class Kyte`
// at top-level, which becomes function-local lexical state when wrapped.
// The trailing assignments expose the classes through `this` (set to
// globalThis via .call), without modifying the source file itself.
const sourcePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'kyte-source.js'
);
const source = readFileSync(sourcePath, 'utf8');

// `typeof X !== 'undefined'` guards make this forgiving across versions —
// new classes added later are picked up automatically, removed classes
// don't break the load.
const exportTail = `
  ;if (typeof Kyte !== 'undefined') globalThis.Kyte = Kyte;
  if (typeof KyteNav !== 'undefined') globalThis.KyteNav = KyteNav;
  if (typeof KyteSidenav !== 'undefined') globalThis.KyteSidenav = KyteSidenav;
  if (typeof KyteTable !== 'undefined') globalThis.KyteTable = KyteTable;
  if (typeof KyteForm !== 'undefined') globalThis.KyteForm = KyteForm;
  if (typeof KyteCalendar !== 'undefined') globalThis.KyteCalendar = KyteCalendar;
`;
new Function(source + exportTail).call(globalThis);

// Clear document.cookie between tests so cookie-based state doesn't leak.
// jsdom persists cookies across tests within a file by default.
beforeEach(() => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = (eqPos > -1 ? cookie.substr(0, eqPos) : cookie).trim();
    if (name) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  }
});
