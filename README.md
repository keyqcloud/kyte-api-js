# Kyte JS Framework

[![Deploy to CDN](https://github.com/keyqcloud/kyte-api-js/actions/workflows/deploy.yml/badge.svg)](https://github.com/keyqcloud/kyte-api-js/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/keyqcloud/kyte-api-js/actions/workflows/codeql.yml/badge.svg)](https://github.com/keyqcloud/kyte-api-js/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Latest release](https://img.shields.io/github/v/tag/keyqcloud/kyte-api-js?label=release&sort=semver)](https://github.com/keyqcloud/kyte-api-js/tags)

Browser-side JavaScript SDK for the [Kyte](https://www.keyq.cloud) low-code platform. Provides authenticated CRUD against a Kyte API endpoint, plus utility widgets (`KyteTable`, `KyteForm`, `KyteNav`, `KyteSidenav`) used by [Kyte Shipyard](https://github.com/keyqcloud/kyte-shipyard) and customer-built apps.

## Install

CDN (recommended for production):

```html
<script src="https://cdn.keyqcloud.com/kyte/js/stable/kyte.js" crossorigin="anonymous"></script>
```

Pin to a specific version:

```html
<script src="https://cdn.keyqcloud.com/kyte/js/archive/kyte-2.0.0.js" crossorigin="anonymous"></script>
```

## Quick start

KyteJS supports two authentication modes. Pick one at construction time.

### HMAC (default, backward compatible with v1.x)

```js
const k = new Kyte(endpoint, publicKey, identifier, accountNumber, applicationId);
k.init();
k.sessionCreate({ email, password }, onSuccess, onError);
```

Every CRUD request goes through `sign()` and carries `x-kyte-signature` / `x-kyte-identity` headers. This is what every Kyte app shipped before v2.

### JWT (new in v2.0)

```js
const k = new Kyte(endpoint, null, null, null, applicationId, { authMode: 'jwt' });
k.init();
k.sessionCreate({ email, password }, onSuccess, onError);
```

`sessionCreate` posts to `/jwt/login`, stores an access JWT plus a rotating refresh token, and all subsequent `get`/`post`/`put`/`delete` calls carry `Authorization: Bearer <jwt>`. The access token auto-refreshes via `/jwt/refresh` ~30 seconds before expiry; concurrent requests share a single in-flight refresh.

Requires kyte-php ≥ v4.4 on the server side with `KYTE_JWT_SECRET` configured.

## CRUD

Same surface in both auth modes:

```js
k.get('Model', 'id', 42, [], onSuccess, onError);
k.post('Model', { name: 'Example' }, null, [], onSuccess, onError);
k.put('Model', 'id', 42, { name: 'Updated' }, null, [], onSuccess, onError);
k.delete('Model', 'id', 42, [], onSuccess, onError);
```

## Building from source

Releases are built from `kyte-source.js` (the single source file) into minified bundles via [terser](https://github.com/terser/terser):

```bash
npm install -g terser
./release.sh 2.0.0
```

The script:
1. Verifies the version in `CHANGELOG.md` matches the argument
2. Minifies `kyte-source.js` into `kyte.js` and `kyte.min.js`
3. Prepends the copyright notice
4. Writes them to `releases/stable/` (canonical) and `releases/archive/kyte-<version>.js` (pinned)
5. Commits, tags `v<version>`, pushes

The tag push triggers `.github/workflows/deploy.yml`, which copies the bundles to S3 and invalidates the CloudFront distribution.

No obfuscation — KyteJS is MIT-licensed open source and source-readable on GitHub; obfuscation would only inflate bundles and break customer stack traces without any security benefit. Per-app API keys *are* obfuscated separately by Shipyard when it embeds them in customer pages — that's a different concern.

## Compatibility

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- jQuery 3.5+ (peer dependency — `kyte-source.js` assumes `$` is loaded first)
- Bootstrap 5 + DataTables 1.10 (only for the `KyteTable` / `KyteForm` widgets)

## Contributing

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) so that releases can be automated. See [CONTRIBUTING.md](CONTRIBUTING.md) for the convention and the release flow.

Quick reference:
- `feat: <description>` → minor bump
- `fix: <description>` → patch bump
- `feat!: <description>` or `BREAKING CHANGE:` footer → major bump
- `docs:`, `test:`, `ci:`, `chore:`, `refactor:` → no version bump

## License

[MIT](LICENSE) © KeyQ, Inc.
