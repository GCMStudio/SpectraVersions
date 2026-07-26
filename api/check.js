import fs from "fs";
import path from "path";

export default function handler(req, res) {
    try {
        const currentVersion =
            req.query.current ||
            req.query.version ||
            "0.0.0";

        const filePath = path.join(
            process.cwd(),
            "data",
            "versions.json"
        );

        const config = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        const latest = config.latest;
        const latestInfo = config.versions[latest];

        return res.status(200).json({
            latestVersion: latest,
            needsUpdate: currentVersion !== latest,
            downloadUrl: latestInfo.downloadUrl,
            severity: latestInfo.severity,
            minimumVersion: latestInfo.minimumVersion,
            releaseDate: latestInfo.releaseDate,
            build: latestInfo.build,
            changelog: latestInfo.changelog
        });

    } catch (err) {

        return res.status(500).json({
            error: err.message
        });

    }
}
