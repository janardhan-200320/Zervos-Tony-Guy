import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  HelpCircle, 
  Mail, 
  UserPlus, 
  Share2,
  MoreVertical,
  Shield,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Salesperson {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Salesperson' | 'Viewer';
  avatar?: string;
  color: string;
}

export default function SalespersonsPage() {
  const [company, setCompany] = useState<any>(null);
  const [orgLabels, setOrgLabels] = useState<{ teamMemberLabel?: string } | null>(null);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({
    emails: '',
    role: 'Salesperson' as Salesperson['role'],
  });
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zervos_company');
      if (raw) setCompany(JSON.parse(raw));
      const orgSettingsRaw = localStorage.getItem('zervos_organization_settings');
      if (orgSettingsRaw) {
        try {
          const org = JSON.parse(orgSettingsRaw);
          const tm = org?.labels?.teamMemberLabel || org?.teamMemberLabel;
          if (tm) setOrgLabels({ teamMemberLabel: tm });
        } catch {}
      }

      // Load salespersons from localStorage (prefer unified admin store, fallback to team members)
      const savedAdmin = localStorage.getItem('zervos_salespersons');
      if (savedAdmin) {
        const list = JSON.parse(savedAdmin);
        const formatted = list.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role === 'Staff' ? 'Salesperson' : (p.role || 'Salesperson'),
          color: p.color || getRandomColor()
        }));
        setSalespersons(formatted);
        return;
      }
      const savedMembers = localStorage.getItem('zervos_team_members');
      if (savedMembers) {
        const members = JSON.parse(savedMembers);
        const formatted = members.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role || 'Salesperson',
          color: member.color || getRandomColor()
        }));
        setSalespersons(formatted);
      }
    } catch {}
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, []);

  const teamMemberLabel = orgLabels?.teamMemberLabel || company?.teamMemberLabel || 'Salespersons';
  const teamMemberSingular = teamMemberLabel.endsWith('s') 
    ? teamMemberLabel.slice(0, -1) 
    : teamMemberLabel;

  const getRandomColor = () => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-orange-500',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddSalesperson = () => {
    // Parse multiple emails
    const emailList = newPerson.emails
      .split(/[\s,]+/)
      .filter(email => email.trim() !== '');
    
    const newSalespersons = emailList.map(email => ({
      id: `${Date.now()}-${Math.random()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email: email.trim(),
      role: newPerson.role,
      color: getRandomColor(),
      phone: '',
      appointmentsCount: 0,
      availability: 'Mon-Fri, 9 AM - 5 PM'
    }));

    const updatedSalespersons = [...salespersons, ...newSalespersons];
    setSalespersons(updatedSalespersons);

    // Save to localStorage (both stores) and notify others
    localStorage.setItem('zervos_team_members', JSON.stringify(updatedSalespersons));
    try {
      // Convert to admin/salespersons richer shape to keep Admin Center in sync immediately
      const toAdmin = (items: typeof updatedSalespersons) => items.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: (m as any).phone || '',
        role: m.role === 'Salesperson' ? 'Staff' : m.role,
        workspace: (m as any).workspace || 'bharath',
        status: (m as any).status || 'Active',
        availability: (m as any).availability || 'Full Time',
        workload: (m as any).workload || 'Low',
        profilePicture: (m as any).profilePicture || undefined,
        permissions: undefined,
        availabilitySchedule: undefined,
        timezone: (m as any).timezone || 'Asia/Kolkata',
        totalBookings: (m as any).appointmentsCount || 0,
        averageRating: (m as any).averageRating || 0,
        bookingLink: (m as any).bookingLink || `${window.location.origin}/book/${m.id}`,
        notes: (m as any).notes || ''
      }));
      localStorage.setItem('zervos_salespersons', JSON.stringify(toAdmin(updatedSalespersons)));
    } catch {}
    window.dispatchEvent(new CustomEvent('team-members-updated'));
    
    setIsAddOpen(false);
    setNewPerson({
      emails: '',
      role: 'Salesperson',
    });
    toast({
      title: "Success",
      description: `${newSalespersons.length} ${teamMemberLabel.toLowerCase()} invited successfully`,
    });
  };

  const handleShare = (person: Salesperson) => {
    const link = `${window.location.origin}/book/${person.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Booking link copied to clipboard",
    });
  };

  const handleDelete = (id: string) => {
    const updated = salespersons.filter(p => p.id !== id);
    setSalespersons(updated);
    localStorage.setItem('zervos_team_members', JSON.stringify(updated));
    try {
      const toAdmin = (items: typeof updated) => items.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role === 'Salesperson' ? 'Staff' : m.role,
        workspace: (m as any).workspace || 'bharath',
        status: (m as any).status || 'Active',
        availability: (m as any).availability || 'Full Time',
      }));
      localStorage.setItem('zervos_salespersons', JSON.stringify(toAdmin(updated)));
    } catch {}
    window.dispatchEvent(new CustomEvent('team-members-updated'));
    toast({
      title: "Deleted",
      description: `${teamMemberSingular} removed successfully`,
    });
  };

  const filteredSalespersons = salespersons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Admin':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Salesperson':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Viewer':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Active {teamMemberLabel}
              </h1>
              <Badge variant="secondary" className="text-sm">
                {filteredSalespersons.length}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Manage your team members and their access levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder={`Search ${teamMemberLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <UserPlus size={18} />
            New {teamMemberSingular}
          </Button>
        </div>

        {/* Salespersons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`s-${i}`} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-4 w-56" />
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSalespersons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSalespersons.map((person) => (
              <div 
                key={person.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${person.color} flex items-center justify-center text-white font-bold text-lg`}>
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{person.name}</h3>
                      <Badge className={`mt-1 text-xs ${getRoleBadgeColor(person.role)}`}>
                        {person.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit size={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(person)}>
                        <Share2 size={16} className="mr-2" />
                        Copy Booking Link
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(person.id)}
                        className="text-red-600"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{person.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={() => handleShare(person)}
                    variant="outline" 
                    className="w-full gap-2"
                  >
                    <Share2 size={16} />
                    Share Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <User size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {teamMemberLabel.toLowerCase()} found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search query' 
                : `Add your first ${teamMemberSingular.toLowerCase()} to get started`
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                <UserPlus size={18} />
                Add {teamMemberSingular}
              </Button>
            )}
          </div>
        )}

        {/* Invite Salesperson Modal */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite {teamMemberLabel}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emails">
                  Emails <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="emails"
                  placeholder="Enter email addresses separated by a space or comma"
                  value={newPerson.emails}
                  onChange={(e) => setNewPerson({ ...newPerson, emails: e.target.value })}
                  className="h-20"
                />
                <p className="text-xs text-gray-500">
                  You can invite multiple people by separating email addresses with spaces or commas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <select
                  id="role"
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value as Salesperson['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Salesperson">Staff</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSalesperson}
                disabled={!newPerson.emails.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
