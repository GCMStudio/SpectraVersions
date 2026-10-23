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
  "needsUpdate": true,
  "belowMinimum": false,
  "downloadUrl": "https://raw.githubusercontent.com/GCMStudio/SpectraVersions/main/versions/beta_1.0.rbxmx",
  "severity": "none",
  "minimumVersion": "beta_1.0",
  "releaseDate": "2026-06-02",
  "build": 100,
  "changelog": ["..."],
  "currentBuild": 90,
  "latestBuild": 100
}
```

The values above illustrate the response shape; live values depend on the version registry and the request.

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
| `downloadUrl` | Download URL configured for the latest release. |
| `severity` | Severity value assigned to the release. |
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
- `belowMinimum` may be `null` when the supplied version cannot be resolved well enough to evaluate compatibility.

Using build numbers avoids misleading string comparisons such as `beta_1.9` versus `beta_1.10`.

## Version Management

The version registry is stored in:

[`data/versions.json`](data/versions.json)

The API endpoints read version metadata from this file.

### Adding a release

1. Open `data/versions.json`.
2. Add the new release inside the `versions` object.
3. Assign a unique version identifier and a numeric `build`.
4. Define the release metadata, including compatibility, release date, severity, changelog, and download URL.
5. Update the top-level `latest` value when the new release becomes the latest public release.
6. Validate the JSON and test the deployed endpoints.

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
      "downloadUrl": "https://raw.githubusercontent.com/GCMStudio/SpectraVersions/main/versions/beta_1.1.rbxmx"
    }
  }
}
```

The existing version is abbreviated in this example. Preserve any additional fields required by the API implementation.

### Release checklist

- [ ] The version identifier is unique.
- [ ] The build number is numeric and appropriate for the release.
- [ ] `latest` points to an entry that exists in `versions`.
- [ ] The minimum supported version matches the intended compatibility policy.
- [ ] The release date, severity, and changelog are accurate.
- [ ] The download URL points to the intended artifact.
- [ ] The deployed API returns the expected metadata.

## Spectra Ecosystem

SpectraVersions supports version management for components in the Spectra ecosystem, including:

- **Spectra API** — serves version metadata and update checks.
- **Spectra Installer** — retrieves release information for installation workflows.
- **Spectra Updater** — evaluates version differences and update requirements.
- **Spectra Studio Plugin** — checks release compatibility and update availability.

## Repository Files

| Path | Purpose |
| --- | --- |
| `api/` | API endpoint implementations. |
| `data/versions.json` | Central version metadata registry. |
| `versions/` | Release artifacts referenced by version metadata. |
| `LICENSE` | Project license. |
| `NOTICE` | License notices. |
| `TRADEMARKS.md` | Trademark terms for Spectra and GCM Studio. |
| `vercel.json` | Vercel deployment configuration. |

## License & Trademarks

SpectraVersions is licensed under the **Apache License 2.0**, subject to the modified trademark terms covering the names **Spectra** and **GCM Studio**.

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
██║░░██╗░██║░░╚═╝██╔████╔██║  ╚█████╗ ░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
██║░░╚██╗██║░░██╗██║╚  ╔╝██║  ░╚═══██╗░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
╚██████╔╝╚█████╔╝██║░╚═╝░██║  ██████╔╝░░░██║░░░╚██████╔╝██████╔╝██║╚█████╔╝
░╚═════╝░░╚════╝░╚═╝░░░░░╚═╝  ╚═════╝░░░░╚═════╝░╚═════╝░╚═════╝░╚═╝░░░░░
```
