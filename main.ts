// main.ts - validator and forwarder for the gta6-meme-x-01 entry.
//
// The make.fun gate reads POST.json from the output directory.
// This program checks the source file in the bot directory first,
// then copies its exact bytes across so nothing gets reformatted.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Small helper for every failure path: explain, then exit 1.
function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Locations come from the environment, with production defaults.
const botDir: string = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir: string = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const sourcePath: string = join(botDir, "POST.json");
const targetPath: string = join(outputDir, "POST.json");

// Read the source as raw bytes; the copy below must stay byte-exact.
let raw: Buffer;
try {
  raw = await readFile(sourcePath);
} catch {
  fail(`cannot read POST.json from bot directory: ${sourcePath}`);
}

// Parse the bytes as JSON text for validation only.
let parsed: unknown;
try {
  parsed = JSON.parse(raw.toString("utf8"));
} catch {
  fail("POST.json is not valid JSON");
}

// The payload must be a plain object carrying a string `url`.
if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
  fail("POST.json must contain a JSON object");
}

const url: unknown = (parsed as Record<string, unknown>).url;
if (typeof url !== "string") {
  fail("POST.json field `url` must be a string");
}

// Only accept a direct link to a post on X.
if (!url.startsWith("https://x.com/") || !url.includes("/status/")) {
  fail("POST.json field `url` must be an X post address");
}

// Validation passed: make sure the output directory exists,
// then write the untouched original bytes to the target file.
try {
  await mkdir(outputDir, { recursive: true });
  await writeFile(targetPath, raw);
} catch {
  fail(`cannot write POST.json to output directory: ${targetPath}`);
}

// Success is silent by design.
