import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User, Mail, Phone, Calendar, Eye, MoreVertical, Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  status: string;
  source: string;
  customerValue: number;
  teamMembers: string[];
  notes?: string;
  totalBookings: number;
  lastAppointment: string;
  bookingHistory: {
    id: string;
    service: string;
    date: string;
    status: string;
  }[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+1 234 567 8900',
      status: 'Active',
      source: 'Referral',
      customerValue: 5000,
      teamMembers: ['Sarah Johnson', 'Mike Davis'],
      notes: 'Prefers morning appointments',
      totalBookings: 5,
      lastAppointment: 'Nov 2, 2025',
      bookingHistory: [
        { id: 'b1', service: 'Technical Interview', date: 'Nov 2, 2025', status: 'Completed' },
        { id: 'b2', service: 'HR Screening', date: 'Oct 28, 2025', status: 'Completed' },
      ]
    },
    {
      id: '2',
      name: 'Jane Smith',
      phone: '+1 234 567 8901',
      status: 'Active',
      source: 'Direct',
      customerValue: 3000,
      teamMembers: ['Sarah Johnson'],
      totalBookings: 3,
      lastAppointment: 'Nov 3, 2025',
      bookingHistory: [
        { id: 'b3', service: 'HR Screening', date: 'Nov 3, 2025', status: 'Upcoming' },
      ]
    },
    {
      id: '3',
      name: 'Robert Brown',
      phone: '+1 234 567 8902',
      status: 'Inactive',
      source: 'Website',
      customerValue: 2000,
      teamMembers: ['Mike Davis'],
      totalBookings: 2,
      lastAppointment: 'Oct 28, 2025',
      bookingHistory: [
        { id: 'b4', service: 'Final Round', date: 'Oct 28, 2025', status: 'Completed' },
      ]
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    status: 'Active',
    source: '',
    customerValue: 0,
    teamMembers: [] as string[],
    notes: '',
  });
  const [customStatusInput, setCustomStatusInput] = useState('');
  const [customSourceInput, setCustomSourceInput] = useState('');

  const filteredCustomers = customers.filter(customer =>
    (customer.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (customer.phone?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleCreateCustomer = () => {
    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      totalBookings: 0,
      lastAppointment: 'N/A',
      bookingHistory: []
    };
    setCustomers([...customers, customer]);
    setIsNewCustomerOpen(false);
    setNewCustomer({ name: '', phone: '', status: 'Active', source: '', customerValue: 0, teamMembers: [], notes: '' });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer database and booking history</p>
          </div>
          <Button onClick={() => setIsNewCustomerOpen(true)} className="gap-2">
            <Plus size={18} />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Table */}
        {filteredCustomers.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.source}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${customer.customerValue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <Eye size={16} className="mr-1" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Add your first customer to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsNewCustomerOpen(true)} className="gap-2">
                <Plus size={18} />
                Add Customer
              </Button>
            )}
          </div>
        )}

        {/* Customer Detail Modal */}
        {selectedCustomer && (
          <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {selectedCustomer.name}
                </DialogTitle>
                <DialogDescription>Customer profile and booking history</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="text-sm mt-1 px-3 py-1 rounded-full inline-block font-medium" style={{
                      backgroundColor: selectedCustomer.status === 'Active' ? '#d1fae5' : '#f3f4f6',
                      color: selectedCustomer.status === 'Active' ? '#047857' : '#374151'
                    }}>
                      {selectedCustomer.status}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Source</Label>
                    <div className="text-sm mt-1">{selectedCustomer.source}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Customer Value</Label>
                    <div className="text-lg font-bold text-blue-600 mt-1">${selectedCustomer.customerValue}</div>
                  </div>
                </div>

                {/* Team Members */}
                {selectedCustomer.teamMembers.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Team Members</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedCustomer.teamMembers.map((member, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedCustomer.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

                {/* Booking History */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Booking History</Label>
                  <div className="space-y-2">
                    {selectedCustomer.bookingHistory.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.service}</div>
                            <div className="text-xs text-gray-600">{booking.date}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          booking.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setSelectedCustomer(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* New Customer Modal */}
        <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>Create a new customer profile</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  placeholder="John Doe"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>

              {/* Status Combobox */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {newCustomer.status || "Select status..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type status..."
                        value={customStatusInput}
                        onValueChange={setCustomStatusInput}
                      />
                      <CommandList>
                        <CommandEmpty>Press Enter to add custom status.</CommandEmpty>
                        <CommandGroup>
                          {['Active', 'Inactive', 'Pending'].map((status) => (
                            <CommandItem
                              key={status}
                              value={status}
                              onSelect={(value) => {
                                setNewCustomer({ ...newCustomer, status: value });
                                setCustomStatusInput('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newCustomer.status === status ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {status}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="border-t p-2">
                        <Input
                          placeholder="Type custom status..."
                          className="h-8 text-sm border-slate-300"
                          value={customStatusInput}
                          onChange={(e) => setCustomStatusInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customStatusInput.trim()) {
                              setNewCustomer({ ...newCustomer, status: customStatusInput.trim() });
                              setCustomStatusInput('');
                            }
                          }}
                        />
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Source Combobox */}
              <div className="space-y-2">
                <Label>Source</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {newCustomer.source || "Select or type source..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[220px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search or type source..."
                        value={customSourceInput}
                        onValueChange={setCustomSourceInput}
                      />
                      <CommandList>
                        <CommandEmpty>Press Enter to add custom source.</CommandEmpty>
                        <CommandGroup>
                          {['Direct', 'Referral', 'Website', 'Social Media'].map((source) => (
                            <CommandItem
                              key={source}
                              value={source}
                              onSelect={(value) => {
                                setNewCustomer({ ...newCustomer, source: value });
                                setCustomSourceInput('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newCustomer.source === source ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {source}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div className="border-t p-2">
                        <Input
                          placeholder="Type custom source..."
                          className="h-8 text-sm border-slate-300"
                          value={customSourceInput}
                          onChange={(e) => setCustomSourceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && customSourceInput.trim()) {
                              setNewCustomer({ ...newCustomer, source: customSourceInput.trim() });
                              setCustomSourceInput('');
                            }
                          }}
                        />
                      </div>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Customer Value */}
              <div className="space-y-2">
                <Label htmlFor="customerValue">Customer Value</Label>
                <Input
                  id="customerValue"
                  type="number"
                  placeholder="0"
                  value={newCustomer.customerValue || ''}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerValue: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Team Members (as text, comma separated) */}
              <div className="space-y-2">
                <Label htmlFor="teamMembers">Team Members (comma separated)</Label>
                <Input
                  id="teamMembers"
                  placeholder="John Smith, Sarah Johnson"
                  value={newCustomer.teamMembers.join(', ')}
                  onChange={(e) => setNewCustomer({ 
                    ...newCustomer, 
                    teamMembers: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                  })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsNewCustomerOpen(false);
                  setCustomStatusInput('');
                  setCustomSourceInput('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name || !newCustomer.phone || !newCustomer.status || !newCustomer.source}
              >
                Add Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
