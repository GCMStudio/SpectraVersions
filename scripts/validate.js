// Usage: npm run validate
// Validates data/versions.json and checks that every artifact hosted in this
// repository exists and matches its declared SHA-256.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { validateConfig, githubRawRef } from "../api/_lib/versions.js";

const root = process.cwd();
const file = path.join(root, "data", "versions.json");

let config;
try {
    config = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (err) {
    console.error(`✖ Could not read data/versions.json: ${err.message}`);
    process.exit(1);
}

const errors = validateConfig(config);

if (errors.length === 0) {
    for (const [id, info] of Object.entries(config.versions)) {
        const raw = githubRawRef(new URL(info.downloadUrl));
        if (!raw) continue; // external host: cannot be checked offline

        const local = path.join(root, ...raw.rest);
        if (!local.startsWith(path.join(root, "versions") + path.sep)) {
            errors.push(`versions.${id}.downloadUrl: artifact must live under versions/ (got '${raw.rest.join("/")}').`);
            continue;
        }
        if (!fs.existsSync(local)) {
            errors.push(`versions.${id}: artifact '${raw.rest.join("/")}' does not exist in the repository.`);
            continue;
        }

        const hash = crypto.createHash("sha256").update(fs.readFileSync(local)).digest("hex");
        if (hash !== info.sha256) {
            errors.push(
                `versions.${id}.sha256: declared ${info.sha256} but the file hashes to ${hash}.`
            );
        }
    }
}

if (errors.length > 0) {
    console.error("✖ Registry is invalid:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
}

console.log(`✔ data/versions.json is valid (${Object.keys(config.versions).length} release(s), latest: ${config.latest}).`);
