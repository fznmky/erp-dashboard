const fs = require('fs');

const company = {
  name: "Astratech Solutions",
  street: "100 Innovation Drive",
  city: "San Francisco, CA 94105",
  ceo: "Jane Doe",
  phone: "1-800-555-0101",
  email: "billing@astratech.com",
  web: "www.astratech.com",
  taxRate: 0.20,
  currency: "EUR"
};

const articles = [];
for (let i = 1; i <= 30; i++) {
  articles.push({
    id: Date.now() + i,
    articleNumber: `ART-${1000 + i}`,
    category: "GEN",
    description: `Enterprise Server Component V${i}`,
    specification: `Specs for component ${i}:\n- High durability\n- Aluminum chassis`,
    material: i % 2 === 0 ? "Aluminum" : "Copper",
    packSize: "1",
    defaultPrice: (Math.random() * 500 + 50).toFixed(2)
  });
}

const customers = [];
for (let i = 1; i <= 15; i++) {
  customers.push({
    id: Date.now() + 100 + i,
    name: `Global Tech Client ${i}`,
    address: `${100 + i} Market Street`,
    city: `New York, NY 1000${i}`,
    country: "USA",
    contactPerson: `John Smith ${i}`,
    email: `john.smith${i}@globaltech.com`,
    phone: `+1-555-019${i}`
  });
}

const suppliers = [];
for (let i = 1; i <= 10; i++) {
  suppliers.push({
    id: Date.now() + 200 + i,
    name: `Alpha Supplies ${i}`,
    address: `${200 + i} Industrial Ave`,
    city: `Berlin 1011${i}`,
    country: "Germany",
    contactPerson: `Hans Müller ${i}`,
    email: `contact@alphasupplies${i}.de`,
    phone: `+49-30-12345${i}`
  });
}

const quotes = [];
const pos = [];
const invoices = [];

let qCounter = 1;
let pCounter = 1;
let iCounter = 1;

for (let i = 1; i <= 60; i++) {
  const c = customers[i % customers.length];
  const s = suppliers[i % suppliers.length];
  
  // Random items
  const quoteItems = [];
  const numItems = Math.floor(Math.random() * 5) + 1;
  for (let j = 0; j < numItems; j++) {
    const art = articles[Math.floor(Math.random() * articles.length)];
    quoteItems.push({
      pos: (j+1)*10,
      articleNumber: art.articleNumber,
      description: art.description,
      material: art.material,
      specification: art.specification,
      ve: art.packSize,
      quantity: Math.floor(Math.random() * 10) + 1,
      unitPrice: art.defaultPrice
    });
  }

  const quoteNum = `QT-1${String(qCounter).padStart(3, '0')}`;
  const d1 = new Date();
  d1.setDate(d1.getDate() - Math.floor(Math.random() * 90));
  
  const v1 = new Date(d1);
  v1.setDate(v1.getDate() + 30);

  const statusList = ['sent', 'accepted', 'rejected', 'draft'];
  const qStatus = statusList[Math.floor(Math.random() * statusList.length)];

  quotes.push({
    id: Date.now() + 1000 + i,
    quoteNumber: quoteNum,
    date: d1.toISOString().split('T')[0],
    validUntil: v1.toISOString().split('T')[0],
    status: qStatus,
    customerName: c.name,
    customerAddress: c.address,
    customerCity: c.city,
    customerCountry: c.country,
    customerContactPerson: c.contactPerson,
    customerContactEmail: c.email,
    customerContactPhone: c.phone,
    senderName: company.name,
    senderStreet: company.street,
    senderCity: company.city,
    senderContactPerson: company.ceo,
    senderPhone: company.phone,
    senderEmail: company.email,
    senderWeb: company.web,
    items: quoteItems,
    taxRate: company.taxRate,
    discount: 0,
    shippingCost: (Math.random() * 50).toFixed(2),
    packagingCost: 0,
    deliveryTerms: "DAP",
    paymentTerms: "14 days net"
  });
  qCounter++;

  if (qStatus === 'accepted') {
    // maybe create a PO
    if (Math.random() > 0.5) {
      const poNum = `PO-5${String(pCounter).padStart(3, '0')}`;
      pos.push({
        id: Date.now() + 2000 + i,
        poNumber: poNum,
        relatedQuoteNumber: quoteNum,
        reference: `Quote ${quoteNum}`,
        date: d1.toISOString().split('T')[0],
        status: ['sent', 'draft', 'delivered'][Math.floor(Math.random()*3)],
        supplierName: s.name,
        supplierAddress: s.address,
        supplierCity: s.city,
        supplierCountry: s.country,
        supplierContactPerson: s.contactPerson,
        supplierContactEmail: s.email,
        supplierContactPhone: s.phone,
        items: JSON.parse(JSON.stringify(quoteItems)), // clone
        taxRate: 0,
        discount: 0,
        shippingCost: 0,
        packagingCost: 0,
        deliveryTerms: "DAP",
        paymentTerms: "30 days net"
      });
      pCounter++;
    }

    // maybe create an invoice
    if (Math.random() > 0.3) {
      const invNum = `INV-9${String(iCounter).padStart(3, '0')}`;
      const v2 = new Date(d1);
      v2.setDate(v2.getDate() + 14);
      invoices.push({
        id: Date.now() + 3000 + i,
        invoiceNumber: invNum,
        relatedQuoteNumber: quoteNum,
        reference: `Quote ${quoteNum}`,
        date: d1.toISOString().split('T')[0],
        paymentDueDate: v2.toISOString().split('T')[0],
        status: ['sent', 'draft', 'paid', 'overdue'][Math.floor(Math.random()*4)],
        customerName: c.name,
        customerAddress: c.address,
        customerCity: c.city,
        customerCountry: c.country,
        customerContactPerson: c.contactPerson,
        customerContactEmail: c.email,
        customerContactPhone: c.phone,
        items: JSON.parse(JSON.stringify(quoteItems)),
        taxRate: company.taxRate,
        discount: 0,
        shippingCost: (Math.random() * 50).toFixed(2),
        packagingCost: 0,
        deliveryTerms: "DAP",
        paymentTerms: "14 days net"
      });
      iCounter++;
    }
  }
}

const data = {
  _format: "astratech-quote-manager-backup",
  _version: 1,
  _exportedAt: new Date().toISOString(),
  company,
  articles,
  customers,
  suppliers,
  quotes,
  purchaseOrders: pos,
  invoices
};

fs.writeFileSync('test-data.json', JSON.stringify(data, null, 2));
console.log(`Generated ${quotes.length} Quotes, ${pos.length} POs, ${invoices.length} Invoices, ${articles.length} Articles, ${customers.length} Customers, ${suppliers.length} Suppliers.`);
