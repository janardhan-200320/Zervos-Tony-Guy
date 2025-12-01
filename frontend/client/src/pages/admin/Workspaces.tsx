import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Folder, MoreVertical, Share2, Edit, Ban, Trash2, Copy, Pencil, ChevronLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Workspace {
  id: string;
  name: string;
  initials: string;
  color: string;
  email: string;
  description: string;
  status: 'Active' | 'Inactive';
  bookingLink: string;
  prefix: string;
  maxDigits: number;
}

const getRandomColor = () => {
  const colors = [
    'bg-cyan-200',
    'bg-pink-200',
    'bg-purple-200',
    'bg-blue-200',
    'bg-green-200',
    'bg-yellow-200',
    'bg-orange-200',
    'bg-red-200',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getInitials = (name: string) => {
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

export default function Workspaces() {
  const [, setLocation] = useLocation();
  const { workspaces, setWorkspaces, selectedWorkspace: contextSelectedWorkspace } = useWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [detailWorkspace, setDetailWorkspace] = useState<Workspace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    prefix: '',
    maxDigits: 5,
  });

  // When a workspace is selected from dropdown, show its details
  useEffect(() => {
    if (contextSelectedWorkspace) {
      setDetailWorkspace(contextSelectedWorkspace);
      setEditForm({
        name: contextSelectedWorkspace.name,
        email: contextSelectedWorkspace.email || '',
        description: contextSelectedWorkspace.description || '',
        status: contextSelectedWorkspace.status,
        prefix: contextSelectedWorkspace.prefix || '',
        maxDigits: contextSelectedWorkspace.maxDigits || 5,
      });
      setViewMode('detail');
      setIsEditing(false);
    } else {
      setViewMode('list');
      setDetailWorkspace(null);
    }
  }, [contextSelectedWorkspace]);

  const handleAddWorkspace = () => {
    if (workspaceName.trim()) {
      const newWorkspace: Workspace = {
        id: Date.now().toString(),
        name: workspaceName.trim(),
        initials: getInitials(workspaceName.trim()),
        color: getRandomColor(),
        email: '',
        description: '',
        status: 'Active',
        bookingLink: `https://hmvsolutions.zohobookings.in/#/${Date.now()}`,
        prefix: getInitials(workspaceName.trim()),
        maxDigits: 5,
      };
      setWorkspaces([...workspaces, newWorkspace]);
      setWorkspaceName('');
      setIsDialogOpen(false);
    }
  };

  const handleCancel = () => {
    setWorkspaceName('');
    setIsDialogOpen(false);
  };

  const handleShare = (workspace: Workspace) => {
    setDetailWorkspace(workspace);
    setIsShareDialogOpen(true);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    setDetailWorkspace(workspace);
    setEditForm({
      name: workspace.name,
      email: workspace.email || '',
      description: workspace.description || '',
      status: workspace.status,
      prefix: workspace.prefix || '',
      maxDigits: workspace.maxDigits || 5,
    });
    setViewMode('detail');
    setIsEditing(false);
  };

  const handleBack = () => {
    setViewMode('list');
    setDetailWorkspace(null);
    setIsEditing(false);
  };

  const handleEdit = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    handleWorkspaceClick(workspace);
    setIsEditing(true);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (detailWorkspace) {
      setEditForm({
        name: detailWorkspace.name,
        email: detailWorkspace.email || '',
        description: detailWorkspace.description || '',
        status: detailWorkspace.status,
        prefix: detailWorkspace.prefix || '',
        maxDigits: detailWorkspace.maxDigits || 5,
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (detailWorkspace) {
      const updatedWorkspaces = workspaces.map(w => {
        if (w.id === detailWorkspace.id) {
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
      
      const updated = updatedWorkspaces.find(w => w.id === detailWorkspace.id);
      if (updated) {
        setDetailWorkspace(updated);
      }
    }
    setIsEditing(false);
    setShowSaveAlert(true);
    setTimeout(() => setShowSaveAlert(false), 3000);
  };

  const handleDeleteCurrent = () => {
    if (detailWorkspace && window.confirm('Are you sure you want to delete this workspace?')) {
      setWorkspaces(workspaces.filter(w => w.id !== detailWorkspace.id));
      setViewMode('list');
      setDetailWorkspace(null);
    }
  };

  const handleMarkInactive = (workspace: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedWorkspaces = workspaces.map(w => 
      w.id === workspace.id ? { ...w, status: w.status === 'Active' ? 'Inactive' as const : 'Active' as const } : w
    );
    setWorkspaces(updatedWorkspaces);
  };

  const handleDelete = (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workspace?')) {
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    }
  };

  const handleCopyLink = () => {
    if (detailWorkspace) {
      navigator.clipboard.writeText(detailWorkspace.bookingLink);
      // You can add a toast notification here
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Save Alert */}
      {showSaveAlert && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Check size={20} />
          <span>Changes saved successfully!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewMode === 'detail' && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {viewMode === 'detail' && detailWorkspace ? detailWorkspace.name : 'Workspaces'}
            </h1>
            {viewMode === 'list' && <Badge variant="outline" className="rounded-full">{workspaces.length}</Badge>}
          </div>
          <div className="flex items-center gap-3">
            {viewMode === 'list' ? (
              <>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    className="pl-10" 
                    placeholder="Search Workspace" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus size={16} className="mr-2" /> New Workspace
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  className="text-purple-600 border-purple-200"
                >
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                <button
                  onClick={handleDeleteCurrent}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Workspace Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-2xl">New Workspace</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-sm font-normal">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="workspace-name"
                placeholder="Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full h-12"
              />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 flex flex-row justify-end gap-3 sm:space-x-0">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="px-8 h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWorkspace}
              disabled={!workspaceName.trim()}
              className="px-8 h-11 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {viewMode === 'list' ? (
          <div className="p-8">
            {workspaces.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="mx-auto w-40 h-40 bg-purple-50 rounded-full mb-6 flex items-center justify-center">
                  <Folder size={48} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces added.</h3>
                <p className="text-gray-600 mb-6">
                  Add workspaces to organize your team and services.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus size={16} className="mr-2" /> New Workspace
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => handleWorkspaceClick(workspace)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 ${workspace.color} rounded-2xl flex items-center justify-center`}>
                          <span className="text-xl font-bold text-gray-900">{workspace.initials}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical size={20} className="text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={(e) => handleEdit(workspace, e)} className="cursor-pointer">
                            <Edit size={16} className="mr-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleMarkInactive(workspace, e)} className="cursor-pointer">
                            <Ban size={16} className="mr-3" />
                            {workspace.status === 'Active' ? 'Mark As Inactive' : 'Mark As Active'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDelete(workspace.id, e)} 
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={16} className="mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(workspace);
                        }}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Share2 size={16} className="mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : detailWorkspace && (
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
                      <div className={`w-20 h-20 ${detailWorkspace.color} rounded-2xl flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-gray-900">{detailWorkspace.initials}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900">{editForm.name || detailWorkspace.name}</h2>
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
                        <p className="text-base text-gray-900">{detailWorkspace.name}</p>
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
                        <p className="text-base text-gray-900">{detailWorkspace.email || '-'}</p>
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
                        <p className="text-base text-gray-900">{detailWorkspace.description || '-'}</p>
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
                              detailWorkspace.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {detailWorkspace.status}
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
                        <p className="text-base text-gray-900">{detailWorkspace.prefix || '-'}</p>
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
                        <p className="text-base text-gray-900">{detailWorkspace.maxDigits || 5}</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Share Booking Link Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Share Booking Link</DialogTitle>
            </DialogHeader>
          </div>
          
          {detailWorkspace && (
            <div className="px-6 pb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${detailWorkspace.color} rounded-2xl flex items-center justify-center`}>
                  <span className="text-lg font-bold text-gray-900">{detailWorkspace.initials}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">{detailWorkspace.name}</h3>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-purple-700 font-medium truncate">
                    {detailWorkspace.bookingLink}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
