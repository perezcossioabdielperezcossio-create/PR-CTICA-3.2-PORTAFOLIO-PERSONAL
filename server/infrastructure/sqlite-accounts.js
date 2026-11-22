export function createAccountStore(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      member_id INTEGER PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
      phone TEXT NOT NULL DEFAULT '',
      password TEXT,
      activation TEXT,
      activation_expires INTEGER
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES accounts(member_id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance (
      member_id INTEGER NOT NULL REFERENCES accounts(member_id) ON DELETE CASCADE,
      day TEXT NOT NULL,
      PRIMARY KEY (member_id, day)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY,
      member_id INTEGER NOT NULL REFERENCES accounts(member_id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  return {
    find(email) {
      return db.prepare(`SELECT m.id, a.password
        FROM members m LEFT JOIN accounts a ON a.member_id = m.id WHERE m.email = ?`).get(email)
    },
    issueCode(id, code, expires) {
      return db.prepare(`INSERT INTO accounts(member_id, activation, activation_expires)
        VALUES (?, ?, ?) ON CONFLICT(member_id) DO UPDATE SET
        activation = excluded.activation, activation_expires = excluded.activation_expires
        WHERE accounts.password IS NULL`).run(id, code, expires).changes > 0
    },
    activate(id, token, password) {
      return db.prepare(`UPDATE accounts SET password = ?, activation = NULL, activation_expires = NULL
        WHERE member_id = ? AND password IS NULL AND activation = ? AND activation_expires > ?`)
        .run(password, id, token, Date.now()).changes > 0
    },
    startSession(id, token, expires) {
      db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now())
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(token, id, expires)
    },
    session(token) {
      return db.prepare('SELECT member_id AS id FROM sessions WHERE token = ? AND expires > ?')
        .get(token, Date.now())
    },
    revokeSession(token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    },
    profile(id) {
      return db.prepare(`SELECT m.name, m.email, a.phone FROM members m
        JOIN accounts a ON a.member_id = m.id WHERE m.id = ?`).get(id)
    },
    updateProfile(id, { name, email, phone }) {
      db.exec('BEGIN IMMEDIATE')
      try {
        const updated = db.prepare('UPDATE OR IGNORE members SET name = ?, email = ? WHERE id = ?')
          .run(name, email, id).changes
        if (updated) db.prepare('UPDATE accounts SET phone = ? WHERE member_id = ?').run(phone, id)
        db.exec('COMMIT')
        return updated > 0
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
    days(id) {
      return db.prepare('SELECT day FROM attendance WHERE member_id = ? ORDER BY day DESC')
        .all(id).map(row => row.day)
    },
    markDay(id, day) {
      return db.prepare('INSERT OR IGNORE INTO attendance VALUES (?, ?)').run(id, day).changes > 0
    },
    send(id, message) {
      db.prepare('INSERT INTO messages(member_id, text) VALUES (?, ?)').run(id, message)
    },
    inbox() {
      return db.prepare(`SELECT messages.id, members.name, members.email, messages.text, messages.created_at
        FROM messages JOIN members ON members.id = messages.member_id ORDER BY messages.id DESC`).all()
    },
    remove(id) {
      db.prepare('DELETE FROM members WHERE id = ?').run(id)
    }
  }
}
