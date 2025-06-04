import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './util/database.js';

const app = express();
const PORT = 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/invoices', (req, res) => {
  try {
    const invoices = db.getInvoicesWithDetails();
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: `${err}` });
  }
});

app.post('/invoices', (req, res) => {
  try {
    const invoice = req.body;
    const result = db.addInvoice(invoice);
    res.status(201).json({ message: 'Számla hozzáadva', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ message: `${err}` });
  }
});

app.put('/invoices/:id/storno', (req, res) => {
  try {
    db.stornoInvoice(req.params.id);
    res.status(200).json({ message: 'Számla sztornózva' });
  } catch (err) {
    res.status(500).json({ message: `${err}` });
  }
});

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
});
