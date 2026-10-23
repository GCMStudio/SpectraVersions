import test from "node:test";
import assert from "node:assert/strict";

import { getVersion, getLatest, listVersions, validateConfig, loadConfig } from "../api/_lib/versions.js";
import checkHandler from "../api/check.js";
import versionHandler from "../api/version.js";
import versionsHandler from "../api/versions.js";

/* ---------- tiny mock of the Vercel req/res objects ---------- */
function run(handler, { method = "GET", query = {} } = {}) {
    const res = {
        statusCode: 200,
        headers: {},
        body: undefined,
        setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
        status(code) { this.statusCode = code; return this; },
        json(obj) { this.body = obj; return this; },
        end() { return this; }
    };
    handler({ method, query }, res);
    return res;
}

const validRelease = (over = {}) => ({
    minimumVersion: "v1",
    build: 100,
    releaseDate: "2026-06-02",
    severity: "none",
    changelog: ["ok"],
    sha256: "a".repeat(64),
    downloadUrl: "https://example.com/v1.rbxmx",
    ...over
});

/* ---------- regression: inherited Object keys are not versions ---------- */
test("getVersion rejects inherited property names", () => {
    for (const id of ["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"]) {
        assert.equal(getVersion(id), null, id);
    }
});

test("getVersion rejects non-strings and malformed ids", () => {
    for (const id of [undefined, null, 42, ["beta_1.0"], "", "a b", "../x", "x".repeat(65)]) {
        assert.equal(getVersion(id), null);
    }
});

test("getVersion finds real releases", () => {
    const v = getVersion("beta_1.0");
    assert.equal(v.id, "beta_1.0");
    assert.equal(v.build, 100);
});

test("latest and list are consistent", () => {
    assert.equal(getLatest().id, loadConfig().latest);
    const list = listVersions();
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].build > list[i].build);
});

/* ---------- /api/version ---------- */
test("/api/version: 200, 400, 404", () => {
    assert.equal(run(versionHandler, { query: { id: "beta_1.0" } }).statusCode, 200);
    assert.equal(run(versionHandler, { query: {} }).statusCode, 400);
    assert.equal(run(versionHandler, { query: { id: ["a", "b"] } }).statusCode, 400);
    assert.equal(run(versionHandler, { query: { id: "nope" } }).statusCode, 404);
});

test("/api/version?id=constructor is a 404, not a 200", () => {
    assert.equal(run(versionHandler, { query: { id: "constructor" } }).statusCode, 404);
});

test("client errors are not cacheable", () => {
    assert.equal(run(versionHandler, { query: { id: "nope" } }).headers["cache-control"], "no-store");
});

/* ---------- /api/check ---------- */
test("/api/check: current == latest", () => {
    const { statusCode, body } = run(checkHandler, { query: { current: "beta_1.0" } });
    assert.equal(statusCode, 200);
    assert.equal(body.needsUpdate, false);
    assert.equal(body.belowMinimum, false);
    assert.equal(body.currentKnown, true);
    assert.equal(body.currentBuild, 100);
    assert.match(body.sha256, /^[a-f0-9]{64}$/);
});

test("/api/check: `version` works as an alias", () => {
    assert.equal(run(checkHandler, { query: { version: "beta_1.0" } }).body.currentKnown, true);
});

test("/api/check: unknown or missing version is flagged, never silently ok", () => {
    for (const query of [{}, { current: "nope" }, { current: "constructor" }]) {
        const { body } = run(checkHandler, { query });
        assert.equal(body.currentKnown, false);
        assert.equal(body.needsUpdate, true);
        assert.equal(body.belowMinimum, null);
        assert.equal(body.currentBuild, null);
    }
});

test("/api/check: repeated parameter is a 400", () => {
    assert.equal(run(checkHandler, { query: { current: ["a", "b"] } }).statusCode, 400);
});

/* ---------- /api/versions ---------- */
test("/api/versions lists releases", () => {
    const { statusCode, body } = run(versionsHandler);
    assert.equal(statusCode, 200);
    assert.ok(body.versions.length >= 1);
});

/* ---------- HTTP behaviour ---------- */
test("OPTIONS -> 204, POST -> 405, GET has cache headers", () => {
    assert.equal(run(versionsHandler, { method: "OPTIONS" }).statusCode, 204);
    const post = run(versionsHandler, { method: "POST" });
    assert.equal(post.statusCode, 405);
    assert.equal(post.headers.allow, "GET, HEAD, OPTIONS");
    assert.match(run(versionsHandler).headers["cache-control"], /s-maxage/);
    assert.equal(run(versionsHandler).headers["access-control-allow-origin"], "*");
});

/* ---------- validateConfig ---------- */
test("validateConfig accepts the real registry", () => {
    assert.deepEqual(validateConfig(loadConfig()), []);
});

test("validateConfig catches common mistakes", () => {
    const cases = {
        "not an object": [[], /JSON object/],
        "missing latest": [{ versions: { v1: validRelease() } }, /'latest'/],
        "latest does not exist": [{ latest: "v2", versions: { v1: validRelease() } }, /does not exist/],
        "duplicate build": [{ latest: "v1", versions: { v1: validRelease(), v2: validRelease() } }, /already used/],
        "bad build": [{ latest: "v1", versions: { v1: validRelease({ build: "100" }) } }, /build/],
        "bad date": [{ latest: "v1", versions: { v1: validRelease({ releaseDate: "2026-02-31" }) } }, /releaseDate/],
        "bad severity": [{ latest: "v1", versions: { v1: validRelease({ severity: "meh" }) } }, /severity/],
        "empty changelog": [{ latest: "v1", versions: { v1: validRelease({ changelog: [] }) } }, /changelog/],
        "bad sha256": [{ latest: "v1", versions: { v1: validRelease({ sha256: "xyz" }) } }, /sha256/],
        "http url": [{ latest: "v1", versions: { v1: validRelease({ downloadUrl: "http://example.com/a" }) } }, /https/],
        "mutable branch": [
            { latest: "v1", versions: { v1: validRelease({ downloadUrl: "https://raw.githubusercontent.com/o/r/main/a.rbxmx" }) } },
            /mutable branch/
        ],
        "mutable refs/heads": [
            { latest: "v1", versions: { v1: validRelease({ downloadUrl: "https://raw.githubusercontent.com/o/r/refs/heads/main/a.rbxmx" }) } },
            /mutable branch/
        ],
        "unknown minimumVersion": [{ latest: "v1", versions: { v1: validRelease({ minimumVersion: "v0" }) } }, /does not exist/],
        "minimum newer than release": [
            { latest: "v1", versions: { v1: validRelease({ minimumVersion: "v2" }), v2: validRelease({ build: 200, minimumVersion: "v2" }) } },
            /higher build/
        ],
        "proto id": [JSON.parse('{"latest":"v1","versions":{"__proto__":{},"v1":' + JSON.stringify(validRelease()) + "}}"), /invalid identifier/]
    };

    for (const [name, [config, pattern]] of Object.entries(cases)) {
        const errors = validateConfig(config);
        assert.ok(errors.some((e) => pattern.test(e)), `${name}: got ${JSON.stringify(errors)}`);
    }
});

test("validateConfig accepts tag-pinned GitHub URLs", () => {
    const config = {
        latest: "v1",
        versions: { v1: validRelease({ downloadUrl: "https://raw.githubusercontent.com/o/r/refs/tags/v1/versions/v1.rbxmx" }) }
    };
    assert.deepEqual(validateConfig(config), []);
});
