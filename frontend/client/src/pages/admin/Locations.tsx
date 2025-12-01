import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MapPin, MoreVertical, Edit, Trash2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description?: string;
}

export default function Locations() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewLocationOpen, setIsNewLocationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    description: ''
  });

  const storageKey = 'zervos_locations';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setLocations(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const persistLocations = (locs: Location[]) => {
    setLocations(locs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(locs));
    } catch {}
  };

  const handleCreateLocation = () => {
    if (!newLocation.name || !newLocation.address) {
      toast({ title: 'Error', description: 'Name and address are required', variant: 'destructive' });
      return;
    }
    const location: Location = {
      id: Date.now().toString(),
      ...newLocation
    };
    persistLocations([...locations, location]);
    setIsNewLocationOpen(false);
    setNewLocation({ name: '', address: '', city: '', state: '', zipCode: '', country: '', description: '' });
    toast({ title: 'Success', description: 'Location created successfully' });
  };

  const handleEdit = (location: Location) => {
    setEditingLocation({ ...location });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingLocation) return;
    const updated = locations.map(l => l.id === editingLocation.id ? editingLocation : l);
    persistLocations(updated);
    setIsEditOpen(false);
    setEditingLocation(null);
    toast({ title: 'Success', description: 'Location updated successfully' });
  };

  const handleDelete = (id: string) => {
    persistLocations(locations.filter(l => l.id !== id));
    toast({ title: 'Success', description: 'Location deleted successfully' });
  };

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">In-person Locations</h1>
            <Badge variant="outline">{locations.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                className="pl-10"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsNewLocationOpen(true)}>
              <Plus size={16} className="mr-2" /> New Location
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-8">
        {filteredLocations.length === 0 && !searchQuery ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="mx-auto w-40 h-40 bg-purple-50 rounded-full mb-6 flex items-center justify-center">
              <MapPin size={48} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No in-person locations added.</h3>
            <p className="text-gray-600 mb-6">
              Add in-person locations to specify a meeting location for your appointments.
            </p>
            <Button onClick={() => setIsNewLocationOpen(true)}>
              <Plus size={16} className="mr-2" /> New Location
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <div key={location.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="text-purple-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <p className="text-sm text-gray-500">{location.city || 'No city'}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(location)}>
                        <Edit size={16} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(location.id)} className="text-red-600">
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{location.address}</span>
                  </p>
                  {location.city && (
                    <p className="pl-6">{location.city}{location.state && `, ${location.state}`} {location.zipCode}</p>
                  )}
                  {location.country && <p className="pl-6">{location.country}</p>}
                  {location.description && (
                    <p className="pt-2 text-gray-500 italic">{location.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Location Dialog */}
      <Dialog open={isNewLocationOpen} onOpenChange={setIsNewLocationOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New In-person Location</DialogTitle>
            <DialogDescription>Add a new physical location for appointments</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Location Name *</Label>
              <Input
                placeholder="e.g., Main Office, Conference Room A"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address *</Label>
              <Input
                placeholder="Street address"
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  placeholder="City"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>State/Province</Label>
                <Input
                  placeholder="State"
                  value={newLocation.state}
                  onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ZIP/Postal Code</Label>
                <Input
                  placeholder="ZIP Code"
                  value={newLocation.zipCode}
                  onChange={(e) => setNewLocation({ ...newLocation, zipCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  placeholder="Country"
                  value={newLocation.country}
                  onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Additional details about this location"
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLocationOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLocation}>Create Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      {editingLocation && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
              <DialogDescription>Update location details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Location Name *</Label>
                <Input
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address *</Label>
                <Input
                  value={editingLocation.address}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={editingLocation.city}
                    onChange={(e) => setEditingLocation({ ...editingLocation, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State/Province</Label>
                  <Input
                    value={editingLocation.state}
                    onChange={(e) => setEditingLocation({ ...editingLocation, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ZIP/Postal Code</Label>
                  <Input
                    value={editingLocation.zipCode}
                    onChange={(e) => setEditingLocation({ ...editingLocation, zipCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={editingLocation.country}
                    onChange={(e) => setEditingLocation({ ...editingLocation, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={editingLocation.description}
                  onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
