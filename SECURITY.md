# Security Policy

SpectraVersions distributes update metadata (and release artifacts) to Spectra
Anti-Cheat clients, so integrity problems here can affect every installation.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private reporting: open the repository's **Security** tab and choose
**Report a vulnerability**. Include what you found, how to reproduce it and the
possible impact.

## What is in scope

- Ways to make the API return wrong or manipulated version metadata.
- Ways to change a published artifact, or to make its `sha256` stop matching.
- Mistakes in the registry that would make clients accept a tampered file.

## Integrity model

- Every release lists a `sha256`; clients must verify it before running the file.
- Release URLs are pinned to git tags, not branches.
- CI re-computes the hash of every artifact stored in this repository.
