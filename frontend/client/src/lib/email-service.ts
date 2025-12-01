// Email Service for sending invoices
// This can be integrated with various email services

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'resend' | 'webhook';
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail: string;
  fromName: string;
}

export interface InvoiceEmailData {
  to: string;
  customerName: string;
  invoiceId: string;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  pdfAttachment?: string; // base64 encoded PDF
}

// Get email configuration from localStorage
export function getEmailConfig(): EmailConfig | null {
  try {
    const stored = localStorage.getItem('email_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading email config:', error);
  }
  return null;
}

// Save email configuration
export function saveEmailConfig(config: EmailConfig): void {
  localStorage.setItem('email_config', JSON.stringify(config));
}

// Generate invoice email HTML
export function generateInvoiceEmailHTML(data: InvoiceEmailData, orgDetails: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: ${orgDetails.brandColor || '#6366f1'};
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
    }
    .invoice-details {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .invoice-details h2 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
      font-weight: bold;
      font-size: 18px;
      color: #111;
    }
    .detail-label {
      color: #6b7280;
    }
    .detail-value {
      font-weight: 600;
      color: #111;
    }
    .cta-button {
      display: inline-block;
      background: ${orgDetails.brandColor || '#6366f1'};
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .company-info {
      margin-top: 15px;
      font-size: 12px;
      color: #9ca3af;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📄 Invoice Received</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Dear ${data.customerName},</p>
      
      <p>Thank you for your payment! We're pleased to send you the invoice for your recent booking with ${orgDetails.businessName}.</p>
      
      <div class="invoice-details">
        <h2>Invoice Details</h2>
        <div class="detail-row">
          <span class="detail-label">Invoice Number:</span>
          <span class="detail-value">${data.invoiceId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value" style="color: #10b981;">✓ Paid</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">${data.currency}${data.amount.toFixed(2)}</span>
        </div>
      </div>
      
      ${data.invoiceUrl ? `
      <div style="text-align: center;">
        <a href="${data.invoiceUrl}" class="cta-button">
          View Invoice
        </a>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px;">The invoice has been attached to this email as a PDF for your records.</p>
      
      <p style="margin-top: 20px;">If you have any questions about this invoice, please don't hesitate to contact us.</p>
      
      <p style="margin-top: 20px;">
        Best regards,<br>
        <strong>${orgDetails.businessName}</strong>
      </p>
    </div>
    
    <div class="footer">
      <div>
        <strong>${orgDetails.businessName}</strong><br>
        ${orgDetails.email ? orgDetails.email + '<br>' : ''}
        ${orgDetails.contactNumber ? orgDetails.contactNumber + '<br>' : ''}
      </div>
      <div class="company-info">
        ${orgDetails.address?.street ? orgDetails.address.street + '<br>' : ''}
        ${orgDetails.address?.city ? orgDetails.address.city + ', ' : ''}
        ${orgDetails.address?.state ? orgDetails.address.state + ' ' : ''}
        ${orgDetails.address?.pincode ? orgDetails.address.pincode + '<br>' : ''}
        ${orgDetails.gstNumber ? 'GST: ' + orgDetails.gstNumber : ''}
      </div>
      <div style="margin-top: 15px; font-size: 11px;">
        This is an automated email. Please do not reply directly to this message.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send invoice email (this would integrate with your backend/email service)
export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
  const config = getEmailConfig();
  
  if (!config) {
    console.error('Email configuration not found');
    return false;
  }

  // Get organization details
  const orgDetails = JSON.parse(localStorage.getItem('zervos_organization') || '{}');
  
  // Generate email HTML
  const emailHTML = generateInvoiceEmailHTML(data, orgDetails);
  
  try {
    // This is where you'd integrate with your actual email service
    // For now, we'll simulate the email sending
    
    console.log('📧 Sending invoice email...');
    console.log('To:', data.to);
    console.log('Invoice ID:', data.invoiceId);
    console.log('Amount:', data.currency + data.amount);
    
    // In a real implementation, you would:
    // 1. Call your backend API endpoint
    // 2. Backend uses nodemailer/sendgrid/resend to send email
    // 3. Attach PDF to email
    
    // Example backend call:
    // const response = await fetch('/api/send-invoice-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: data.to,
    //     subject: `Invoice ${data.invoiceId} from ${orgDetails.businessName}`,
    //     html: emailHTML,
    //     attachments: [
    //       {
    //         filename: `${data.invoiceId}.pdf`,
    //         content: data.pdfAttachment,
    //         encoding: 'base64'
    //       }
    //     ]
    //   })
    // });
    
    // For demonstration, we'll open in a new window to show the email
    const emailWindow = window.open('', '_blank');
    if (emailWindow) {
      emailWindow.document.write(emailHTML);
      emailWindow.document.close();
    }
    
    return true;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return false;
  }
}

// Log invoice email (for history/tracking)
export function logInvoiceEmail(invoiceId: string, recipient: string): void {
  try {
    const logs = JSON.parse(localStorage.getItem('invoice_email_logs') || '[]');
    logs.push({
      invoiceId,
      recipient,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    localStorage.setItem('invoice_email_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Error logging email:', error);
  }
}
