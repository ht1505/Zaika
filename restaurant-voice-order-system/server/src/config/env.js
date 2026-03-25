import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRoot = path.resolve(__dirname, "../..");
const projectRoot = path.resolve(serverRoot, "..");

const candidatePaths = [path.join(serverRoot, ".env"), path.join(projectRoot, ".env")];

let loaded = false;

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    loaded = true;
    break;
  }
}

if (!loaded) {
  dotenv.config();
}
