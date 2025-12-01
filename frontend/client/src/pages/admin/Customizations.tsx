import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

type CustomizationsProps = {
  initialSection?: 'custom-domain' | 'in-product' | 'labels' | 'roles';
};

export default function Customizations({ initialSection }: CustomizationsProps) {
  const [section, setSection] = useState<'custom-domain' | 'in-product' | 'labels' | 'roles'>(initialSection ?? 'custom-domain');
  const [defaultDomain, setDefaultDomain] = useState('https://ddfdf.zohobookings.in');
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    if (initialSection) setSection(initialSection);
  }, [initialSection]);

  return (
    <div className="h-full p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Product Customizations</h1>
          <p className="text-gray-600 mt-1">Customize your booking system</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input className="pl-10" placeholder="Search settings" />
        </div>
      </div>

      <div>
        {/* Content area (no internal left nav) */}
        <div className="w-full">
          {section === 'custom-domain' && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-white border rounded-md p-6">
                    <h3 className="font-medium">Share Booking Page</h3>
                    <p className="text-sm text-gray-500 mt-1">Here's your business booking page. You can customize the default URL or launch your own domain.</p>

                    <div className="mt-4">
                      <label className="text-sm text-gray-600">Default booking domain</label>
                      <div className="mt-2 flex gap-3 items-center">
                        <Input value={defaultDomain} onChange={(e) => setDefaultDomain(e.target.value)} />
                        <Button variant="outline">Customize</Button>
                        <Button>Copy</Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="text-sm text-gray-600">Custom Domain</label>
                      <div className="mt-2 flex gap-3 items-center">
                        <Input placeholder="For example, book.zylker.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
                        <Button>Launch</Button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium">On accessing the booking domain, redirect to</h4>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2"><input type="radio" name="redirect" /> First workspace booking page</label>
                        <label className="flex items-center gap-2"><input type="radio" name="redirect" defaultChecked /> Business booking page (All workspaces)</label>
                        <label className="flex items-center gap-2"><input type="radio" name="redirect" /> External URL</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'in-product' && (
            <Card>
              <CardHeader>
                <CardTitle>In-product Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Appointment', events: ['Scheduled', 'Canceled', 'Rescheduled'] },
                    { title: 'Recruiter', events: ['Created', 'Edited', 'Deleted', 'On Leave'] },
                    { title: 'Interview', events: ['Created', 'Edited', 'Deleted'] },
                    { title: 'Customer', events: ['Created', 'Edited', 'Deleted'] },
                    { title: 'Payment', events: ['Success', 'Failure'] },
                  ].map((item) => (
                    <div key={item.title} className="border rounded-md p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">Notify When</div>
                      </div>
                      <div className="flex gap-6">
                        {item.events.map((ev) => (
                          <label key={ev} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" />
                            <span>{ev}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'labels' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Custom Labels</CardTitle>
                <Button variant="outline">Edit</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-8">
                  {[
                    { key: 'workspaces', title: 'Workspaces', one: 'Workspace', many: 'Workspaces' },
                    { key: 'eventType', title: 'Event Type', one: 'Interview', many: 'Interviews' },
                    { key: 'user', title: 'User', one: 'Recruiter', many: 'Recruiters' },
                    { key: 'resource', title: 'Resource', one: 'Resource', many: 'Resources' },
                  ].map((label) => (
                    <div key={label.key} className="py-6 border-b">
                      <div className="font-medium">{label.title}</div>
                      <div className="mt-3 text-sm text-gray-600 flex justify-between">
                        <div>
                          <div className="text-xs text-gray-400">One</div>
                          <div>{label.one}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Many</div>
                          <div>{label.many}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {section === 'roles' && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Roles and Permissions</CardTitle>
                <div className="flex items-center gap-3">
                  <Input placeholder="Role" className="w-48" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm text-gray-500">
                        <th className="py-3">Features</th>
                        <th className="py-3">View</th>
                        <th className="py-3">Edit</th>
                        <th className="py-3">Add</th>
                        <th className="py-3">Delete</th>
                        <th className="py-3">Export</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Availability',
                        'Booking Pages',
                        'Customer',
                      ].map((feat) => (
                        <tr key={feat} className="border-t">
                          <td className="py-4">{feat}</td>
                          <td className="py-4"><input type="checkbox" /></td>
                          <td className="py-4"><input type="checkbox" /></td>
                          <td className="py-4"><input type="checkbox" /></td>
                          <td className="py-4"><input type="checkbox" /></td>
                          <td className="py-4"><input type="checkbox" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
