import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, User, Mail, Phone, MapPin, Calendar, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
  icon?: string;
}

export default function LoginPreferences() {
  const { toast } = useToast();
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [allowGuest, setAllowGuest] = useState(true);
  const [allowRegistered, setAllowRegistered] = useState(false);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [enableSocialLogin, setEnableSocialLogin] = useState(false);
  
  const [loginFields, setLoginFields] = useState<LoginField[]>([
    { id: '1', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name', icon: 'User' },
    { id: '2', name: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com', icon: 'Mail' },
    { id: '3', name: 'Contact Number', type: 'tel', required: true, placeholder: '+1 (555) 123-4567', icon: 'Phone' },
  ]);

  const [newField, setNewField] = useState<Omit<LoginField, 'id'>>({
    name: '',
    type: 'text',
    required: false,
    placeholder: '',
    icon: 'User'
  });

  useEffect(() => {
    const saved = localStorage.getItem('zervos_login_prefs');
    if (saved) {
      const data = JSON.parse(saved);
      setAllowGuest(data.allowGuest ?? true);
      setAllowRegistered(data.allowRegistered ?? false);
      setRequireEmailVerification(data.requireEmailVerification ?? false);
      setEnableSocialLogin(data.enableSocialLogin ?? false);
      if (data.loginFields) setLoginFields(data.loginFields);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('zervos_login_prefs', JSON.stringify({
      allowGuest,
      allowRegistered,
      requireEmailVerification,
      enableSocialLogin,
      loginFields
    }));
    toast({ title: "Success", description: "Login preferences updated successfully" });
  };

  const handleAddField = () => {
    const field: LoginField = {
      id: Date.now().toString(),
      ...newField
    };
    setLoginFields([...loginFields, field]);
    setAddFieldOpen(false);
    setNewField({
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
      icon: 'User'
    });
    toast({ title: "Success", description: "Custom field added" });
  };

  const handleDeleteField = (id: string) => {
    setLoginFields(loginFields.filter(field => field.id !== id));
    toast({ title: "Success", description: "Field removed" });
  };

  const handleToggleRequired = (id: string) => {
    setLoginFields(loginFields.map(field => 
      field.id === id ? { ...field, required: !field.required } : field
    ));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...loginFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newFields.length) {
      [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
      setLoginFields(newFields);
    }
  };

  const getFieldIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      User, Mail, Phone, MapPin, Calendar, Hash
    };
    const Icon = icons[iconName] || User;
    return <Icon size={16} />;
  };
  
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Login Preferences</h1>
        <p className="text-gray-600 mt-1">Configure how customers login and what information they provide</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Login Options</h3>
        <p className="text-sm text-gray-600 mb-6">Choose which login methods are available to your customers</p>

        {/* Login Options */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-900 block">
                Allow Guest Bookings
              </label>
              <p className="text-xs text-gray-500 mt-1">Customers can book without creating an account</p>
            </div>
            <Switch
              checked={allowGuest}
              onCheckedChange={setAllowGuest}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-900 block">
                Allow Registered Users
              </label>
              <p className="text-xs text-gray-500 mt-1">Customers can create accounts and manage bookings</p>
            </div>
            <Switch
              checked={allowRegistered}
              onCheckedChange={setAllowRegistered}
            />
          </div>

          {allowRegistered && (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900 block">
                    Require Email Verification
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Send verification email before allowing bookings</p>
                </div>
                <Switch
                  checked={requireEmailVerification}
                  onCheckedChange={setRequireEmailVerification}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900 block">
                    Enable Social Login
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Allow login with Google, Facebook, etc.</p>
                </div>
                <Switch
                  checked={enableSocialLogin}
                  onCheckedChange={setEnableSocialLogin}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Login Fields */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Booking Form Fields</h3>
            <p className="text-sm text-gray-600">
              Customize the information collected from customers during booking
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddFieldOpen(true)}>
            <Plus size={16} />
            Add Custom Field
          </Button>
        </div>

        {/* Fields List */}
        <div className="space-y-2 mt-6">
          {loginFields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="text-gray-400 cursor-move" size={20} />
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  {getFieldIcon(field.icon || 'User')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{field.name}</span>
                    {field.required && (
                      <span className="text-xs text-red-500 font-semibold">Required</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{field.type} • {field.placeholder || 'No placeholder'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveField(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveField(index, 'down')}
                  disabled={index === loginFields.length - 1}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleRequired(field.id)}
                >
                  {field.required ? '★' : '☆'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteField(field.id)}
                >
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button onClick={saveSettings}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Add Field Modal */}
      <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>Add a new field to your booking form</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Field Name</Label>
              <Input
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                placeholder="e.g., Company Name"
              />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select
                value={newField.type}
                onValueChange={(value: any) => setNewField({ ...newField, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Placeholder</Label>
              <Input
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Select
                value={newField.icon}
                onValueChange={(value: any) => setNewField({ ...newField, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Mail">Email</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="MapPin">Location</SelectItem>
                  <SelectItem value="Calendar">Calendar</SelectItem>
                  <SelectItem value="Hash">Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label>Required Field</Label>
              <Switch
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFieldOpen(false)}>Cancel</Button>
            <Button onClick={handleAddField} disabled={!newField.name}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
