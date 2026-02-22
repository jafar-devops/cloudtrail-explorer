import fs from "node:fs";
import path from "node:path";

const AUTH_KEY = "ct-explorer-auth-v1";
const OUTPUT_PATH = path.join(process.cwd(), "public", "auth-credentials.json");

function usage() {
  console.log("Usage: npm run auth:update -- --username <value> --password <value>");
}

function parseArgs(argv) {
  const args = { username: "", password: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--username") {
      args.username = argv[i + 1] ?? "";
      i += 1;
    } else if (token === "--password") {
      args.password = argv[i + 1] ?? "";
      i += 1;
    }
  }
  return args;
}

function xorBase64Encrypt(plainText, key) {
  const textBytes = Buffer.from(plainText, "utf8");
  const keyBytes = Buffer.from(key, "utf8");
  const out = Buffer.alloc(textBytes.length);
  for (let i = 0; i < textBytes.length; i += 1) {
    out[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return out.toString("base64");
}

const { username, password } = parseArgs(process.argv.slice(2));

if (!username || !password) {
  usage();
  process.exit(1);
}

const payload = {
  algorithm: "xor-base64-v1",
  username: xorBase64Encrypt(username, AUTH_KEY),
  password: xorBase64Encrypt(password, AUTH_KEY),
};

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Updated encrypted credentials in ${OUTPUT_PATH}`);
