import fs from 'node:fs';
import path from 'node:path';
import db, { DB_PATH } from './db.js';

/* Nightly on-disk backups. better-sqlite3's backup() copies a consistent
   snapshot even while the app is serving. Keeps the newest KEEP files. */
const KEEP = 14;
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups');

export async function runBackup() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const dest = path.join(BACKUP_DIR, `msr-${stamp}.db`);
  await db.backup(dest);
  const old = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('msr-') && f.endsWith('.db')).sort();
  for (const f of old.slice(0, Math.max(0, old.length - KEEP))) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
  }
  return dest;
}

export function scheduleBackups() {
  const run = () => runBackup()
    .then(f => console.log(`[backup] wrote ${f}`))
    .catch(e => console.error('[backup] failed:', e.message));
  run();                                     // one on boot
  setInterval(run, 24 * 60 * 60 * 1000);     // then nightly
}
