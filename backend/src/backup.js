import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destino = path.join(config.backupDir, `backup-${stamp}`);
fs.mkdirSync(destino, { recursive: true });

if (fs.existsSync(config.dbPath)) fs.copyFileSync(config.dbPath, path.join(destino, 'rea.db'));
else console.warn('No se encontró la base de datos.');

if (fs.existsSync(config.uploadDir)) {
  for (const f of fs.readdirSync(config.uploadDir)) {
    fs.copyFileSync(path.join(config.uploadDir, f), path.join(destino, f));
  }
}

console.log('Backup creado en:', destino);