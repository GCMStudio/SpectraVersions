import {
    getVersion,
    prepare,
    singleParam,
    sendClientError,
    sendServerError
} from "./_lib/versions.js";

export default function handler(req, res) {
    if (prepare(req, res)) return;

    const { value: id, invalid } = singleParam(req.query.id);

    if (invalid) {
        return sendClientError(res, 400, "Parameter 'id' must be a single value.");
    }

    if (!id) {
        return sendClientError(res, 400, "Parameter 'id' is required (e.g. ?id=beta_1.0).");
    }

    try {
        const info = getVersion(id);

        if (!info) {
            return sendClientError(res, 404, "Version not found.");
        }

        return res.status(200).json(info);
    } catch (err) {
        return sendServerError(res, err);
    }
}
