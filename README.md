<div align="center">

# SpectraVersions

### Official version registry for Spectra Anti-Cheat

**One source of truth for release metadata, compatibility, and update checks across the Spectra ecosystem.**

[![Repository](https://img.shields.io/badge/GitHub-GCMStudio%2FSpectraVersions-181717?style=flat-square&logo=github)](https://github.com/GCMStudio/SpectraVersions)
[![API](https://img.shields.io/badge/API-Production-2563eb?style=flat-square)](https://spectra-api-gcmstudio.vercel.app)
[![License](https://img.shields.io/badge/License-Apache%202.0-22c55e?style=flat-square)](LICENSE)

[API Reference](#api-reference) · [Version Management](#version-management) · [Response Fields](#response-fields) · [License & Trademarks](#license--trademarks)

</div>

---

SpectraVersions is the centralized version metadata repository used by the **Spectra Anti-Cheat ecosystem**. It allows integrated clients and tools to retrieve release information, compare builds, evaluate compatibility, and determine whether an update is required.

Version metadata is maintained centrally, so the API endpoints can serve consistent information without maintaining separate release registries.

## What it provides

- **Version discovery** — identifies the latest registered release.
- **Update checks** — compares client and release build numbers.
- **Compatibility metadata** — defines the minimum supported version.
- **Release details** — exposes build numbers, release dates, and changelogs.
- **Download references** — provides the configured release artifact URL.
- **Update severity** — communicates the severity assigned to a release.
- **API access** — makes version information available to Spectra components.

## API Reference

### Production base URL

```text
https://spectra-api-gcmstudio.vercel.app
```

All endpoints below use this base URL.

### Endpoint overview

| Endpoint | Method | Parameters | Purpose |
| --- | --- | --- | --- |
| `/api/check` | `GET` | `current` or `version` (optional) | Returns latest-release metadata and update status. |
| `/api/versions` | `GET` | None | Lists registered versions, newest first. |
| `/api/version` | `GET` | `id` (required) | Returns metadata for a specific version. |

Only `GET`, `HEAD` and `OPTIONS` are accepted; any other method returns `405`. Successful responses are cacheable (`s-maxage=300`); error responses are `no-store`.

| Status | Meaning |
| --- | --- |
| `200` | Success. |
| `400` | Missing or malformed parameter (for example a repeated `id`). |
| `404` | Version not found (`/api/version`). |
| `405` | Method not allowed. |
| `500` | Internal error. Details are logged on the server, never returned to the client. |

### Check for updates

`GET /api/check`

Checks the supplied client version against the latest release.

**Example request**

```http
GET /api/check?current=beta_1.0
```

The `current` parameter can also be supplied as `version`.

**Example response**

```json
{
  "latestVersion": "beta_1.0",
  "needsUpdate": false,
  "belowMinimum": false,
  "currentKnown": true,
  "downloadUrl": "https://raw.githubusercontent.com/GCMStudio/SpectraVersions/refs/tags/beta_1.0/versions/beta_1.0.rbxmx",
  "sha256": "473329d36a2a615f55de56ed4676ebf8d0c1931abe0c21ca2f553b067e3554d9",
  "severity": "none",
  "minimumVersion": "beta_1.0",
  "releaseDate": "2026-06-02",
  "build": 100,
  "changelog": [
    "First public version of Spectra Anti-Cheat. All code works, but is not suitable for public games."
  ],
  "currentBuild": 100,
  "latestBuild": 100
}
```

This is the real response for the current registry. Live values depend on the registry and the request.

**Unknown or missing versions.** If `current` is omitted or is not a registered version, the API answers `needsUpdate: true`, `belowMinimum: null`, `currentKnown: false` and `currentBuild: null`.

> **Security note for client authors:** `belowMinimum: null` means *could not be determined*. Clients **must not** treat `null` as "compliant". Check `currentKnown` to tell an unregistered build from an outdated one.

### List registered versions

`GET /api/versions`

Returns the version catalog, ordered from newest to oldest.

```http
GET /api/versions
```

### Retrieve a specific version

`GET /api/version?id=<version-id>`

Returns metadata for the requested version. The `id` query parameter is required.

```http
GET /api/version?id=beta_1.0
```

## Response Fields

| Field | Description |
| --- | --- |
| `latestVersion` | Identifier of the latest release. |
| `needsUpdate` | Indicates whether the supplied client version needs an update. |
| `belowMinimum` | Indicates whether the supplied client build is below the minimum supported build; may be `null` when it cannot be determined. |
| `currentKnown` | `true` when the supplied version is registered; `false` when it is missing or unknown. |
| `downloadUrl` | Download URL configured for the latest release. Always pinned to a tag or commit, never to a branch. |
| `sha256` | Lowercase hex SHA-256 of the release artifact. Clients must verify it before installing or running the file. |
| `severity` | Severity assigned to the release: `none`, `recommended`, `required` or `critical`. |
| `minimumVersion` | Identifier of the minimum supported version. |
| `releaseDate` | Release date, formatted as `YYYY-MM-DD`. |
| `build` | Build number of the latest release. |
| `changelog` | List of changes associated with the release. |
| `currentBuild` | Build number resolved for the supplied client version. |
| `latestBuild` | Build number of the latest release. |

### Build comparison

Update status is based on numeric build numbers rather than lexical comparison of version identifier strings.

- `needsUpdate` compares the current build with the latest build.
- `belowMinimum` compares the current build with the minimum supported build.
- `belowMinimum` may be `null` when the supplied version cannot be resolved well enough to evaluate compatibility. Treat `null` as untrusted.
- Unregistered versions always get `needsUpdate: true`, even if they look newer; use `currentKnown` to detect them.

Using build numbers avoids misleading string comparisons such as `beta_1.9` versus `beta_1.10`.

## Version Management

The version registry is stored in:

[`data/versions.json`](data/versions.json)

The API endpoints read version metadata from this file.

### Adding a release

1. Put the artifact in `versions/` (for example `versions/beta_1.1.rbxmx`).
2. Compute its hash: `sha256sum versions/beta_1.1.rbxmx`.
3. Open `data/versions.json` and add the release inside the `versions` object with a unique identifier and a unique, numeric `build`.
4. Fill in `minimumVersion`, `releaseDate`, `severity`, `changelog`, `sha256` and `downloadUrl`.
5. Point `downloadUrl` to the **tag** of the release, never to `main`.
6. Update the top-level `latest` value when the new release becomes the latest public release.
7. Run `npm run validate` and `npm test`.
8. Merge, then create and push the matching git tag (for example `git tag beta_1.1 && git push origin beta_1.1`) **before** clients start using the new `downloadUrl`.

**Example configuration**

```json
{
  "latest": "beta_1.1",
  "versions": {
    "beta_1.0": {
      "...": "Existing version metadata"
    },
    "beta_1.1": {
      "minimumVersion": "beta_1.0",
      "build": 110,
      "releaseDate": "2026-07-10",
      "severity": "recommended",
      "changelog": [
        "Example release change"
      ],
      "sha256": "<output of sha256sum versions/beta_1.1.rbxmx>",
      "downloadUrl": "https://raw.githubusercontent.com/GCMStudio/SpectraVersions/refs/tags/beta_1.1/versions/beta_1.1.rbxmx"
    }
  }
}
```

### Automatic validation

`npm run validate` (also executed by CI on every push and pull request) checks that:

- `latest` and every `minimumVersion` exist, and no minimum is newer than its release;
- `build` values are positive integers and unique;
- `releaseDate` is a real `YYYY-MM-DD` date and `severity` is one of the allowed values;
- `changelog` is a non-empty array of strings;
- `downloadUrl` uses `https` and does not point to a mutable branch;
- artifacts hosted in this repository exist and match the declared `sha256`.

The editor-friendly JSON Schema lives in [`schema/versions.schema.json`](schema/versions.schema.json).

### Release checklist

- [ ] The version identifier is unique.
- [ ] The build number is numeric, unique and appropriate for the release.
- [ ] `latest` points to an entry that exists in `versions`.
- [ ] The minimum supported version matches the intended compatibility policy.
- [ ] The release date, severity, and changelog are accurate.
- [ ] `sha256` matches the artifact (`npm run validate` passes).
- [ ] The download URL points to the release **tag**, and the tag has been pushed.
- [ ] The deployed API returns the expected metadata.

## Security

- **Verify before running.** Clients must download `downloadUrl`, compute the SHA-256 of the bytes and compare it with the `sha256` field before installing or executing anything.
- **Immutable artifacts.** Release URLs are pinned to tags so a later commit cannot silently change what clients download. Protect `main` and the release tags in the repository settings (branch protection, required reviews, tag protection).
- **Binary files.** `.gitattributes` marks `versions/*.rbxmx` as non-text so line-ending conversion cannot change the hash.
- **Reporting vulnerabilities.** See [SECURITY.md](SECURITY.md).

## Spectra Ecosystem

SpectraVersions supports version management for components in the Spectra ecosystem, including:

- **Spectra API** — serves version metadata and update checks.
- **Spectra Installer** — retrieves release information for installation workflows.
- **Spectra Updater** — evaluates version differences and update requirements.
- **Spectra Studio Plugin** — checks release compatibility and update availability.

## Repository Files

| Path | Purpose |
| --- | --- |
| `api/` | API endpoint implementations (`api/_lib` holds shared logic and validation). |
| `schema/versions.schema.json` | JSON Schema for the registry. |
| `scripts/validate.js` | Registry and artifact-hash validation (`npm run validate`). |
| `tests/` | Automated tests (`npm test`). |
| `.github/workflows/ci.yml` | CI: validation and tests on every push and pull request. |
| `package.json` | Declares ES modules and the minimum Node.js version. |
| `SECURITY.md` | How to report vulnerabilities. |
| `data/versions.json` | Central version metadata registry. |
| `versions/` | Release artifacts referenced by version metadata. |
| `LICENSE` | Project license. |
| `NOTICE` | License notices. |
| `TRADEMARKS.md` | Trademark terms for Spectra and GCM Studio. |
| `vercel.json` | Vercel deployment configuration. |

## License & Trademarks

SpectraVersions is licensed under the **Apache License 2.0**. The names **Spectra** and **GCM Studio** are covered separately by the trademark policy in [TRADEMARKS.md](TRADEMARKS.md).

Review the repository's legal documents:

- [LICENSE](LICENSE)
- [NOTICE](NOTICE)
- [TRADEMARKS.md](TRADEMARKS.md)

The project license and trademark permissions are distinct. Use of the Spectra or GCM Studio names must follow the applicable trademark terms.

---

<div align="center">

**GCM Studio · Spectra Ecosystem**

*Centralized metadata. Consistent releases. Reliable version checks.*

</div>

```text
░██████╗░░█████╗░███╗░░░███╗  ░██████╗████████╗██╗░░░██╗██████╗░██╗░█████╗░
██╔════╝░██╔══██╗████╗░████║  ██╔════╝╚══██╔══╝██║░░░██║██╔══██╗██║██╔══██╗
██║░░██╗░██║░░╚═╝██╔████╔██║  ╚█████╗░░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
██║░░╚██╗██║░░██╗██║╚██╔╝██║  ░╚═══██╗░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
╚██████╔╝╚█████╔╝██║░╚═╝░██║  ██████╔╝░░░██║░░░╚██████╔╝██████╔╝██║╚█████╔╝
░╚═════╝░░╚════╝░╚═╝░░░░░╚═╝  ╚═════╝░░░░╚═╝░░░░╚═════╝░╚═════╝░╚═╝░╚════╝░
```
