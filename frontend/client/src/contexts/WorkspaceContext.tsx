import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const buildInitials = (name: string, fallback = 'MW') => {
  const trimmed = (name || '').trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return (parts[0].slice(0, 2) || fallback).toUpperCase();
  }

  const letters = `${parts[0][0] || ''}${parts[1][0] || ''}`.trim();
  if (letters.length > 0) {
    return letters.slice(0, 2).toUpperCase();
  }

  return (trimmed.slice(0, 2) || fallback).toUpperCase();
};

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
  userCustomized?: boolean;
  // Branch-specific fields
  type?: 'main' | 'branch';
  branchCode?: string;
  branchAddress?: string;
  branchPhone?: string;
  branchManager?: string;
  parentBusinessId?: string;
}

interface WorkspaceContextType {
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  setWorkspaces: (workspaces: Workspace[]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkspace, setSelectedWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspacesState] = useState<Workspace[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Load company info for default workspace
    let company: any = null;
    try {
      const companyData = localStorage.getItem('zervos_company');
      company = companyData ? JSON.parse(companyData) : null;
    } catch {
      company = null;
    }
    
    // Load workspaces from localStorage
    let parsed: Workspace[] = [];
    try {
      const workspacesData = localStorage.getItem('workspaces');
      if (workspacesData) {
        parsed = JSON.parse(workspacesData).map((workspace: Workspace) => ({
          ...workspace,
          userCustomized: workspace.userCustomized ?? false,
        }));
      }
    } catch {
      parsed = [];
    }
    
    // If no workspaces exist, create a default one
    if (parsed.length === 0) {
      const defaultWorkspace: Workspace = {
        id: Date.now().toString(),
        name: company?.name || 'My Workspace',
        initials: buildInitials(company?.name || 'My Workspace'),
        color: 'bg-purple-500',
        email: company?.email || '',
        description: company?.industry || 'Default workspace',
        status: 'Active',
        bookingLink: `${window.location.origin}/book/default`,
        prefix: 'BK',
        maxDigits: 4,
        userCustomized: false,
      };
      
      parsed = [defaultWorkspace];
      try { localStorage.setItem('workspaces', JSON.stringify(parsed)); } catch {}
    } else if (typeof company?.name === 'string' && parsed.length === 1) {
      // Update the first workspace name if company name is available
      // This ensures workspace name stays in sync with business name
      const firstWorkspace = parsed[0];
      const desiredInitials = buildInitials(company.name, firstWorkspace.initials || 'MW');
      if (!firstWorkspace.userCustomized && (firstWorkspace.name !== company.name || firstWorkspace.initials !== desiredInitials)) {
        firstWorkspace.name = company.name;
        firstWorkspace.initials = desiredInitials;
        firstWorkspace.description = company.industry || firstWorkspace.description;
        firstWorkspace.userCustomized = false;
        try { localStorage.setItem('workspaces', JSON.stringify(parsed)); } catch {}
      }
    }
    
    setWorkspacesState(parsed);
    
    // Load selected workspace or auto-select the first one
    const selectedId = (() => { try { return localStorage.getItem('selectedWorkspaceId'); } catch { return null; } })();
    let selected = null;
    
    if (selectedId) {
      selected = parsed.find((w: Workspace) => w.id === selectedId) || null;
    }
    
    // If no workspace selected, auto-select the first one
    if (!selected && parsed.length > 0) {
      selected = parsed[0];
      try { localStorage.setItem('selectedWorkspaceId', selected.id); } catch {}
    }
    
    if (selected) {
      setSelectedWorkspaceState(selected);
    }
  }, [refreshKey]);

  // Listen for company changes to update workspace name
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zervos_company') {
        setRefreshKey(prev => prev + 1);
      }
    };

    const handleLocalChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChanged', handleLocalChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChanged', handleLocalChange);
    };
  }, []);

  const setSelectedWorkspace = (workspace: Workspace | null) => {
    setSelectedWorkspaceState(workspace);
    if (workspace) {
      try { localStorage.setItem('selectedWorkspaceId', workspace.id); } catch {}
    } else {
      try { localStorage.removeItem('selectedWorkspaceId'); } catch {}
    }
  };

  const setWorkspaces = (newWorkspaces: Workspace[]) => {
    const normalized = newWorkspaces.map(workspace => ({
      ...workspace,
      userCustomized: workspace.userCustomized ?? false,
    }));

    setWorkspacesState(normalized);
    try { localStorage.setItem('workspaces', JSON.stringify(normalized)); } catch {}
    
    // Update selected workspace if it was modified
    if (selectedWorkspace) {
      const updated = normalized.find(w => w.id === selectedWorkspace.id);
      if (updated) {
        setSelectedWorkspaceState(updated);
      } else {
        setSelectedWorkspaceState(null);
        try { localStorage.removeItem('selectedWorkspaceId'); } catch {}
      }
    }
    
    // Notify other components about workspace changes
    window.dispatchEvent(new Event('localStorageChanged'));
  };

  return (
    <WorkspaceContext.Provider value={{ selectedWorkspace, setSelectedWorkspace, workspaces, setWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
