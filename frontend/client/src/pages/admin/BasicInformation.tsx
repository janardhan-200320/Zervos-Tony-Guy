import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Building2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function BasicInformation() {
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [orgData, setOrgData] = useState({
    businessName: 'bharath',
    email: '',
    contactNumber: '',
    timeZone: 'Asia/Kolkata - IST (+05:30)',
    currency: 'INR',
    startOfWeek: 'Monday',
    timeFormat: '12 Hours',
    zohoBranding: true,
    logo: '',
    // Invoice-related fields
    gstNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    brandColor: '#6366f1',
    website: '',
    taxDetails: {
      cgst: 2.5,
      sgst: 2.5,
      igst: 0,
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  });

  const [editData, setEditData] = useState({ ...orgData });

  useEffect(() => {
    const saved = localStorage.getItem('zervos_organization');
    if (saved) {
      const data = JSON.parse(saved);
      // Merge with defaults to ensure all fields exist
      const mergedData = {
        ...orgData,
        ...data,
        address: {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
          ...data.address,
        },
        taxDetails: {
          cgst: 2.5,
          sgst: 2.5,
          igst: 0,
          ...data.taxDetails,
        },
        bankDetails: {
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          ...data.bankDetails,
        },
      };
      setOrgData(mergedData);
      setEditData(mergedData);
    }
  }, []);

  const handleSave = () => {
    setOrgData(editData);
    localStorage.setItem('zervos_organization', JSON.stringify(editData));
    setEditModalOpen(false);
    toast({ title: "Success", description: "Organization settings updated successfully" });
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Basic Information</h1>
        </div>
        <Button variant="ghost" size="sm" className="text-indigo-600 gap-2">
          <Info size={16} />
        </Button>
      </div>

      {/* Organization Logo and Name */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {orgData.logo ? (
                <img src={orgData.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{orgData.businessName}</h2>
              <p className="text-sm text-gray-500">Organization Logo</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEditModalOpen(true)}
            className="gap-2"
          >
            <Edit size={16} />
            Edit
          </Button>
        </div>
      </div>

      {/* Organization Details Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Business Name</p>
            <p className="text-base font-medium text-gray-900">{orgData.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-base font-medium text-gray-900">{orgData.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Contact Number</p>
            <p className="text-base font-medium text-gray-900">{orgData.contactNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Time Zone</p>
            <p className="text-base font-medium text-gray-900">{orgData.timeZone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Currency</p>
            <p className="text-base font-medium text-gray-900">{orgData.currency}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Start of the Week</p>
            <p className="text-base font-medium text-gray-900">{orgData.startOfWeek}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Time Format</p>
            <p className="text-base font-medium text-gray-900">{orgData.timeFormat}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Zoho Bookings Branding</p>
            <Badge variant={orgData.zohoBranding ? "default" : "secondary"} className="mt-1">
              {orgData.zohoBranding ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Invoice & Tax Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoice & Tax Information</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">GST Number</p>
            <p className="text-base font-medium text-gray-900">{orgData.gstNumber || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Website</p>
            <p className="text-base font-medium text-gray-900">{orgData.website || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500 mb-1">Business Address</p>
            <p className="text-base font-medium text-gray-900">
              {orgData.address?.street || '-'}
              {orgData.address?.street && <br />}
              {[orgData.address?.city, orgData.address?.state, orgData.address?.pincode].filter(Boolean).join(', ')}
              {orgData.address?.city && <br />}
              {orgData.address?.country || 'India'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">CGST</p>
            <p className="text-base font-medium text-gray-900">{orgData.taxDetails?.cgst || 2.5}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">SGST</p>
            <p className="text-base font-medium text-gray-900">{orgData.taxDetails?.sgst || 2.5}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">IGST</p>
            <p className="text-base font-medium text-gray-900">{orgData.taxDetails?.igst || 0}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Brand Color</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded border border-gray-300" 
                style={{ backgroundColor: orgData.brandColor }}
              />
              <p className="text-base font-medium text-gray-900">{orgData.brandColor}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      {(orgData.bankDetails?.accountNumber || orgData.bankDetails?.ifscCode) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Bank Details</h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Account Name</p>
              <p className="text-base font-medium text-gray-900">{orgData.bankDetails?.accountName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Account Number</p>
              <p className="text-base font-medium text-gray-900 font-mono">{orgData.bankDetails?.accountNumber || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">IFSC Code</p>
              <p className="text-base font-medium text-gray-900">{orgData.bankDetails?.ifscCode || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bank Name</p>
              <p className="text-base font-medium text-gray-900">{orgData.bankDetails?.bankName || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Basic Information</DialogTitle>
            <DialogDescription>
              Update your organization's basic information, invoice settings, and tax details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                {editData.logo ? (
                  <img src={editData.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={40} className="text-gray-400" />
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                Upload Logo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setEditData({ ...editData, logo: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input
                value={editData.businessName}
                onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                placeholder="Enter business name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  placeholder="contact@business.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  value={editData.contactNumber}
                  onChange={(e) => setEditData({ ...editData, contactNumber: e.target.value })}
                  placeholder="+91 1234567890"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Select value={editData.timeZone} onValueChange={(v) => setEditData({ ...editData, timeZone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata - IST (+05:30)">Asia/Kolkata - IST (+05:30)</SelectItem>
                    <SelectItem value="America/New_York - EST (-05:00)">America/New_York - EST (-05:00)</SelectItem>
                    <SelectItem value="Europe/London - GMT (+00:00)">Europe/London - GMT (+00:00)</SelectItem>
                    <SelectItem value="Asia/Tokyo - JST (+09:00)">Asia/Tokyo - JST (+09:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={editData.currency} onValueChange={(v) => setEditData({ ...editData, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start of the Week</Label>
                <Select value={editData.startOfWeek} onValueChange={(v) => setEditData({ ...editData, startOfWeek: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Format</Label>
                <Select value={editData.timeFormat} onValueChange={(v) => setEditData({ ...editData, timeFormat: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12 Hours">12 Hours</SelectItem>
                    <SelectItem value="24 Hours">24 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Invoice & Tax Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Invoice & Tax Information</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input
                    value={editData.gstNumber}
                    onChange={(e) => setEditData({ ...editData, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label>Street Address</Label>
                <Input
                  value={editData.address.street}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    address: { ...editData.address, street: e.target.value }
                  })}
                  placeholder="Door No., Street, Landmark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={editData.address.city}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      address: { ...editData.address, city: e.target.value }
                    })}
                    placeholder="Bangalore"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={editData.address.state}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      address: { ...editData.address, state: e.target.value }
                    })}
                    placeholder="Karnataka"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={editData.address.pincode}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      address: { ...editData.address, pincode: e.target.value }
                    })}
                    placeholder="560001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={editData.address.country}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      address: { ...editData.address, country: e.target.value }
                    })}
                    placeholder="India"
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Label>Brand Color (for invoices)</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editData.brandColor}
                    onChange={(e) => setEditData({ ...editData, brandColor: e.target.value })}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={editData.brandColor}
                    onChange={(e) => setEditData({ ...editData, brandColor: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <h4 className="font-semibold mb-3">Tax Rates</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>CGST (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editData.taxDetails.cgst}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      taxDetails: { ...editData.taxDetails, cgst: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SGST (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editData.taxDetails.sgst}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      taxDetails: { ...editData.taxDetails, sgst: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IGST (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editData.taxDetails.igst}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      taxDetails: { ...editData.taxDetails, igst: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>
              </div>

              <h4 className="font-semibold mb-3">Bank Details (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={editData.bankDetails.accountName}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      bankDetails: { ...editData.bankDetails, accountName: e.target.value }
                    })}
                    placeholder="Business Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={editData.bankDetails.accountNumber}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      bankDetails: { ...editData.bankDetails, accountNumber: e.target.value }
                    })}
                    placeholder="1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={editData.bankDetails.ifscCode}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      bankDetails: { ...editData.bankDetails, ifscCode: e.target.value }
                    })}
                    placeholder="SBIN0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={editData.bankDetails.bankName}
                    onChange={(e) => setEditData({ 
                      ...editData, 
                      bankDetails: { ...editData.bankDetails, bankName: e.target.value }
                    })}
                    placeholder="State Bank of India"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
