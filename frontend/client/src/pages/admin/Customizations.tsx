import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CustomizationsProps = {
  initialSection?: 'custom-domain' | 'in-product' | 'labels' | 'roles';
};

function CustomLabelsSection() {
  const { toast } = useToast();
  const [labels, setLabels] = useState({
    workspace: 'Workspace',
    workspaces: 'Workspaces',
    eventType: 'Interview',
    eventTypes: 'Interviews',
    user: 'Recruiter',
    users: 'Recruiters',
    resource: 'Resource',
    resources: 'Resources',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const savedLabels = localStorage.getItem('custom_labels');
    if (savedLabels) {
      const parsed = JSON.parse(savedLabels);
      setLabels(prev => ({
        ...prev,
        workspace: parsed.workspace || prev.workspace,
        workspaces: parsed.workspaces || prev.workspaces,
        eventType: parsed.eventType || prev.eventType,
        eventTypes: parsed.eventTypes || prev.eventTypes,
        user: parsed.user || prev.user,
        users: parsed.users || prev.users,
        resource: parsed.resource || prev.resource,
        resources: parsed.resources || prev.resources,
      }));
    }
  }, []);

  const handleLabelChange = (key: string, value: string) => {
    setLabels(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const savedLabels = localStorage.getItem('custom_labels');
    const existingLabels = savedLabels ? JSON.parse(savedLabels) : {};
    const updatedLabels = { ...existingLabels, ...labels };
    
    localStorage.setItem('custom_labels', JSON.stringify(updatedLabels));
    window.dispatchEvent(new CustomEvent('custom-labels-updated', { detail: updatedLabels }));
    
    toast({
      title: 'Labels Saved',
      description: 'Custom labels have been updated successfully',
    });
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Labels</CardTitle>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          {[
            { key: 'workspace', manyKey: 'workspaces', title: 'Workspaces' },
            { key: 'eventType', manyKey: 'eventTypes', title: 'Event Type' },
            { key: 'user', manyKey: 'users', title: 'User' },
            { key: 'resource', manyKey: 'resources', title: 'Resource' },
          ].map((label) => (
            <div key={label.key} className="py-6 border-b">
              <div className="font-medium mb-4">{label.title}</div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">One</label>
                  <Input
                    value={labels[label.key as keyof typeof labels]}
                    onChange={(e) => handleLabelChange(label.key, e.target.value)}
                    placeholder="Singular form"
                    className="font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Many</label>
                  <Input
                    value={labels[label.manyKey as keyof typeof labels]}
                    onChange={(e) => handleLabelChange(label.manyKey, e.target.value)}
                    placeholder="Plural form"
                    className="font-medium"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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
            <CustomLabelsSection />
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
