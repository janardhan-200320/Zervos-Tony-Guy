import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Share2, Trash2, Check, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DashboardLayout from '@/components/DashboardLayout';

const getInitials = (name: string) => {
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function WorkspaceView() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/dashboard/workspace/:id');
  const { setSelectedWorkspace, setWorkspaces, workspaces } = useWorkspace();
  const [workspace, setWorkspace] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    prefix: '',
    maxDigits: 5,
  });

  // Load workspace from URL parameter
  useEffect(() => {
    if (params?.id) {
      const found = workspaces.find(w => w.id === params.id);
      if (found) {
        setWorkspace(found);
        setSelectedWorkspace(found);
        setEditForm({
          name: found.name,
          email: found.email || '',
          description: found.description || '',
          status: found.status,
          prefix: found.prefix || '',
          maxDigits: found.maxDigits || 5,
        });
      }
    }
  }, [params?.id, workspaces]);

  const handleBack = () => {
    setSelectedWorkspace(null);
    setLocation('/dashboard/admin-center');
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (workspace) {
      setEditForm({
        name: workspace.name,
        email: workspace.email || '',
        description: workspace.description || '',
        status: workspace.status,
        prefix: workspace.prefix || '',
        maxDigits: workspace.maxDigits || 5,
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (workspace) {
      const updatedWorkspaces = workspaces.map(w => {
        if (w.id === workspace.id) {
          return {
            ...w,
            name: editForm.name,
            email: editForm.email,
            description: editForm.description,
            status: editForm.status,
            prefix: editForm.prefix,
            maxDigits: editForm.maxDigits,
            initials: getInitials(editForm.name),
          };
        }
        return w;
      });
      setWorkspaces(updatedWorkspaces);
      
      const updated = updatedWorkspaces.find(w => w.id === workspace.id);
      if (updated) {
        setWorkspace(updated);
        setSelectedWorkspace(updated);
      }
    }
    setIsEditing(false);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const handleDelete = () => {
    if (workspace && window.confirm('Are you sure you want to delete this workspace?')) {
      setWorkspaces(workspaces.filter(w => w.id !== workspace.id));
      setSelectedWorkspace(null);
      setLocation('/dashboard/admin-center');
    }
  };

  const handleCopyLink = () => {
    if (workspace) {
      navigator.clipboard.writeText(workspace.bookingLink);
    }
  };

  if (!workspace) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Save Alert */}
        {showSaveAlert && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <Check size={20} />
            <span>Changes saved successfully!</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">{workspace.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(true)}
                className="text-purple-600 border-purple-200"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="mb-6 bg-transparent border-b w-full justify-start rounded-none h-auto p-0">
                <TabsTrigger 
                  value="basic" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-3"
                >
                  Basic Information
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-3"
                >
                  Preferences
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="mt-0">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={`w-20 h-20 ${workspace.color} rounded-2xl flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-gray-900">{workspace.initials}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900">{editForm.name || workspace.name}</h2>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={handleStartEdit}
                        className="text-purple-600 border-purple-200"
                      >
                        <Pencil size={16} className="mr-2" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSave}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Workspace Name {isEditing && <span className="text-red-500">*</span>}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-12"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{workspace.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Email</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="h-12"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{workspace.email || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Description</Label>
                      {isEditing ? (
                        <Textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="min-h-[100px]"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{workspace.description || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Status</Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={editForm.status === 'Active' ? 'default' : 'outline'}
                            onClick={() => setEditForm({ ...editForm, status: 'Active' })}
                            className={editForm.status === 'Active' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                          >
                            Active
                          </Button>
                          <Button
                            type="button"
                            variant={editForm.status === 'Inactive' ? 'default' : 'outline'}
                            onClick={() => setEditForm({ ...editForm, status: 'Inactive' })}
                            className={editForm.status === 'Inactive' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                          >
                            Inactive
                          </Button>
                        </div>
                      ) : (
                        <div className="inline-block">
                          <span
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                              workspace.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {workspace.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="mt-0">
                <div className="bg-white rounded-lg border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-12 bg-purple-600 rounded-full"></div>
                      <h3 className="text-xl font-semibold text-gray-900">Auto-generate Booking ID</h3>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={handleStartEdit}
                        className="text-purple-600 border-purple-200"
                      >
                        <Pencil size={16} className="mr-2" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSave}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Save
                        </Button>
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Set Prefix {isEditing && <span className="text-red-500">*</span>}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={editForm.prefix}
                          onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value })}
                          className="h-12"
                          placeholder="BY"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{workspace.prefix || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Maximum Digits Allowed {isEditing && <span className="text-red-500">*</span>}
                      </Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.maxDigits}
                          onChange={(e) => setEditForm({ ...editForm, maxDigits: parseInt(e.target.value) || 5 })}
                          className="h-12"
                          min="1"
                          max="10"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{workspace.maxDigits || 5}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-[600px] p-0">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Share Booking Link</DialogTitle>
              </DialogHeader>
            </div>
            
            <div className="px-6 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${workspace.color} rounded-2xl flex items-center justify-center`}>
                  <span className="text-lg font-bold text-gray-900">{workspace.initials}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-purple-700 font-medium truncate">
                    {workspace.bookingLink}
                  </p>
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="bg-purple-600 hover:bg-purple-700 px-6"
                >
                  Copy
                </Button>
              </div>

              <Tabs defaultValue="shorten" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="shorten">Shorten Link</TabsTrigger>
                  <TabsTrigger value="onetime">One time Link</TabsTrigger>
                  <TabsTrigger value="embed">Embed as Widget</TabsTrigger>
                </TabsList>
                
                <TabsContent value="shorten" className="space-y-4">
                  <div className="flex justify-center py-6">
                    <Button variant="outline" className="text-purple-600 border-purple-300">
                      Generate Shortened URL
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="onetime" className="space-y-4">
                  <div className="flex justify-center py-6">
                    <Button variant="outline" className="text-purple-600 border-purple-300">
                      Generate One Time Link
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="embed" className="space-y-4">
                  <div className="flex justify-center py-6">
                    <Button variant="outline" className="text-purple-600 border-purple-300">
                      Generate Embed Code
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
