import Database from "better-sqlite3";
import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

export const db = new Database("data/avocat.sqlite");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    lawyer_id TEXT,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    client_name TEXT,
    client_phone TEXT,
    created_at INTEGER NOT NULL,
    claimed_at INTEGER,
    closed_at INTEGER
  )
`,
).run();

export function createTicket({
  channelId,
  clientId,
  type,
  clientName,
  clientPhone,
}) {
  return db
    .prepare(
      `
    INSERT INTO tickets (
      channel_id, client_id, type, status, client_name, client_phone, created_at
    )
    VALUES (?, ?, ?, 'open', ?, ?, ?)
  `,
    )
    .run(channelId, clientId, type, clientName, clientPhone, Date.now());
}

export function getTicketByChannel(channelId) {
  return db
    .prepare(`SELECT * FROM tickets WHERE channel_id = ?`)
    .get(channelId);
}

export function claimTicket(channelId, lawyerId) {
  return db
    .prepare(
      `
    UPDATE tickets
    SET lawyer_id = ?, status = 'claimed', claimed_at = ?
    WHERE channel_id = ?
  `,
    )
    .run(lawyerId, Date.now(), channelId);
}

export function closeTicket(channelId) {
  return db
    .prepare(
      `
    UPDATE tickets
    SET status = 'closed', closed_at = ?
    WHERE channel_id = ?
  `,
    )
    .run(Date.now(), channelId);
}

export function getGlobalTicketStats() {
  return {
    total: db.prepare(`SELECT COUNT(*) AS count FROM tickets`).get().count,
    open: db
      .prepare(`SELECT COUNT(*) AS count FROM tickets WHERE status = 'open'`)
      .get().count,
    claimed: db
      .prepare(`SELECT COUNT(*) AS count FROM tickets WHERE status = 'claimed'`)
      .get().count,
    closed: db
      .prepare(`SELECT COUNT(*) AS count FROM tickets WHERE status = 'closed'`)
      .get().count,
    rdv: db
      .prepare(`SELECT COUNT(*) AS count FROM tickets WHERE type = 'rdv'`)
      .get().count,
    demandes: db
      .prepare(
        `SELECT COUNT(*) AS count FROM tickets WHERE type = 'demande_avocat'`,
      )
      .get().count,
  };
}

export function getLawyerTicketStats(lawyerId) {
  return {
    claimed: db
      .prepare(
        `
      SELECT COUNT(*) AS count FROM tickets
      WHERE lawyer_id = ?
    `,
      )
      .get(lawyerId).count,

    closed: db
      .prepare(
        `
      SELECT COUNT(*) AS count FROM tickets
      WHERE lawyer_id = ? AND status = 'closed'
    `,
      )
      .get(lawyerId).count,
  };
}

export function getLawyerLeaderboard(limit = 10) {
  return db
    .prepare(
      `
    SELECT 
      lawyer_id,
      COUNT(*) AS closed_count
    FROM tickets
    WHERE lawyer_id IS NOT NULL
      AND status = 'closed'
    GROUP BY lawyer_id
    ORDER BY closed_count DESC
    LIMIT ?
  `,
    )
    .all(limit);
}
