const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));

const BACKUP_DIR = path.join(__dirname, 'Backups');
const QUOTE_DIR = path.join(__dirname, 'Quote Backup');
const ARTICLE_DIR = path.join(__dirname, 'Article Backup');
const PO_DIR = path.join(__dirname, 'PO Backup');
const INVOICE_DIR = path.join(__dirname, 'Invoice Backup');
const CUST_DIR = path.join(__dirname, 'Customer Backup');
const SUPP_DIR = path.join(__dirname, 'Supplier Backup');

const DB_FILE = path.join(__dirname, 'database.json');

async function ensureDirs() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await fs.mkdir(QUOTE_DIR, { recursive: true });
  await fs.mkdir(path.join(QUOTE_DIR, 'Attachments'), { recursive: true });
  await fs.mkdir(ARTICLE_DIR, { recursive: true });
  await fs.mkdir(PO_DIR, { recursive: true });
  await fs.mkdir(path.join(PO_DIR, 'Attachments'), { recursive: true });
  await fs.mkdir(INVOICE_DIR, { recursive: true });
  await fs.mkdir(path.join(INVOICE_DIR, 'Attachments'), { recursive: true });
  await fs.mkdir(CUST_DIR, { recursive: true });
  await fs.mkdir(path.join(CUST_DIR, 'Attachments'), { recursive: true });
  await fs.mkdir(SUPP_DIR, { recursive: true });
  await fs.mkdir(path.join(SUPP_DIR, 'Attachments'), { recursive: true });
}

async function handleDailyBackup() {
  try {
     const today = new Date().toISOString().split('T')[0];
     const backupPath = path.join(BACKUP_DIR, `backup_${today}.json`);
     try {
       await fs.access(backupPath);
       // Backup already exists for today
     } catch(e) {
       // Doesn't exist, try to copy current DB
       try {
          const dt = await fs.readFile(DB_FILE, 'utf-8');
          await fs.writeFile(backupPath, dt);
          console.log(`Created daily backup: ${backupPath}`);
       } catch (dbErr) {
          // No current DB exists, nothing to backup
       }
     }
  } catch(e) {
     console.error('Daily backup logic failed', e);
  }
}

ensureDirs().then(handleDailyBackup).catch(console.error);

// ════════════ UNIFIED DATABASE ════════════
app.get('/api/database', async (req, res) => {
  try {
     const dt = await fs.readFile(DB_FILE, 'utf-8');
     res.json(JSON.parse(dt));
  } catch (err) {
     if (err.code === 'ENOENT') return res.json({}); 
     res.status(500).json({ error: err.message });
  }
});

app.post('/api/database', async (req, res) => {
  try {
    const data = req.body;
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════ PDF SAVING ════════════
app.post('/api/save-pdf', async (req, res) => {
  try {
    const { docType, filename, fileData } = req.body;
    let baseDir = '';
    if (docType === 'quotes') baseDir = QUOTE_DIR;
    else if (docType === 'purchaseOrders' || docType === 'pos') baseDir = PO_DIR;
    else if (docType === 'invoices') baseDir = INVOICE_DIR;
    else return res.status(400).json({ error: 'Unknown document type for PDF' });

    const safeFName = filename.replace(/[\\/:*?"<>|]/g, '_');
    const targetFile = path.join(baseDir, safeFName);
    
    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    await fs.writeFile(targetFile, buffer);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════ ATTACHMENTS ════════════
app.post('/api/upload-attachment', async (req, res) => {
  try {
    const { docType, docNumber, filename, fileData } = req.body;
    if (!docType || !docNumber || !filename || !fileData) return res.status(400).json({ error: 'Missing attachment fields' });
    
    let baseDir = '';
    if (docType === 'quotes') baseDir = QUOTE_DIR;
    else if (docType === 'purchaseOrders') baseDir = PO_DIR;
    else if (docType === 'invoices') baseDir = INVOICE_DIR;
    else if (docType === 'customers') baseDir = CUST_DIR;
    else if (docType === 'suppliers') baseDir = SUPP_DIR;
    else return res.status(400).json({ error: 'Unknown document type' });
    
    const attachDir = path.join(baseDir, 'Attachments');
    const safeDocNum = String(docNumber).replace(/[\\/:*?"<>|]/g, '_');
    const safeFName = String(filename).replace(/[\\/:*?"<>|]/g, '_');
    const targetFile = `${safeDocNum}_${safeFName}`;
    
    const buffer = Buffer.from(fileData.split(',')[1] || fileData, 'base64');
    
    await fs.writeFile(path.join(attachDir, targetFile), buffer);
    res.json({ success: true, url: `/api/attachment/${docType}/${targetFile}` });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/attachment/:docType/:filename', (req, res) => {
    let baseDir = '';
    if (req.params.docType === 'quotes') baseDir = QUOTE_DIR;
    else if (req.params.docType === 'purchaseOrders') baseDir = PO_DIR;
    else if (req.params.docType === 'invoices') baseDir = INVOICE_DIR;
    else if (req.params.docType === 'customers') baseDir = CUST_DIR;
    else if (req.params.docType === 'suppliers') baseDir = SUPP_DIR;
    else return res.status(400).json({ error: 'Unknown document type' });

    const attachDir = path.join(baseDir, 'Attachments');
    const p = path.join(attachDir, req.params.filename);
    res.sendFile(p);
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
