#!/usr/bin/env node
import crypto from "crypto";

const SECRET_SALT = "clientcraft_v1_offline_hmac_master_signature_salt_2026";

const email = process.argv[2] || "supporter@clientcraft.dev";
const tier = process.argv[3] === "enterprise" ? "enterprise_lifetime" : "pro_supporter";

const payload = {
  tier,
  licensedTo: email,
  issuedAt: Date.now(),
};

const json = JSON.stringify(payload);
const base64 = Buffer.from(json).toString("base64");
const signature = crypto.createHmac("sha256", SECRET_SALT).update(base64).digest("hex");
const licenseKey = `CCPRO-${base64}-${signature}`;

console.log("\n==========================================");
console.log(" ClientCraft Cryptographic License Generator");
console.log("==========================================");
console.log(`Licensed To : ${email}`);
console.log(`Tier        : ${tier === "enterprise_lifetime" ? "Enterprise Lifetime" : "Pro Supporter"}`);
console.log(`Generated At: ${new Date(payload.issuedAt).toISOString()}`);
console.log("\nLICENSE KEY:");
console.log(licenseKey);
console.log("==========================================\n");
