import { getVersion, handleCors } from "./_lib/versions.js";

export default function handler(req, res) {
    if (handleCors(req, res)) return;

    const id = req.query.id;

    if (!id) {
        return res.status(400).json({
            error: "Parâmetro 'id' é obrigatório (ex: ?id=beta_1.0)."
        });
    }

    try {
        const info = getVersion(id);

        if (!info) {
            return res.status(404).json({
                error: `Versão '${id}' não encontrada.`
            });
        }

        return res.status(200).json(info);

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
}
