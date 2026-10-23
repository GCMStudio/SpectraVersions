 <div align="center">

# SpectraVersions

### Official Version Metadata for Spectra Anti-Cheat

A centralized version registry powering release tracking, compatibility checks, and update management across the Spectra ecosystem.

[![GitHub Repository](https://img.shields.io/badge/GitHub-GCMStudio%2FSpectraVersions-181717?style=flat-square&logo=github)](https://github.com/GCMStudio/SpectraVersions)
[![API](https://img.shields.io/badge/API-Version%20Registry-2563eb?style=flat-square)](#api-reference)
[![License](https://img.shields.io/badge/License-Apache%202.0-22c55e?style=flat-square)](LICENSE)

**[Repository](https://github.com/GCMStudio/SpectraVersions) · [API Reference](#api-reference) · [Version Management](#version-management) · [License](#license--trademarks)**

</div>

---

## Overview

SpectraVersions is the official version metadata repository for the **Spectra Anti-Cheat ecosystem**.

It provides a centralized source of truth for release information, allowing integrated clients and tools to determine the latest available version, verify compatibility, and identify required updates.

The repository is designed to work with the Spectra API and associated distribution tools without requiring individual endpoints to maintain separate version registries.

## Features

- **Centralized Registry** — Maintains version metadata in a single JSON file.
- **Version Checks** — Determines whether a client should update.
- **Compatibility Validation** — Defines minimum supported versions.
- **Build Tracking** — Uses numeric build identifiers for version comparisons.
- **Release Metadata** — Stores release dates, download URLs, and changelogs.
- **Update Severity** — Communicates the importance of a release.
- **API Integration** — Provides endpoints for retrieving version information.

## API Reference

### Production

Configure the base URL to point to your deployed Vercel application.

```text
https://<your-deployment>.vercel.app
```

Replace `<your-deployment>` with the actual deployment domain.

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/check` | `GET` | Checks update requirements against the latest release. |
| `/api/versions` | `GET` | Returns the registered versions, newest first. |
| `/api/version?id=<id>` | `GET` | Retrieves metadata for a specific version. |

### Check for updates

`GET /api/check`

Checks the latest release and compares it against the client's current version.

**Query parameters**

| Parameter | Required | Description |
|---|---|---|
| `current` | No | Current version identifier. |
| `version` | No | Alternative parameter for specifying the current version. |

Example:

```http
GET /api/check?current=beta_1.0
```

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

**Response fields**

| Field | Description |
|---|---|
| `latestVersion` | Latest registered release identifier. |
| `needsUpdate` | Whether the client needs to update. |
| `belowMinimum` | Whether the client is below the minimum supported build. |
| `downloadUrl` | Download location of the latest release. |
| `severity` | Severity assigned to the latest release. |
| `minimumVersion` | Minimum supported version identifier. |
| `releaseDate` | Release date in `YYYY-MM-DD` format. |
| `build` | Latest release build number. |
| `changelog` | List of changes included in the release. |
| `currentBuild` | Build number associated with the supplied version. |
| `latestBuild` | Build number of the latest release. |

#### Build comparison

Version checks rely on numeric build identifiers rather than lexical comparisons of version strings.

- `needsUpdate` compares the current build against the latest build.
- `belowMinimum` compares the current build against the minimum supported build.
- `belowMinimum` can return `null` when the API cannot determine the current version's compatibility.

This avoids unreliable comparisons between identifiers such as `beta_1.9` and `beta_1.10`.

### List all versions

`GET /api/versions`

Returns the registered version catalog, ordered from newest to oldest.

```http
GET /api/versions
```

### Retrieve a specific version

`GET /api/version?id=<id>`

Returns the metadata associated with a specific version identifier.

```http
GET /api/version?id=beta_1.0
```

The `id` query parameter is required.

## Version Management

All release metadata is maintained in:

```text
data/versions.json
```

The API endpoints read from this file, keeping version information centralized.

### Adding a release

1. Open `data/versions.json`.
2. Add the new version under the `versions` object.
3. Assign a unique identifier and numeric build number.
4. Define the compatibility requirements and release metadata.
5. Update `latest` when the new release becomes the latest public version.
6. Verify the JSON and test the deployed API endpoints.

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

The existing release is abbreviated in this example. Preserve any additional fields required by the API implementation.

### Release guidelines

- Keep version identifiers unique.
- Use numeric build numbers for reliable comparisons.
- Ensure `latest` references an existing version.
- Keep download URLs synchronized with the intended release artifacts.
- Set `minimumVersion` according to actual compatibility requirements.
- Maintain accurate release dates and changelogs.

## Spectra Ecosystem

SpectraVersions provides version metadata for components across the Spectra ecosystem.

| Component | Purpose |
|---|---|
| Spectra API | Serves version information and update checks. |
| Spectra Installer | Retrieves release information during installation. |
| Spectra Updater | Evaluates version differences and update requirements. |
| Spectra Studio Plugin | Checks release compatibility and update availability. |

## Repository Structure

```text
SpectraVersions/
├── api/
│   ├── check
│   ├── versions
│   └── version
├── data/
│   └── versions.json
├── versions/
│   └── <release>.rbxmx
├── LICENSE
├── NOTICE
├── TRADEMARKS.md
└── README.md
```

*Illustrative structure based on the documented components; adjust paths to match the actual repository.*

## License & Trademarks

This project is licensed under the **Apache License 2.0**, with a modified trademarks section covering the use of the **Spectra** and **GCM Studio** names.

Refer to the following files for the applicable terms:

- [LICENSE](https://github.com/GCMStudio/SpectraVersions/blob/main/LICENSE)
- [NOTICE](https://github.com/GCMStudio/SpectraVersions/blob/main/NOTICE)
- [TRADEMARKS.md](https://github.com/GCMStudio/SpectraVersions/blob/main/TRADEMARKS.md)

The applicable trademark restrictions remain separate from the general copyright license grant.

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
░╚═════╝░░╚════╝░╚═╝░░░░░╚═╝  ╚═════╝░░░░╚═════╝░╚═════╝░╚═╝░░░░░╚═╝░░░░░
```
