import fs from "node:fs";
import path from "node:path";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

// Version identifiers: letters, digits, dot, underscore, hyphen (max 64 chars).
// Must start with a letter or digit, so "__proto__" is rejected by design.
export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export const SEVERITIES = ["none", "recommended", "required", "critical"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MUTABLE_REFS = new Set(["main", "master", "head"]);

const CACHE_CONTROL =
    "public, max-age=60, s-maxage=300, stale-while-revalidate=600";

/* ------------------------------------------------------------------ */
/* Validation (pure: easy to test and reuse in scripts/validate.js)    */
/* ------------------------------------------------------------------ */

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isRealDate(value) {
    if (!DATE_PATTERN.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * For raw.githubusercontent.com URLs, returns the git ref segment
 * (e.g. "main", or "refs/heads/main", or "refs/tags/beta_1.0").
 * Returns null for other hosts.
 */
export function githubRawRef(url) {
    if (url.hostname !== "raw.githubusercontent.com") return null;
    const segs = url.pathname.split("/").filter(Boolean);
    if (segs.length < 4) return null;
    if (segs[2] === "refs" && segs.length >= 5) {
        return { ref: `${segs[3]}/${segs[4]}`, mutable: segs[3] === "heads", rest: segs.slice(5) };
    }
    return { ref: segs[2], mutable: MUTABLE_REFS.has(segs[2].toLowerCase()), rest: segs.slice(3) };
}

/**
 * Validates the whole registry and returns a list of error strings
 * (empty list = valid). It never throws.
 */
export function validateConfig(config) {
    const errors = [];

    if (!isPlainObject(config)) {
        return ["data/versions.json must be a JSON object."];
    }

    if (typeof config.latest !== "string" || !config.latest) {
        errors.push("Missing top-level 'latest' (string).");
    }

    if (!isPlainObject(config.versions)) {
        errors.push("Missing top-level 'versions' (object).");
        return errors;
    }

    const ids = Object.keys(config.versions);
    if (ids.length === 0) {
        errors.push("'versions' must contain at least one release.");
    }

    if (typeof config.latest === "string" && !Object.hasOwn(config.versions, config.latest)) {
        errors.push(`'latest' points to '${config.latest}', which does not exist in 'versions'.`);
    }

    const seenBuilds = new Map();

    for (const id of ids) {
        const info = config.versions[id];
        const at = `versions.${id}`;

        if (!ID_PATTERN.test(id)) {
            errors.push(`${at}: invalid identifier (allowed: letters, digits, '.', '_', '-'; max 64 chars; must start with a letter or digit).`);
        }

        if (!isPlainObject(info)) {
            errors.push(`${at}: must be an object.`);
            continue;
        }

        // build
        if (!Number.isInteger(info.build) || info.build <= 0) {
            errors.push(`${at}.build: must be a positive integer.`);
        } else if (seenBuilds.has(info.build)) {
            errors.push(`${at}.build: ${info.build} is already used by '${seenBuilds.get(info.build)}'.`);
        } else {
            seenBuilds.set(info.build, id);
        }

        // releaseDate
        if (typeof info.releaseDate !== "string" || !isRealDate(info.releaseDate)) {
            errors.push(`${at}.releaseDate: must be a real date formatted as YYYY-MM-DD.`);
        }

        // severity
        if (!SEVERITIES.includes(info.severity)) {
            errors.push(`${at}.severity: must be one of ${SEVERITIES.join(", ")}.`);
        }

        // changelog
        if (
            !Array.isArray(info.changelog) ||
            info.changelog.length === 0 ||
            info.changelog.some((line) => typeof line !== "string" || !line.trim())
        ) {
            errors.push(`${at}.changelog: must be a non-empty array of non-empty strings.`);
        }

        // sha256
        if (typeof info.sha256 !== "string" || !SHA256_PATTERN.test(info.sha256)) {
            errors.push(`${at}.sha256: must be 64 lowercase hex characters.`);
        }

        // downloadUrl
        if (typeof info.downloadUrl !== "string") {
            errors.push(`${at}.downloadUrl: must be a string.`);
        } else {
            let url = null;
            try {
                url = new URL(info.downloadUrl);
            } catch {
                errors.push(`${at}.downloadUrl: not a valid URL.`);
            }
            if (url) {
                if (url.protocol !== "https:") {
                    errors.push(`${at}.downloadUrl: must use https.`);
                }
                const raw = githubRawRef(url);
                if (raw?.mutable) {
                    errors.push(
                        `${at}.downloadUrl: points to a mutable branch ('${raw.ref}'). Use a tag (…/refs/tags/<tag>/…) or a commit hash so the artifact cannot change after release.`
                    );
                }
            }
        }

        // minimumVersion (checked below, after every build is known)
        if (typeof info.minimumVersion !== "string" || !info.minimumVersion) {
            errors.push(`${at}.minimumVersion: must be a version identifier.`);
        }
    }

    // minimumVersion must exist and must not be newer than the release itself
    for (const id of ids) {
        const info = config.versions[id];
        if (!isPlainObject(info) || typeof info.minimumVersion !== "string") continue;

        if (!Object.hasOwn(config.versions, info.minimumVersion)) {
            errors.push(`versions.${id}.minimumVersion: '${info.minimumVersion}' does not exist in 'versions'.`);
            continue;
        }
        const min = config.versions[info.minimumVersion];
        if (Number.isInteger(info.build) && Number.isInteger(min?.build) && min.build > info.build) {
            errors.push(`versions.${id}.minimumVersion: '${info.minimumVersion}' has a higher build than '${id}'.`);
        }
    }

    return errors;
}

/* ------------------------------------------------------------------ */
/* Loading and lookup                                                  */
/* ------------------------------------------------------------------ */

let cache = null;

export function loadConfig() {
    if (cache) return cache;

    const filePath = path.join(process.cwd(), "data", "versions.json");
    const raw = fs.readFileSync(filePath, "utf8");

    let config;
    try {
        config = JSON.parse(raw);
    } catch {
        throw new Error("data/versions.json is not valid JSON.");
    }

    const errors = validateConfig(config);
    if (errors.length > 0) {
        throw new Error(`data/versions.json is invalid:\n- ${errors.join("\n- ")}`);
    }

    cache = config;
    return config;
}

export function invalidateCache() {
    cache = null;
}

/**
 * Returns the release metadata for `id`, or null.
 * Only OWN properties count, so inherited names such as "constructor",
 * "toString" or "__proto__" are never treated as versions.
 */
export function getVersion(id) {
    if (typeof id !== "string" || !ID_PATTERN.test(id)) return null;
    const { versions } = loadConfig();
    if (!Object.hasOwn(versions, id)) return null;
    return { id, ...versions[id] };
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
    return Number.isInteger(info?.build) ? info.build : null;
}

/* ------------------------------------------------------------------ */
/* HTTP helpers shared by every endpoint                               */
/* ------------------------------------------------------------------ */

export function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Handles CORS, OPTIONS preflight, method filtering and cache headers.
 * Returns true when the response was already sent (the handler must stop).
 */
export function prepare(req, res) {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
        res.status(204).end();
        return true;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD, OPTIONS");
        res.status(405).json({ error: "Method not allowed. Use GET." });
        return true;
    }

    res.setHeader("Cache-Control", CACHE_CONTROL);
    return false;
}

/** Logs the real error on the server, returns a generic message to the client. */
export function sendServerError(res, err) {
    console.error("[SpectraVersions]", err);
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).json({ error: "Internal server error." });
}

/**
 * Reads a query parameter that must be a single string.
 * Returns { value, invalid }: value is null when absent/empty;
 * invalid is true when the parameter was repeated (?a=1&a=2).
 */
export function singleParam(value) {
    if (value === undefined || value === null || value === "") {
        return { value: null, invalid: false };
    }
    if (typeof value !== "string") {
        return { value: null, invalid: true };
    }
    return { value, invalid: false };
}

/** Client errors (400/404) must never be cached. */
export function sendClientError(res, status, message) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(status).json({ error: message });
}
