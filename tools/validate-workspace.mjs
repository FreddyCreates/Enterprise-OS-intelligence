import { execSync } from "node:child_process";
import { VALIDATION_COMMANDS } from "../cloudflare-workers/shared/organism-manifest.js";

const commands = [
  ...VALIDATION_COMMANDS,
  "node PARRALAX-AIHFTFUND/scripts/validate.mjs",
];

for (const command of commands) {
  console.log(`$ ${command}`);
  execSync(command, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

console.log("validate-workspace-ok");
