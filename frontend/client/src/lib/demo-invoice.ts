// Demo Invoice Generator for Testing

import { createInvoice } from './invoice-utils';

export function generateDemoInvoice() {
  const companySettings = {
    name: 'Zervos',
    email: 'hello@zervos.com',
    logo: '',
    brandColor: '#6366f1',
  };

  const invoice = createInvoice({
    bookingId: 'DEMO-' + Date.now(),
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
    },
    service: {
      name: 'Strategy Consultation',
      duration: '1h 0m',
      price: 5000,
    },
    amount: 5000,
    paymentMethod: 'Online Payment',
    currency: '₹',
    status: 'Paid',
    company: companySettings,
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '02:00 PM',
    subtotal: 5000,
    taxAmount: 0,
    notes: 'Thank you for your booking! This is a demo invoice.',
  });

  console.log('✅ Demo invoice created:', invoice.invoiceId);
  return invoice;
}

// Run this in browser console to test:
// import { generateDemoInvoice } from '@/lib/demo-invoice';
// generateDemoInvoice();
