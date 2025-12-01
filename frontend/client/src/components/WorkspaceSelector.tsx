import { useState } from 'react';
import { ChevronDown, Search, Plus, Check, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface WorkspaceSelectorProps {
  sidebarOpen: boolean;
}

export default function WorkspaceSelector({ sidebarOpen }: WorkspaceSelectorProps) {
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleSelectWorkspace = (workspace: any) => {
    setSelectedWorkspace(workspace);
    setIsOpen(false);
    setSearchQuery('');
    // Navigate to workspace view
    setLocation(`/dashboard/workspace/${workspace.id}`);
  };

  const handleMySpace = () => {
    setSelectedWorkspace(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleNewWorkspace = () => {
    setIsOpen(false);
    setLocation('/dashboard/admin-center/workspaces');
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
            {/* My Space Option */}
            <button
              onClick={handleMySpace}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors mb-4"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={24} className="text-pink-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">My Space</h3>
                <p className="text-sm text-gray-500">Unified view of all Workspaces</p>
              </div>
              {!selectedWorkspace && (
                <Check size={20} className="text-purple-600 flex-shrink-0 mt-1" />
              )}
            </button>

            {/* Search Header */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                SWITCH WORKSPACES
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search workspaces"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Workspace List */}
            <div className="space-y-1 max-h-64 overflow-y-auto mb-3">
              {filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <div className={`w-10 h-10 ${workspace.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-sm font-bold text-gray-900">{workspace.initials}</span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{workspace.name}</h4>
                    <p className="text-sm text-gray-500">
                      {workspace.status === 'Active' ? '1 Tutoring' : '0 Tutoring'}
                    </p>
                  </div>
                  {selectedWorkspace?.id === workspace.id && (
                    <Check size={20} className="text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredWorkspaces.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No workspaces found
                </div>
              )}
            </div>

            {/* New Workspace Button */}
            <button
              onClick={handleNewWorkspace}
              className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New workspace
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
