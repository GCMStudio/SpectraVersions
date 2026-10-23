import {
    getLatest,
    getVersion,
    buildOf,
    prepare,
    singleParam,
    sendClientError,
    sendServerError
} from "./_lib/versions.js";

export default function handler(req, res) {
    if (prepare(req, res)) return;

    try {
        const current = singleParam(req.query.current);
        const alias = singleParam(req.query.version);

        if (current.invalid || alias.invalid) {
            return sendClientError(res, 400, "Parameter 'current' (or 'version') must be a single value.");
        }

        // No default like "0.0.0": a missing version is simply "unknown".
        const currentVersion = current.value ?? alias.value;

        const latest = getLatest();
        const currentInfo = currentVersion ? getVersion(currentVersion) : null;
        const currentKnown = currentInfo !== null;

        const currentBuild = buildOf(currentInfo);
        const latestBuild = buildOf(latest);

        // Unknown versions are treated as outdated (safe default for an anti-cheat).
        // Clients can tell the difference through `currentKnown`.
        const needsUpdate = currentBuild === null ? true : currentBuild < latestBuild;

        const minimumBuild = buildOf(latest.minimumVersion ? getVersion(latest.minimumVersion) : null);

        // null means "could not be determined". Clients MUST NOT treat null as compliant.
        const belowMinimum =
            currentBuild !== null && minimumBuild !== null ? currentBuild < minimumBuild : null;

        return res.status(200).json({
            latestVersion: latest.id,
            needsUpdate,
            belowMinimum,
            currentKnown,
            downloadUrl: latest.downloadUrl,
            sha256: latest.sha256,
            severity: latest.severity,
            minimumVersion: latest.minimumVersion,
            releaseDate: latest.releaseDate,
            build: latest.build,
            changelog: latest.changelog,
            currentBuild,
            latestBuild
        });
    } catch (err) {
        return sendServerError(res, err);
    }
}
