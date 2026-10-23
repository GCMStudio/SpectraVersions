# SpectraVersions

**Official version metadata repository for the Spectra Anti-Cheat ecosystem.**

SpectraVersions provides a centralized source of truth for release metadata, version compatibility, update requirements, and build information across the Spectra ecosystem.

Designed to work alongside the Spectra API and its associated tools, this repository enables consistent version checks and reliable update management.

## Overview

SpectraVersions maintains version metadata through a centralized `data/versions.json` file.

The metadata includes:

- **Version Management** — Identifies the latest available release.
- **Compatibility** — Defines the minimum supported version.
- **Update Status** — Determines whether a client needs to update.
- **Release Information** — Stores release dates and build numbers.
- **Update Severity** — Indicates the importance of an update.
- **Changelog** — Provides a summary of changes for each release.
- **Download Information** — Defines the download location for each version.

## API Reference

### Base URL

Set the production base URL to your deployed Vercel application:

`https://<your-deployment>.vercel.app`

Replace the placeholder with the actual deployment domain.

### Endpoints

| Endpoint | Method | Parameters | Description |
|---|---|---|---|
| `/api/check` | `GET` | `current` or `version` (optional) | Checks the latest release and determines update requirements. |
| `/api/versions` | `GET` | None | Returns all registered versions, newest first. |
| `/api/version` | `GET` | `id` (required) | Returns metadata for a specific version. |

### `GET /api/check`

Checks the latest release against the client's current version.

**Example request:**

`/api/check?current=beta_1.0`

The `current` parameter can also be supplied as `version`, according to the API implementation.

**Example response:**

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

#### Response fields

| Field | Description |
|---|---|
| `latestVersion` | Identifier of the latest release. |
| `needsUpdate` | Indicates whether the client should update. |
| `belowMinimum` | Indicates whether the client is below the minimum supported build. |
| `downloadUrl` | Download URL of the latest release. |
| `severity` | Update severity associated with the release. |
| `minimumVersion` | Minimum supported version identifier. |
| `releaseDate` | Release date in `YYYY-MM-DD` format. |
| `build` | Build number of the latest release. |
| `changelog` | List of changes included in the release. |
| `currentBuild` | Build number of the supplied client version. |
| `latestBuild` | Build number of the latest release. |

#### Version comparison

Update requirements are determined using numeric build numbers rather than comparing version identifier strings.

- `needsUpdate` compares the current build against the latest build.
- `belowMinimum` compares the current build against the minimum supported build.
- `belowMinimum` may return `null` when the API cannot determine whether the supplied version meets the minimum requirement, such as when its metadata is unavailable.

This approach avoids relying on lexical comparisons between identifiers such as `beta_1.9` and `beta_1.10`.

### `GET /api/versions`

Returns the registered version catalog, ordered from newest to oldest.

Example:

`/api/versions`

Use this endpoint when a client or tool needs to retrieve the available release metadata.

### `GET /api/version`

Returns the metadata associated with a specific version identifier.

**Example request:**

`/api/version?id=beta_1.0`

The `id` parameter is required.

## Version Management

All version metadata is maintained in:

`data/versions.json`

The API endpoints read from this file, so adding a release does not require modifying each endpoint individually.

### Adding a new version

1. Open `data/versions.json`.
2. Add the new release under the `versions` object.
3. Assign a unique identifier and numeric build number.
4. Set its minimum supported version, release date, update severity, changelog, and download URL.
5. Update the top-level `latest` field when the release becomes the latest public version.
6. Verify that the JSON is valid and the deployed API returns the expected metadata.

**Example configuration:**

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

The existing release entry is abbreviated in this example. Preserve the actual metadata fields required by your implementation.

### Versioning guidelines

- Use a unique identifier for every release.
- Keep build numbers numeric and consistent.
- Increment build numbers when publishing new builds.
- Ensure the `latest` field references an existing version.
- Ensure each `downloadUrl` points to the intended release artifact.
- Set `minimumVersion` according to the compatibility requirements of the release.
- Keep changelog entries concise and relevant.

## Spectra Ecosystem

SpectraVersions supports version management across the Spectra ecosystem, including:

- **Spectra API** — Version metadata and update checks.
- **Spectra Installer** — Release information for installation workflows.
- **Spectra Updater** — Version comparison and update requirements.
- **Spectra Studio Plugin** — Release compatibility and update checks.

## License & Trademarks

This project is licensed under the **Apache License 2.0**, with a modified trademarks section covering the use of the names **Spectra** and **GCM Studio**.

Please review the following files for the applicable terms:

- [LICENSE](https://github.com/GCMStudio/SpectraVersions/blob/main/LICENSE)
- [NOTICE](https://github.com/GCMStudio/SpectraVersions/blob/main/NOTICE)
- [TRADEMARKS.md](https://github.com/GCMStudio/SpectraVersions/blob/main/TRADEMARKS.md)

The Apache License does not, by itself, grant permission to use the project's protected trademarks beyond the rights expressly permitted by the applicable terms.

---

```text
░██████╗░░█████╗░███╗░░░███╗  ░██████╗████████╗██╗░░░██╗██████╗░██╗░█████╗░
██╔════╝░██╔══██╗████╗░████║  ██╔════╝╚══██╔══╝██║░░░██║██╔══██╗██║██╔══██╗
██║░░██╗░██║░░╚═╝██╔████╔██║  ╚█████╗ ░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
██║░░╚██╗██║░░██╗██║╚██╔╝██║  ░╚═══██╗░░░██║░░░██║░░░██║██║░░██║██║██║░░██║
╚██████╔╝╚█████╔╝██║░╚═╝░██║  ██████╔╝░░░██║░░░╚██████╔╝██████╔╝██║╚█████╔╝
░╚═════╝░░╚════╝░╚═╝░░░░░╚═╝  ╚═════╝░░░░╚═════╝░╚═════╝░╚═╝░░░░░╚═╝░░░░░
```
