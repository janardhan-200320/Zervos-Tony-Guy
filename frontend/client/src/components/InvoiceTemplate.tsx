import { Invoice } from '@/lib/invoice-utils';
import { useRef, useState, useEffect } from 'react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Download, Printer } from 'lucide-react';

interface InvoiceTemplateProps {
  invoice: Invoice;
  onClose?: () => void;
}

function getOrganizationDetails() {
  try {
    const stored = localStorage.getItem('zervos_organization');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading organization details:', error);
  }
  return {
    businessName: 'Your Business',
    email: '',
    contactNumber: '',
    logo: '',
    brandColor: '#6366f1',
    gstNumber: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    website: '',
    taxDetails: { cgst: 2.5, sgst: 2.5, igst: 0 },
    bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '' },
  };
}

export default function InvoiceTemplate({ invoice, onClose }: InvoiceTemplateProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [orgDetails, setOrgDetails] = useState(getOrganizationDetails());

  useEffect(() => {
    const details = getOrganizationDetails();
    console.log('📋 Organization Details Loaded:', details);
    setOrgDetails(details);
  }, []);
  
  const date = new Date(invoice.dateIssued);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const opt = {
        margin: 10,
        filename: `${invoice.invoiceId}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(invoiceRef.current).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="invoice-wrapper">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-wrapper,
          .invoice-wrapper * {
            visibility: visible;
          }
          .invoice-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-actions {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Actions (hidden in print) */}
      <div className="print-actions flex justify-end gap-3 mb-6 no-print">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          data-pdf-download
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download size={16} />
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Printer size={16} />
          Print
        </button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="invoice-content bg-white p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
        {/* Header */}
        <div className="header flex justify-between items-start mb-10 pb-6 border-b-4" style={{ borderColor: orgDetails.brandColor || '#6366f1' }}>
          <div className="company-info flex-1">
            {orgDetails.logo && (
              <img src={orgDetails.logo} alt="Logo" className="w-20 h-20 mb-3 rounded-lg object-contain" />
            )}
            <div className="text-3xl font-bold mb-2" style={{ color: orgDetails.brandColor || '#6366f1' }}>
              {orgDetails.businessName}
            </div>
            {orgDetails.email && (
              <p className="text-gray-600 text-sm">{orgDetails.email}</p>
            )}
            {orgDetails.contactNumber && (
              <p className="text-gray-600 text-sm">{orgDetails.contactNumber}</p>
            )}
            {orgDetails.gstNumber && (
              <p className="text-gray-600 text-sm font-medium mt-1">GST: {orgDetails.gstNumber}</p>
            )}
            {orgDetails.address.street && (
              <div className="text-gray-600 text-sm mt-2">
                <p>{orgDetails.address.street}</p>
                <p>
                  {[orgDetails.address.city, orgDetails.address.state, orgDetails.address.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {orgDetails.address.country && <p>{orgDetails.address.country}</p>}
              </div>
            )}
          </div>
          <div className="invoice-details text-right">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-gray-600 mb-3">{invoice.invoiceId}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
              invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
              invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Bill To / Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Bill To</h3>
            <p className="font-bold text-lg mb-1">{invoice.customer.name}</p>
            <p className="text-gray-700">{invoice.customer.email}</p>
            {invoice.customer.phone && (
              <p className="text-gray-700">{invoice.customer.phone}</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-3">Invoice Details</h3>
            <div className="space-y-1">
              <p><span className="font-semibold">Issue Date:</span> {formattedDate}</p>
              {invoice.bookingDate && (
                <p><span className="font-semibold">Booking Date:</span> {invoice.bookingDate}</p>
              )}
              {invoice.bookingTime && (
                <p><span className="font-semibold">Booking Time:</span> {invoice.bookingTime}</p>
              )}
              <p><span className="font-semibold">Payment Method:</span> {invoice.paymentMethod}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">
                Service Description
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">
                Duration
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-600">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-gray-300">
              <td className="py-4 px-4">
                <span className="font-semibold text-base">{invoice.service.name}</span>
              </td>
              <td className="py-4 px-4 text-gray-700">{invoice.service.duration}</td>
              <td className="py-4 px-4 text-right font-semibold">
                {invoice.currency}{invoice.service.price.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-10">
          <div className="w-96">
            {invoice.subtotal && (
              <div className="flex justify-between py-2 text-gray-700">
                <span>Subtotal:</span>
                <span>{invoice.currency}{invoice.subtotal.toFixed(2)}</span>
              </div>
            )}
            {/* Tax Breakdown */}
            {orgDetails.taxDetails && invoice.taxAmount && (
              <div className="border-t border-gray-200 mt-2 pt-2">
                {orgDetails.taxDetails.cgst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>CGST ({orgDetails.taxDetails.cgst}%):</span>
                    <span>{invoice.currency}{((invoice.subtotal || invoice.amount) * orgDetails.taxDetails.cgst / 100).toFixed(2)}</span>
                  </div>
                )}
                {orgDetails.taxDetails.sgst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>SGST ({orgDetails.taxDetails.sgst}%):</span>
                    <span>{invoice.currency}{((invoice.subtotal || invoice.amount) * orgDetails.taxDetails.sgst / 100).toFixed(2)}</span>
                  </div>
                )}
                {orgDetails.taxDetails.igst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>IGST ({orgDetails.taxDetails.igst}%):</span>
                    <span>{invoice.currency}{((invoice.subtotal || invoice.amount) * orgDetails.taxDetails.igst / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-gray-700 font-medium">
                  <span>Total Tax:</span>
                  <span>{invoice.currency}{invoice.taxAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            {!invoice.taxAmount && orgDetails.taxDetails && (
              <div className="border-t border-gray-200 mt-2 pt-2">
                {orgDetails.taxDetails.cgst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>CGST ({orgDetails.taxDetails.cgst}%):</span>
                    <span>{invoice.currency}{(invoice.amount * orgDetails.taxDetails.cgst / (100 + orgDetails.taxDetails.cgst + orgDetails.taxDetails.sgst + orgDetails.taxDetails.igst)).toFixed(2)}</span>
                  </div>
                )}
                {orgDetails.taxDetails.sgst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>SGST ({orgDetails.taxDetails.sgst}%):</span>
                    <span>{invoice.currency}{(invoice.amount * orgDetails.taxDetails.sgst / (100 + orgDetails.taxDetails.cgst + orgDetails.taxDetails.sgst + orgDetails.taxDetails.igst)).toFixed(2)}</span>
                  </div>
                )}
                {orgDetails.taxDetails.igst > 0 && (
                  <div className="flex justify-between py-1 text-gray-600 text-sm">
                    <span>IGST ({orgDetails.taxDetails.igst}%):</span>
                    <span>{invoice.currency}{(invoice.amount * orgDetails.taxDetails.igst / (100 + orgDetails.taxDetails.cgst + orgDetails.taxDetails.sgst + orgDetails.taxDetails.igst)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between py-4 mt-2 border-t-2 border-gray-300 text-xl font-bold text-gray-900">
              <span>Total Amount:</span>
              <span>{invoice.currency}{invoice.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700 text-sm">{invoice.notes}</p>
          </div>
        )}

        {/* Bank Details (if provided) */}
        {orgDetails.bankDetails?.accountNumber && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-900 mb-3">Bank Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {orgDetails.bankDetails.accountName && (
                <div>
                  <span className="text-gray-600">Account Name:</span>
                  <p className="font-medium">{orgDetails.bankDetails.accountName}</p>
                </div>
              )}
              {orgDetails.bankDetails.accountNumber && (
                <div>
                  <span className="text-gray-600">Account Number:</span>
                  <p className="font-medium font-mono">{orgDetails.bankDetails.accountNumber}</p>
                </div>
              )}
              {orgDetails.bankDetails.ifscCode && (
                <div>
                  <span className="text-gray-600">IFSC Code:</span>
                  <p className="font-medium">{orgDetails.bankDetails.ifscCode}</p>
                </div>
              )}
              {orgDetails.bankDetails.bankName && (
                <div>
                  <span className="text-gray-600">Bank Name:</span>
                  <p className="font-medium">{orgDetails.bankDetails.bankName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200 text-gray-600">
          <p className="mb-2">Thank you for booking with {orgDetails.businessName}!</p>
          {orgDetails.website && (
            <p className="text-sm text-gray-500 mb-2">{orgDetails.website}</p>
          )}
          <p className="text-xs text-gray-500">
            This is a computer-generated invoice and does not require a signature.
          </p>
        </div>
      </div>
    </div>
  );
}
