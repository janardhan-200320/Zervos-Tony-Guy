import { useState } from 'react';
import { ChevronDown, Search, Plus, Check, Calendar, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import BranchLoginDialog from './BranchLoginDialog';

interface WorkspaceSelectorProps {
  sidebarOpen: boolean;
}

export default function WorkspaceSelector({ sidebarOpen }: WorkspaceSelectorProps) {
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<any>(null);

  const checkBranchAccess = (branchCode: string): boolean => {
    // Check if user has already logged into this branch in this session
    const accessToken = sessionStorage.getItem(`branch_access_${branchCode}`);
    if (accessToken) {
      try {
        const token = JSON.parse(accessToken);
        // Token is valid for current session
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleSelectWorkspace = (workspace: any) => {
    // If it's the main branch, allow direct access
    if (workspace.type === 'main') {
      setSelectedWorkspace(workspace);
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    // If switching to a different branch, check authentication
    if (workspace.id !== selectedWorkspace?.id && workspace.branchCode) {
      const hasAccess = checkBranchAccess(workspace.branchCode);
      
      if (!hasAccess) {
        // Show login dialog
        setPendingBranch(workspace);
        setShowLoginDialog(true);
        setIsOpen(false);
        return;
      }
    }

    // Access granted
    setSelectedWorkspace(workspace);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleLoginSuccess = () => {
    if (pendingBranch) {
      setSelectedWorkspace(pendingBranch);
      setPendingBranch(null);
    }
    setShowLoginDialog(false);
  };

  const handleLoginClose = () => {
    setPendingBranch(null);
    setShowLoginDialog(false);
  };

  const handleMySpace = () => {
    // Select the main branch
    const mainBranch = workspaces.find(w => w.type === 'main');
    if (mainBranch) {
      setSelectedWorkspace(mainBranch);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleNewWorkspace = () => {
    setIsOpen(false);
    setLocation('/dashboard/admin/branches');
  };

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = selectedWorkspace ? selectedWorkspace.name : 'My Space';
  const displayInitials = selectedWorkspace?.initials || 'MS';
  const displayColor = selectedWorkspace?.color || 'bg-purple-200';

  return (
    <div className="px-3 py-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-slate-700 bg-white/10">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${displayColor} flex-shrink-0`}>
                <span className="text-sm font-bold text-slate-900">{displayInitials}</span>
              </div>
              {sidebarOpen && (
                <span className="font-medium text-white truncate">{displayName}</span>
              )}
            </div>
            {sidebarOpen && <ChevronDown size={16} className="text-slate-300 flex-shrink-0" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-[360px] p-0" 
          align="start"
          side="right"
          sideOffset={10}
        >
          <div className="p-4">
            {/* Main Branch Option */}
            <button
              onClick={handleMySpace}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors mb-4"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={24} className="text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Main Branch</h3>
                <p className="text-sm text-gray-500">Primary business location</p>
              </div>
              {selectedWorkspace?.type === 'main' && (
                <Check size={20} className="text-purple-600 flex-shrink-0 mt-1" />
              )}
            </button>

            {/* Search Header */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                SWITCH BRANCHES
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Branch List */}
            <div className="space-y-1 max-h-64 overflow-y-auto mb-3">
              {filteredWorkspaces.filter(w => w.type === 'branch').map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${workspace.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-sm font-bold text-white">{workspace.initials}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{workspace.name}</h4>
                    <p className="text-sm text-gray-500">
                      {workspace.branchCode || 'Branch'}
                    </p>
                  </div>
                  {selectedWorkspace?.id === workspace.id && (
                    <Check size={20} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredWorkspaces.filter(w => w.type === 'branch').length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No branches found
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleNewWorkspace}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add New Branch
              </button>
              <button
                onClick={handleNewWorkspace}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                <Settings2 size={16} />
                Branch Management
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Branch Login Dialog */}
      <BranchLoginDialog
        isOpen={showLoginDialog}
        onClose={handleLoginClose}
        onSuccess={handleLoginSuccess}
        branchName={pendingBranch?.name || ''}
        branchCode={pendingBranch?.branchCode || ''}
      />
    </div>
  );
}
