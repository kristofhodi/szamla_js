import Database from 'better-sqlite3';
const db = new Database('./data/database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    tax_number TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issuer_id INTEGER,
    buyer_id INTEGER,
    number TEXT,
    issue_date TEXT,
    fulfillment_date TEXT,
    due_date TEXT,
    net_amount REAL,
    vat REAL,
    is_storno INTEGER DEFAULT 0,
    FOREIGN KEY (issuer_id) REFERENCES users(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id)
  );
`);

export const getInvoicesWithDetails = () => {
  return db.prepare(`
    SELECT i.*, 
      iu.name as issuer_name, iu.address as issuer_address, iu.tax_number as issuer_tax,
      bu.name as buyer_name, bu.address as buyer_address, bu.tax_number as buyer_tax,
      (i.net_amount + i.net_amount * i.vat) as gross_amount
    FROM invoices i
    JOIN users iu ON i.issuer_id = iu.id
    JOIN users bu ON i.buyer_id = bu.id
  `).all();
};

export const addInvoice = (invoice) => {
  const stmt = db.prepare(`
    INSERT INTO invoices (issuer_id, buyer_id, number, issue_date, fulfillment_date, due_date, net_amount, vat)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    invoice.issuer_id,
    invoice.buyer_id,
    invoice.number,
    invoice.issue_date,
    invoice.fulfillment_date,
    invoice.due_date,
    invoice.net_amount,
    invoice.vat
  );
};

export const stornoInvoice = (id) => {
  db.prepare(`UPDATE invoices SET is_storno = 1 WHERE id = ?`).run(id);
};

const seedData = () => {
  const users = [
    { name: 'Cég A', address: '1111 Budapest, Fő u. 1.', tax_number: '12345678-1-11' },
    { name: 'Cég B', address: '2222 Győr, Mellék u. 2.', tax_number: '87654321-2-22' },
    { name: 'Cég C', address: '3333 Debrecen, Kossuth tér 3.', tax_number: '11223344-3-33' }
  ];
  const existing = db.prepare(`SELECT COUNT(*) as count FROM users`).get();
  if (existing.count === 0) {
    const insertUser = db.prepare(`INSERT INTO users (name, address, tax_number) VALUES (?, ?, ?)`);
    const insertInvoice = db.prepare(`
      INSERT INTO invoices 
        (issuer_id, buyer_id, number, issue_date, fulfillment_date, due_date, net_amount, vat, is_storno) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const user of users) insertUser.run(user.name, user.address, user.tax_number);
    const buyers = db.prepare(`SELECT id FROM users`).all();
    const issuerId = buyers[0].id;
    let count = 1;
    for (const buyer of buyers) {
      for (let i = 0; i < 3; i++) {
        const now = new Date();
        const due = new Date();
        due.setDate(due.getDate() + 14);
        insertInvoice.run(
          issuerId, buyer.id, `SZAMLA-${count++}`,
          now.toISOString().slice(0, 10),
          now.toISOString().slice(0, 10),
          due.toISOString().slice(0, 10),
          10000 + i * 5000, 0.27, 0
        );
      }
    }
  }
};

seedData();
