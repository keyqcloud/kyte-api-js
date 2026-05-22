# Contributing to kyte-api-js

## Commit convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) so that releases can be automated by [release-please](https://github.com/googleapis/release-please).

Every commit subject must start with one of:

| Prefix | Use for | Version bump |
|---|---|---|
| `feat:` | A new feature visible to consumers | minor (e.g. 2.1.0 → 2.2.0) |
| `fix:` | A bug fix | patch (e.g. 2.1.0 → 2.1.1) |
| `perf:` | Performance improvement | patch |
| `docs:` | Documentation only | none |
| `test:` | Adding or updating tests | none |
| `build:` | Build system / tooling | none |
| `ci:` | CI configuration | none |
| `refactor:` | Code refactor with no behavior change | none |
| `chore:` | Anything else (deps bump, file moves, etc.) | none |
| `revert:` | Reverts a prior commit | varies |

For a **breaking change** that should force a major version bump, append `!` to the type and/or add a `BREAKING CHANGE:` footer:

```
feat!: drop support for kyte-api-js v1.x HMAC mode

BREAKING CHANGE: HmacSessionStrategy is removed. Customers must migrate
to JWT mode. See migration guide in CHANGELOG.
```

## Release flow (automated)

1. Land your work on `master` with conventional commit messages.
2. [release-please](.github/workflows/release-please.yml) watches `master` and opens a "Release PR" whenever shippable changes have accumulated. It computes the version bump from the commit types, updates `CHANGELOG.md` and `package.json`, and waits for review.
3. Review the Release PR. Adjust the CHANGELOG if needed (the bot accepts edits before merge).
4. Merge the Release PR. release-please tags the commit `v<x.y.z>` and pushes the tag.
5. The tag triggers [deploy.yml](.github/workflows/deploy.yml) which builds with terser, uploads `kyte.js` / `kyte.min.js` / `kyte.js.map` to S3, invalidates CloudFront, and creates a GitHub Release with the CHANGELOG entry attached.

You should not need to run `release.sh` under normal circumstances — it's kept as an escape hatch for manually-tagged emergency releases.

## Running tests

```bash
npm install
npm test            # one-shot run
npm run test:watch  # watch mode
```

11+ baseline tests cover constructor invariants, cookie handling, and utility methods. New features should ship with corresponding tests under `tests/`.

## Building locally (optional)

CI builds the published artifacts; you only need this for local debugging:

```bash
npm install -g terser
terser kyte-source.js -c -m --source-map "url='kyte.js.map'" -o kyte.js
```

The output is gitignored.
