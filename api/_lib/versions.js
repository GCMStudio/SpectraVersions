import fs from "fs";
import path from "path";

let cache = null;

export function loadConfig() {
    if (cache) return cache;

    const filePath = path.join(process.cwd(), "data", "versions.json");
    const raw = fs.readFileSync(filePath, "utf8");

    let config;
    try {
        config = JSON.parse(raw);
    } catch {
        throw new Error("data/versions.json não é um JSON válido.");
    }

    if (!config || typeof config !== "object" || Array.isArray(config)) {
        throw new Error("data/versions.json precisa ser um objeto JSON.");
    }

    if (!config.latest || typeof config.latest !== "string") {
        throw new Error("data/versions.json precisa ter uma chave 'latest' (string).");
    }

    if (!config.versions || typeof config.versions !== "object") {
        throw new Error("data/versions.json precisa ter um objeto 'versions'.");
    }

    if (!config.versions[config.latest]) {
        throw new Error(
            `'latest' aponta para '${config.latest}', mas essa chave não existe em 'versions'.`
        );
    }

    cache = config;
    return config;
}

export function getVersion(id) {
    if (!id) return null;
    const config = loadConfig();
    const info = config.versions[id];
    return info ? { id, ...info } : null;
}

export function getLatest() {
    const config = loadConfig();
    return { id: config.latest, ...config.versions[config.latest] };
}

export function listVersions() {
    const config = loadConfig();
    return Object.entries(config.versions)
        .map(([id, info]) => ({ id, ...info }))
        .sort((a, b) => (b.build ?? 0) - (a.build ?? 0));
}
export function buildOf(info) {
    return typeof info?.build === "number" ? info.build : null;
}

export function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function handleCors(req, res) {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return true;
    }
    return false;
}

export function invalidateCache() {
    cache = null;
}
