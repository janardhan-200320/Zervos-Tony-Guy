// Invoice Utility Functions

export interface Invoice {
  invoiceId: string;
  bookingId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    duration: string;
    price: number;
  };
  amount: number;
  paymentMethod: string;
  currency: string;
  dateIssued: string;
  status: 'Paid' | 'Pending' | 'Cancelled';
  company: {
    name: string;
    email?: string;
    logo?: string;
    brandColor?: string;
  };
  bookingDate?: string;
  bookingTime?: string;
  taxAmount?: number;
  subtotal?: number;
  notes?: string;
}

/**
 * Generate unique invoice ID with format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  
  return `INV-${year}${month}${day}-${random}`;
}

/**
 * Create and store an invoice
 */
export function createInvoice(invoiceData: Omit<Invoice, 'invoiceId' | 'dateIssued'>): Invoice {
  const invoice: Invoice = {
    invoiceId: generateInvoiceId(),
    dateIssued: new Date().toISOString(),
    ...invoiceData,
  };

  // Store invoice in localStorage
  const invoices = getAllInvoices();
  invoices.push(invoice);
  localStorage.setItem('zervos_invoices', JSON.stringify(invoices));

  // Trigger custom event for workflow integrations
  window.dispatchEvent(new CustomEvent('invoice_created', {
    detail: { invoice }
  }));

  // Auto-send email to customer (async, don't wait)
  if (invoice.status === 'Paid' && invoice.customer.email) {
    import('./email-service').then(({ sendInvoiceEmail, logInvoiceEmail }) => {
      sendInvoiceEmail({
        to: invoice.customer.email,
        customerName: invoice.customer.name,
        invoiceId: invoice.invoiceId,
        amount: invoice.amount,
        currency: invoice.currency,
      }).then(success => {
        if (success) {
          logInvoiceEmail(invoice.invoiceId, invoice.customer.email);
          console.log('✅ Invoice email sent automatically to:', invoice.customer.email);
        }
      });
    });
  }

  return invoice;
}

/**
 * Get all invoices from localStorage
 */
export function getAllInvoices(): Invoice[] {
  try {
    const stored = localStorage.getItem('zervos_invoices');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
}

/**
 * Get invoice by ID
 */
export function getInvoiceById(invoiceId: string): Invoice | null {
  const invoices = getAllInvoices();
  return invoices.find(inv => inv.invoiceId === invoiceId) || null;
}

/**
 * Get invoices by booking ID
 */
export function getInvoicesByBookingId(bookingId: string): Invoice[] {
  const invoices = getAllInvoices();
  return invoices.filter(inv => inv.bookingId === bookingId);
}

/**
 * Get invoices by customer email
 */
export function getInvoicesByCustomer(email: string): Invoice[] {
  const invoices = getAllInvoices();
  return invoices.filter(inv => inv.customer.email.toLowerCase() === email.toLowerCase());
}

/**
 * Update invoice status
 */
export function updateInvoiceStatus(invoiceId: string, status: Invoice['status']): Invoice | null {
  const invoices = getAllInvoices();
  const index = invoices.findIndex(inv => inv.invoiceId === invoiceId);
  
  if (index === -1) return null;
  
  invoices[index].status = status;
  localStorage.setItem('zervos_invoices', JSON.stringify(invoices));
  
  return invoices[index];
}

/**
 * Delete invoice
 */
export function deleteInvoice(invoiceId: string): boolean {
  const invoices = getAllInvoices();
  const filtered = invoices.filter(inv => inv.invoiceId !== invoiceId);
  
  if (filtered.length === invoices.length) return false;
  
  localStorage.setItem('zervos_invoices', JSON.stringify(filtered));
  return true;
}

/**
 * Print invoice (opens print dialog)
 */
export function printInvoice(invoiceId: string): void {
  // Open invoice in a new window for printing
  const url = `/invoice/${invoiceId}/print`;
  window.open(url, '_blank');
}

/**
 * Download invoice as HTML
 */
export function downloadInvoiceHTML(invoice: Invoice): void {
  const html = generateInvoiceHTML(invoice);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.invoiceId}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate HTML for invoice
 */
function generateInvoiceHTML(invoice: Invoice): string {
  const date = new Date(invoice.dateIssued);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid ${invoice.company.brandColor || '#6366f1'};
    }
    .company-info {
      flex: 1;
    }
    .company-logo {
      width: 60px;
      height: 60px;
      margin-bottom: 10px;
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: ${invoice.company.brandColor || '#6366f1'};
      margin-bottom: 5px;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-title {
      font-size: 36px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .invoice-id {
      font-size: 14px;
      color: #6b7280;
    }
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    .info-block h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .info-block p {
      font-size: 14px;
      margin-bottom: 5px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table thead {
      background: #f3f4f6;
    }
    .items-table th {
      text-align: left;
      padding: 12px;
      font-size: 12px;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 600;
    }
    .items-table td {
      padding: 15px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .items-table tbody tr:last-child td {
      border-bottom: 2px solid #d1d5db;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-bottom: 40px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 14px;
    }
    .totals-row.total {
      border-top: 2px solid #d1d5db;
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      padding-top: 15px;
      margin-top: 10px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      background: #dcfce7;
      color: #166534;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 13px;
    }
    .notes {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .notes h3 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #374151;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${invoice.company.logo ? `<img src="${invoice.company.logo}" alt="Logo" class="company-logo">` : ''}
      <div class="company-name">${invoice.company.name}</div>
      ${invoice.company.email ? `<p style="font-size: 14px; color: #6b7280;">${invoice.company.email}</p>` : ''}
    </div>
    <div class="invoice-details">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-id">${invoice.invoiceId}</div>
      <div style="margin-top: 10px;">
        <span class="status-badge">${invoice.status}</span>
      </div>
    </div>
  </div>

  <div class="info-section">
    <div class="info-block">
      <h3>Bill To</h3>
      <p><strong>${invoice.customer.name}</strong></p>
      <p>${invoice.customer.email}</p>
      ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
    </div>
    <div class="info-block">
      <h3>Invoice Details</h3>
      <p><strong>Issue Date:</strong> ${formattedDate}</p>
      ${invoice.bookingDate ? `<p><strong>Booking Date:</strong> ${invoice.bookingDate}</p>` : ''}
      ${invoice.bookingTime ? `<p><strong>Booking Time:</strong> ${invoice.bookingTime}</p>` : ''}
      <p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Service Description</th>
        <th>Duration</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${invoice.service.name}</strong></td>
        <td>${invoice.service.duration}</td>
        <td style="text-align: right;">${invoice.currency}${invoice.service.price.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    ${invoice.subtotal ? `
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${invoice.currency}${invoice.subtotal.toFixed(2)}</span>
    </div>
    ` : ''}
    ${invoice.taxAmount ? `
    <div class="totals-row">
      <span>Tax:</span>
      <span>${invoice.currency}${invoice.taxAmount.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total Amount:</span>
      <span>${invoice.currency}${invoice.amount.toFixed(2)}</span>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${invoice.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for booking with ${invoice.company.name}!</p>
    <p style="margin-top: 10px; font-size: 12px;">This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get invoice statistics
 */
export function getInvoiceStats() {
  const invoices = getAllInvoices();
  
  return {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'Paid').length,
    pending: invoices.filter(inv => inv.status === 'Pending').length,
    cancelled: invoices.filter(inv => inv.status === 'Cancelled').length,
    totalRevenue: invoices
      .filter(inv => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
  };
}
