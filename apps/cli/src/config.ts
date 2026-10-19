import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CliConfig {
  cliToken: string;
  apiUrl: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    cohort: string | null;
  };
}

const CONFIG_DIR = path.join(os.homedir(), '.ej-cap');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getCliConfig(): CliConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCliConfig(config: CliConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600,
  });
}

export function clearCliConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
