import { getLatest, getVersion, buildOf, handleCors } from "./_lib/versions.js";

export default function handler(req, res) {
    if (handleCors(req, res)) return;

    try {
        const currentVersion =
            req.query.current ||
            req.query.version ||
            "0.0.0";

        const latest = getLatest();
        const currentInfo = getVersion(currentVersion);

        const currentBuild = buildOf(currentInfo);
        const latestBuild = buildOf(latest);
        
        const needsUpdate =
            currentBuild !== null && latestBuild !== null
                ? currentBuild < latestBuild
                : currentVersion !== latest.id;

        const minimumInfo = latest.minimumVersion ? getVersion(latest.minimumVersion) : null;
        const minimumBuild = buildOf(minimumInfo);

        const belowMinimum =
            currentBuild !== null && minimumBuild !== null
                ? currentBuild < minimumBuild
                : null;

        return res.status(200).json({
            latestVersion: latest.id,
            needsUpdate,
            belowMinimum,
            downloadUrl: latest.downloadUrl,
            severity: latest.severity,
            minimumVersion: latest.minimumVersion,
            releaseDate: latest.releaseDate,
            build: latest.build,
            changelog: latest.changelog,
            currentBuild,
            latestBuild
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }
}
