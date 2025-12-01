import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package, ChevronLeft, Share, Trash2, Edit, Clock, X, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import AddResourceModal from '@/components/resources/AddResourceModal';
import type { InsertResource, Resource } from '@shared/schema';

interface SalesCall {
  id: string;
  name: string;
  duration: string;
  type: string;
}

interface WorkingHours {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface ResourceWithDetails extends Resource {
  userInCharge?: string;
  assignedCalls?: string[];
  workingHours?: WorkingHours[];
  integrations?: {
    zohoCalendar?: boolean;
    googleCalendar?: boolean;
    outlookCalendar?: boolean;
  };
}

export default function Resources() {
  const [resources, setResources] = useState<ResourceWithDetails[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Inline edit mode for Basic Information tab
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  // Inline edit modes for other tabs
  const [isInlineAssigning, setIsInlineAssigning] = useState(false);
  const [isInlineWorkingHours, setIsInlineWorkingHours] = useState(false);
  const [isInlineIntegrations, setIsInlineIntegrations] = useState(false);
  const [isAssignCallsModalOpen, setIsAssignCallsModalOpen] = useState(false);
  const [isEditWorkingHoursModalOpen, setIsEditWorkingHoursModalOpen] = useState(false);
  const [salesCalls, setSalesCalls] = useState<SalesCall[]>([]);
  const [editingResource, setEditingResource] = useState<ResourceWithDetails | null>(null);
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('isEditModalOpen changed to:', isEditModalOpen);
  }, [isEditModalOpen]);

  useEffect(() => {
    console.log('editingResource changed to:', editingResource);
  }, [editingResource]);

  // Load resources from localStorage
  useEffect(() => {
    const storageKey = selectedWorkspace ? `zervos_resources_${selectedWorkspace.id}` : 'zervos_resources';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setResources(JSON.parse(saved));
    }
  }, [selectedWorkspace]);

  // Load sales calls
  useEffect(() => {
    const storageKey = selectedWorkspace ? `zervos_sales_calls::${selectedWorkspace.id}` : 'zervos_sales_calls';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const calls = JSON.parse(saved);
      setSalesCalls(calls.map((call: any) => ({
        id: call.id,
        name: call.name,
        duration: call.action || '30 mins',
        type: call.bookingType || 'One-on-One'
      })));
    }
  }, [selectedWorkspace]);

  const saveResources = (updatedResources: ResourceWithDetails[]) => {
    const storageKey = selectedWorkspace ? `zervos_resources_${selectedWorkspace.id}` : 'zervos_resources';
    localStorage.setItem(storageKey, JSON.stringify(updatedResources));
    setResources(updatedResources);
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  const handleSaveResource = async (resource: InsertResource) => {
    try {
      const defaultWorkingHours: WorkingHours[] = [
        { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Friday', enabled: true, startTime: '09:00', endTime: '17:00' },
        { day: 'Saturday', enabled: false, startTime: '09:00', endTime: '17:00' },
        { day: 'Sunday', enabled: false, startTime: '09:00', endTime: '17:00' }
      ];

      const now = new Date().toISOString();
      const newResource: ResourceWithDetails = {
        id: Date.now().toString(),
        name: resource.name,
        type: resource.type,
        description: resource.description || null,
        status: 'active',
        capacity: '1',
        assignedUsers: [],
        availabilitySchedule: {},
        assignedCalls: [],
        workingHours: defaultWorkingHours,
        integrations: {
          zohoCalendar: false,
          googleCalendar: false,
          outlookCalendar: false
        },
        createdAt: now,
        updatedAt: now
      };

      const updated = [...resources, newResource];
      saveResources(updated);
      setIsAddModalOpen(false);
      setSelectedResourceId(newResource.id);
      
      toast({
        title: 'Success',
        description: 'Resource created successfully'
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resource',
        variant: 'destructive'
      });
    }
  };

  const handleEditResource = () => {
    console.log('Edit button clicked!');
    console.log('selectedResourceId:', selectedResourceId);
    console.log('resources:', resources);
    const resource = resources.find(r => r.id === selectedResourceId);
    console.log('Found resource:', resource);
    if (resource) {
      // Prefer inline editing in Basic Info for quicker edits
      setEditingResource({ ...resource });
      setIsInlineEditing(true);
      console.log('Inline edit enabled');
    } else {
      console.log('Resource not found!');
    }
  };

  const handleSaveEdit = () => {
    if (editingResource) {
      const updated = resources.map(r => 
        r.id === editingResource.id ? editingResource : r
      );
      saveResources(updated);
      setIsEditModalOpen(false);
      toast({
        title: 'Success',
        description: 'Resource updated successfully'
      });
    }
  };

  // Helpers for inline editing flows
  const saveEditingResource = () => {
    if (!editingResource) return;
    const updated = resources.map(r => r.id === editingResource.id ? editingResource : r);
    saveResources(updated);
  };

  const handleToggleCallAssignmentInline = (callId: string) => {
    setEditingResource(prev => {
      if (!prev) return prev;
      const assigned = new Set(prev.assignedCalls || []);
      if (assigned.has(callId)) assigned.delete(callId); else assigned.add(callId);
      return { ...prev, assignedCalls: Array.from(assigned) };
    });
  };

  const handleToggleIntegrationInline = (key: 'zohoCalendar' | 'googleCalendar' | 'outlookCalendar') => {
    setEditingResource(prev => {
      if (!prev) return prev;
      const current = prev.integrations || {} as any;
      return { ...prev, integrations: { ...current, [key]: !current?.[key] } } as any;
    });
  };

  const handleDeleteResource = () => {
    if (selectedResourceId && confirm('Are you sure you want to delete this resource?')) {
      const updated = resources.filter(r => r.id !== selectedResourceId);
      saveResources(updated);
      setSelectedResourceId(null);
      toast({
        title: 'Success',
        description: 'Resource deleted successfully'
      });
    }
  };

  const handleAssignCalls = () => {
    setIsAssignCallsModalOpen(true);
  };

  const handleToggleCallAssignment = (callId: string) => {
    const resource = resources.find(r => r.id === selectedResourceId);
    if (resource) {
      const assignedCalls = resource.assignedCalls || [];
      const updated = resources.map(r => {
        if (r.id === selectedResourceId) {
          return {
            ...r,
            assignedCalls: assignedCalls.includes(callId)
              ? assignedCalls.filter(id => id !== callId)
              : [...assignedCalls, callId]
          };
        }
        return r;
      });
      saveResources(updated);
    }
  };

  const handleSaveWorkingHours = () => {
    if (editingResource) {
      const updated = resources.map(r => 
        r.id === editingResource.id ? editingResource : r
      );
      saveResources(updated);
      setIsEditWorkingHoursModalOpen(false);
      toast({
        title: 'Success',
        description: 'Working hours updated successfully'
      });
    }
  };

  const handleToggleIntegration = (integration: 'zohoCalendar' | 'googleCalendar' | 'outlookCalendar') => {
    const resource = resources.find(r => r.id === selectedResourceId);
    if (resource) {
      const updated = resources.map(r => {
        if (r.id === selectedResourceId) {
          return {
            ...r,
            integrations: {
              ...r.integrations,
              [integration]: !r.integrations?.[integration]
            }
          };
        }
        return r;
      });
      saveResources(updated);
      toast({
        title: 'Success',
        description: `${integration.replace('Calendar', ' Calendar')} ${resource.integrations?.[integration] ? 'disconnected' : 'connected'}`
      });
    }
  };

  // If a resource is selected, show detail view
  if (selectedResourceId) {
    const resource = resources.find(r => r.id === selectedResourceId);
    if (!resource) {
      setSelectedResourceId(null);
      return null;
    }

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResourceId(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={20} />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">{resource.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share size={16} className="mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDeleteResource}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="basic-info" className="w-full">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="basic-info">Basic Information</TabsTrigger>
                <TabsTrigger value="assigned-calls">Assigned Sales Calls</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={handleEditResource}>
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            </div>

            <TabsContent value="basic-info" className="mt-6 space-y-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-lg bg-pink-200 flex items-center justify-center text-pink-700 font-semibold text-2xl">
                    {resource.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-2 gap-x-12 gap-y-6">
                  {/* Resource Name */}
                  <div>
                    <Label className="text-gray-600 text-sm">Resource Name</Label>
                    {isInlineEditing ? (
                      <Input
                        className="mt-1"
                        value={editingResource?.name || ''}
                        onChange={(e) => setEditingResource(prev => prev ? { ...prev, name: e.target.value } : prev)}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium mt-1">{resource.name}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <Label className="text-gray-600 text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    </div>
                  </div>

                  {/* User in Charge */}
                  <div>
                    <Label className="text-gray-600 text-sm">User in Charge</Label>
                    {isInlineEditing ? (
                      <Input
                        className="mt-1"
                        value={editingResource?.userInCharge || ''}
                        onChange={(e) => setEditingResource(prev => prev ? { ...prev, userInCharge: e.target.value } : prev)}
                        placeholder="Optional"
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{resource.userInCharge || '-'}</p>
                    )}
                  </div>

                  {/* Workspace (show type here as before) */}
                  <div>
                    <Label className="text-gray-600 text-sm">Workspace</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-pink-200 flex items-center justify-center text-pink-700 font-semibold text-xs">
                        BH
                      </div>
                      {isInlineEditing ? (
                        <Select
                          value={editingResource?.type || ''}
                          onValueChange={(value) => setEditingResource(prev => prev ? { ...prev, type: value } : prev)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Room">Room</SelectItem>
                            <SelectItem value="Equipment">Equipment</SelectItem>
                            <SelectItem value="Vehicle">Vehicle</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-gray-900">{resource.type || 'bharath'}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <Label className="text-gray-600 text-sm">Description</Label>
                    {isInlineEditing ? (
                      <Textarea
                        className="mt-1"
                        rows={3}
                        value={editingResource?.description || ''}
                        onChange={(e) => setEditingResource(prev => prev ? { ...prev, description: e.target.value } : prev)}
                      />
                    ) : (
                      <p className="text-gray-900 mt-1">{resource.description || '-'}</p>
                    )}
                  </div>

                  {isInlineEditing && (
                    <div className="col-span-2 flex items-center gap-3 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editingResource) {
                            const updated = resources.map(r => r.id === editingResource.id ? editingResource : r);
                            saveResources(updated);
                            setIsInlineEditing(false);
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsInlineEditing(false);
                          const original = resources.find(r => r.id === resource.id);
                          if (original) setEditingResource({ ...original });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assigned-calls" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input className="pl-10" placeholder="Search Sales Call" />
                </div>
                {isInlineAssigning ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        saveEditingResource();
                        setIsInlineAssigning(false);
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsInlineAssigning(false);
                        // discard edits
                        const original = resources.find(r => r.id === resource.id);
                        if (original) setEditingResource({ ...original });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => { setEditingResource({ ...resource }); setIsInlineAssigning(true); }}
                  >
                    <Plus size={16} className="mr-2" />
                    Assign
                  </Button>
                )}
              </div>

              {isInlineAssigning ? (
                <div className="space-y-3">
                  {salesCalls.length > 0 ? (
                    salesCalls.map(call => {
                      const isChecked = (editingResource?.assignedCalls || []).includes(call.id);
                      return (
                        <div key={call.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Clock size={24} className="text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{call.name}</h4>
                              <p className="text-sm text-gray-500">{call.duration} • {call.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isChecked} onCheckedChange={() => handleToggleCallAssignmentInline(call.id)} />
                            <span className="text-sm text-gray-600">{isChecked ? 'Selected' : 'Select'}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-8">No sales calls available</p>
                  )}
                </div>
              ) : (
                <>
                  {resource.assignedCalls && resource.assignedCalls.length > 0 ? (
                    <div className="space-y-3">
                      {resource.assignedCalls.map(callId => {
                        const call = salesCalls.find(c => c.id === callId);
                        if (!call) return null;
                        return (
                          <div key={callId} className="border rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Clock size={24} className="text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{call.name}</h4>
                                <p className="text-sm text-gray-500">{call.duration} • {call.type}</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleToggleCallAssignment(callId)}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto w-40 h-40 bg-purple-50 rounded-full mb-4 flex items-center justify-center">
                        <Package size={48} className="text-purple-400" />
                      </div>
                      <p className="text-gray-600">No Sales Call Assigned</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="availability" className="mt-6 space-y-8">
              {/* Working Hours */}
              <div className="border-l-4 border-purple-600 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Working Hours</h3>
                    <p className="text-sm text-gray-600">Set weekly available days and hours.</p>
                  </div>
                  {isInlineWorkingHours ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { saveEditingResource(); setIsInlineWorkingHours(false); }}>Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => { setIsInlineWorkingHours(false); const original = resources.find(r => r.id === resource.id); if (original) setEditingResource({ ...original }); }}>Cancel</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      onClick={() => { setEditingResource({ ...resource }); setIsInlineWorkingHours(true); }}
                    >
                      <Edit size={16} className="mr-2" />
                      Customize working hours
                    </Button>
                  )}
                </div>
                
                {isInlineWorkingHours ? (
                  <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                    {editingResource?.workingHours?.map((day, index) => (
                      <div key={day.day} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <Switch
                            checked={day.enabled}
                            onCheckedChange={(checked) => {
                              const updated = [...(editingResource?.workingHours || [])];
                              updated[index] = { ...day, enabled: !!checked };
                              setEditingResource(prev => prev ? { ...prev, workingHours: updated } : prev);
                            }}
                          />
                          <span className="font-medium w-24">{day.day}</span>
                        </div>
                        {day.enabled && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => {
                                const updated = [...(editingResource?.workingHours || [])];
                                updated[index] = { ...day, startTime: e.target.value };
                                setEditingResource(prev => prev ? { ...prev, workingHours: updated } : prev);
                              }}
                              className="w-32"
                            />
                            <span className="text-gray-500">to</span>
                            <Input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => {
                                const updated = [...(editingResource?.workingHours || [])];
                                updated[index] = { ...day, endTime: e.target.value };
                                setEditingResource(prev => prev ? { ...prev, workingHours: updated } : prev);
                              }}
                              className="w-32"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : resource.workingHours && resource.workingHours.length > 0 ? (
                  <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                    {resource.workingHours.map((day) => (
                      <div key={day.day} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className={`font-medium ${day.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                          {day.day}
                        </span>
                        {day.enabled ? (
                          <span className="text-sm text-gray-600">
                            {day.startTime} - {day.endTime}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">Unavailable</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      i
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{resource.name}</span> follows usual working hours.
                    </p>
                  </div>
                )}
              </div>

              {/* Special Working Hours */}
              <div className="border-l-4 border-purple-600 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Special Working Hours</h3>
                    <p className="text-sm text-gray-600">Add extra available days or hours.</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus size={16} className="mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Unavailability */}
              <div className="border-l-4 border-purple-600 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Unavailability</h3>
                    <p className="text-sm text-gray-600">Add extra unavailable days or hours.</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus size={16} className="mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Integrations</h3>
                {isInlineIntegrations ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { saveEditingResource(); setIsInlineIntegrations(false); }}>Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={() => { setIsInlineIntegrations(false); const original = resources.find(r => r.id === resource.id); if (original) setEditingResource({ ...original }); }}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setEditingResource({ ...resource }); setIsInlineIntegrations(true); }}>
                    <Edit size={16} className="mr-2" /> Edit
                  </Button>
                )}
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Calendar Integration</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <div className="mb-2 text-2xl">📅</div>
                      <p className="font-medium mb-2">Zoho Calendar</p>
                      {(isInlineIntegrations ? editingResource?.integrations?.zohoCalendar : resource.integrations?.zohoCalendar) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-green-600 border-green-600"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('zohoCalendar') : handleToggleIntegration('zohoCalendar')}
                        >
                          <Check size={16} className="mr-2" />
                          Connected
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('zohoCalendar') : handleToggleIntegration('zohoCalendar')}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <div className="mb-2 text-2xl">�</div>
                      <p className="font-medium mb-2">Google Calendar</p>
                      {(isInlineIntegrations ? editingResource?.integrations?.googleCalendar : resource.integrations?.googleCalendar) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-green-600 border-green-600"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('googleCalendar') : handleToggleIntegration('googleCalendar')}
                        >
                          <Check size={16} className="mr-2" />
                          Connected
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('googleCalendar') : handleToggleIntegration('googleCalendar')}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <div className="mb-2 text-2xl">�</div>
                      <p className="font-medium mb-2">Outlook Calendar</p>
                      {(isInlineIntegrations ? editingResource?.integrations?.outlookCalendar : resource.integrations?.outlookCalendar) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-green-600 border-green-600"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('outlookCalendar') : handleToggleIntegration('outlookCalendar')}
                        >
                          <Check size={16} className="mr-2" />
                          Connected
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => isInlineIntegrations ? handleToggleIntegrationInline('outlookCalendar') : handleToggleIntegration('outlookCalendar')}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">Resources</h1>
            <Badge variant="outline">{resources.length}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input className="pl-10" placeholder="Search Resource" />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} className="mr-2" /> New Resource
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-8">
        {resources.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="mx-auto w-40 h-40 bg-purple-50 rounded-full mb-6 flex items-center justify-center">
              <Package size={48} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources added.</h3>
            <p className="text-gray-600 mb-6">
              Add resources like conference rooms and equipment so customers can book them.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} className="mr-2" /> New Resource
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedResourceId(resource.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Package size={28} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{resource.type}</p>
                    <div className="mt-3">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        {resource.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {resource.assignedCalls && resource.assignedCalls.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      {resource.assignedCalls.length} sales call{resource.assignedCalls.length > 1 ? 's' : ''} assigned
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveResource}
      />

      {/* Edit Resource Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editingResource && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Resource Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editingResource.name || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditingResource(prev => prev ? { ...prev, name: newValue } : null);
                  }}
                  placeholder="Enter resource name"
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editingResource.type || ''}
                  onValueChange={(value) => {
                    setEditingResource(prev => prev ? { ...prev, type: value } : null);
                  }}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Room">Room</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingResource.description || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditingResource(prev => prev ? { ...prev, description: newValue } : null);
                  }}
                  rows={3}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="edit-user">User in Charge</Label>
                <Input
                  id="edit-user"
                  type="text"
                  value={editingResource.userInCharge || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditingResource(prev => prev ? { ...prev, userInCharge: newValue } : null);
                  }}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Sales Calls Modal */}
      <Dialog open={isAssignCallsModalOpen} onOpenChange={setIsAssignCallsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Sales Calls</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {salesCalls.length > 0 ? (
              salesCalls.map(call => {
                const resource = resources.find(r => r.id === selectedResourceId);
                const isAssigned = resource?.assignedCalls?.includes(call.id);
                return (
                  <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={() => handleToggleCallAssignment(call.id)}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{call.name}</p>
                        <p className="text-sm text-gray-500">{call.duration} • {call.type}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-8">No sales calls available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAssignCallsModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Working Hours Modal */}
      <Dialog open={isEditWorkingHoursModalOpen} onOpenChange={setIsEditWorkingHoursModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customize Working Hours</DialogTitle>
          </DialogHeader>
          {editingResource && editingResource.workingHours && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {editingResource.workingHours.map((day, index) => (
                <div key={day.day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={day.enabled}
                      onCheckedChange={(checked) => {
                        const updated = [...editingResource.workingHours!];
                        updated[index] = { ...day, enabled: checked };
                        setEditingResource({ ...editingResource, workingHours: updated });
                      }}
                    />
                    <span className="font-medium w-24">{day.day}</span>
                  </div>
                  {day.enabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => {
                          const updated = [...editingResource.workingHours!];
                          updated[index] = { ...day, startTime: e.target.value };
                          setEditingResource({ ...editingResource, workingHours: updated });
                        }}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => {
                          const updated = [...editingResource.workingHours!];
                          updated[index] = { ...day, endTime: e.target.value };
                          setEditingResource({ ...editingResource, workingHours: updated });
                        }}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWorkingHoursModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkingHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
