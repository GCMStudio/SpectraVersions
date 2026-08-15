import { listVersions, handleCors } from "./_lib/versions.js";

export default function handler(req, res) {
    if (handleCors(req, res)) return;

    try {
        return res.status(200).json({
            versions: listVersions()
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
}
