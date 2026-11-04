import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bool = (v, dflt) => (v === undefined ? dflt : String(v) === 'true' || String(v) === '1');

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'secreto-de-demo-cambiar-en-produccion',
  jwtExpires: process.env.JWT_EXPIRES || '12h',
  dbPath: path.resolve(__dirname, '..', process.env.DB_PATH || './data/rea.db'),
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
  backupDir: path.resolve(__dirname, '..', process.env.BACKUP_DIR || './backups'),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 200),
  logDownloads: bool(process.env.LOG_DOWNLOADS, true),
};
