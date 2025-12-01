import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DataAdminSection = 'privacy' | 'domain-auth' | 'export';

interface DataAdminProps {
  initialSection?: DataAdminSection;
}

export default function DataAdmin({ initialSection }: DataAdminProps) {
  const [section, setSection] = useState<DataAdminSection>(initialSection ?? 'export');

  useEffect(() => {
    if (initialSection) setSection(initialSection);
  }, [initialSection]);

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        {section === 'privacy' && (
          <div>
            <h1 className="text-2xl font-semibold">Privacy and Security</h1>
            <p className="text-gray-600 mt-2">Manage data protection, GDPR and cookie settings for your account.</p>

            <div className="mt-6 bg-white border border-gray-100 rounded-md p-6">
              <h3 className="text-lg font-medium">Data Protection</h3>
              <p className="text-sm text-gray-600 mt-2">Controls for anonymization, retention and data export policies.</p>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Enable automatic data anonymization after 30 days</span>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Enable GDPR consent tracking</span>
                </label>

                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Show cookie notice to visitors</span>
                </label>
              </div>

              <div className="mt-6">
                <Button>Save settings</Button>
              </div>
            </div>
          </div>
        )}

        {section === 'domain-auth' && (
          <div>
            <h1 className="text-2xl font-semibold">Domain Authentication</h1>
            <p className="text-gray-600 mt-2">Set up domain verification and authentication (SPF/DKIM) for sending and security.</p>

            <div className="mt-6 bg-white border border-gray-100 rounded-md p-6">
              <h3 className="text-lg font-medium">Verify your domain</h3>
              <p className="text-sm text-gray-600 mt-2">Add DNS TXT records to prove ownership and configure email authentication.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <Input placeholder="example.com" className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification status</label>
                  <div className="mt-1 text-sm text-gray-600">Not verified</div>
                </div>

                <div className="flex items-center gap-3">
                  <Button>Begin verification</Button>
                  <Button variant="outline">View DNS instructions</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 'export' && (
          <div>
            <h1 className="text-2xl font-semibold">Export Data</h1>
            <p className="text-gray-600 mt-2">Export bookings, customers or other records as CSV/XLSX.</p>

            <div className="mt-6 bg-white border border-gray-100 rounded-md p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Module</label>
                  <select className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2 text-sm">
                    <option>Appointments</option>
                    <option>Customers</option>
                    <option>Payments</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">File Name</label>
                  <Input placeholder="Export - 31 Oct 2025" className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Range</label>
                  <Input placeholder="31-Oct-2025 to 31-Oct-2025" className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Export As</label>
                  <div className="mt-1 space-x-4">
                    <label className="inline-flex items-center gap-2"><input type="radio" name="export-as" defaultChecked /> CSV</label>
                    <label className="inline-flex items-center gap-2"><input type="radio" name="export-as" /> XLSX</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fields</label>
                  <select className="mt-1 block w-full rounded-md border-gray-200 shadow-sm p-2 text-sm">
                    <option>7 Fields Selected</option>
                  </select>
                </div>

                <div className="flex items-start">
                  <label className="inline-flex items-center gap-2 mt-6"><input type="checkbox" /> Include Custom Fields</label>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <Button>Export</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
