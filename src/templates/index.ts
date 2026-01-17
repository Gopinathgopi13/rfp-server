import fs from "node:fs";
import path from "node:path";

import ejs from "ejs";

export enum TEMPLATE {
  RFP
}

function resolveTemplatesDir(): string {
  if (process.env.EMAIL_TEMPLATES_DIR) {
    return path.resolve(process.env.EMAIL_TEMPLATES_DIR);
  }

  return path.resolve(__dirname);
}

const templatesDir = resolveTemplatesDir();

export const renderFile = (name: TEMPLATE, data: any): string => {
  const filename = `${TEMPLATE[name].toString().toLowerCase()}.ejs`;
  const filePath = path.join(templatesDir, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filePath}`);
  }

  const file = fs.readFileSync(filePath, "utf8");
  return ejs.render(file, data);
};