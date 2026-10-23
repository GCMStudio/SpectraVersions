import { listVersions, prepare, sendServerError } from "./_lib/versions.js";

export default function handler(req, res) {
    if (prepare(req, res)) return;

    try {
        return res.status(200).json({
            versions: listVersions()
        });
    } catch (err) {
        return sendServerError(res, err);
    }
}
