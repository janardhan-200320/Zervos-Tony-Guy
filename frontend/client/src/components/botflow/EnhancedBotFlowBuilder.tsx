import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Play,
  Save,
  Undo,
  Redo,
  Download,
  Upload,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Check,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { EnhancedNodeCard } from './EnhancedNodeCard';
import { EnhancedConnectionLine } from './EnhancedConnectionLine';
import { EnhancedNodePalette } from './EnhancedNodePalette';
import { EnhancedConfigPanel } from './EnhancedConfigPanel';
import { LeftSidebarPanels } from './LeftSidebarPanels';
import { MiniMap } from './MiniMap';
import { FlowSimulator } from './FlowSimulator';
import { SaveFlowDialog } from './SaveFlowDialog';
import { FlowNode, Connection, BotFlowData, NODE_TYPES } from './NodeTypes';
import { FlowTrigger } from './TriggerManager';

interface EnhancedBotFlowBuilderProps {
  flowId?: string;
}

export const EnhancedBotFlowBuilder: React.FC<EnhancedBotFlowBuilderProps> = ({ flowId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [variables, setVariables] = useState<BotFlowData['variables']>([]);
  const [triggers, setTriggers] = useState<FlowTrigger[]>([]);
  const [flowMetadata, setFlowMetadata] = useState<{
    name?: string;
    description?: string;
    triggerType?: string;
    triggerValue?: string;
    id?: string;
  }>({});
  
  // Selection & Editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // Canvas Transform
  const [scale, setScale] = useState(0.8);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Connection Creation
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    outputIndex: number;
  } | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(
    null
  );
  const [reconnectingConnection, setReconnectingConnection] = useState<{
    connectionId: string;
    isFromEnd: boolean;
  } | null>(null);
  
  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // UI State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [leftPanelTab, setLeftPanelTab] = useState<'controls' | 'nodes'>('controls');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<Array<{ nodes: FlowNode[]; connections: Connection[] }>>(
    []
  );
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load existing flow data if flowId is provided
  const { data: existingFlow, isLoading: isLoadingFlow } = useQuery({
    queryKey: ['/api/bot/flows', flowId],
    queryFn: async () => {
      if (!flowId) return null;
      
      const response = await fetch(`/api/bot/flows/${flowId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch flow');
      }
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    },
    enabled: !!flowId,
  });

  // Load flow data into state when it's fetched
  useEffect(() => {
    if (existingFlow && flowId) {
      const flowData = existingFlow.flowData || {};
      
      // Load nodes and connections
      if (flowData.nodes && flowData.nodes.length > 0) {
        setNodes(flowData.nodes);
        setConnections(flowData.connections || []);
        pushToHistory(flowData.nodes, flowData.connections || []);
      }
      
      // Load metadata
      setFlowMetadata({
        id: flowId,
        name: existingFlow.name,
        description: existingFlow.description,
        triggerType: existingFlow.triggerType,
        triggerValue: existingFlow.triggerValue,
      });
      
      // Load variables and triggers
      if (flowData.variables) setVariables(flowData.variables);
      if (flowData.triggers) setTriggers(flowData.triggers);
      
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Flow Loaded',
        description: `\"${existingFlow.name}\" is ready to edit`,
      });
    }
  }, [existingFlow, flowId]);

  // Create/Update flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: {
      name: string;
      description: string;
      triggerType: string;
      triggerValue: string;
    }) => {
      const payload = {
        ...flowData,
        isActive: 'true',
        flowData: {
          nodes,
          connections,
          variables,
          triggers,
        },
      };

      const url = flowMetadata.id ? `/api/bot/flows/${flowMetadata.id}` : '/api/bot/flows';
      const method = flowMetadata.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        let error: any = { details: text || 'Unknown error' };
        try {
          error = JSON.parse(text);
        } catch {}
        throw new Error(error.details || error.error || `HTTP ${response.status}`);
      }

      const text = await response.text();
      if (!text) throw new Error('Empty response from server');
      return JSON.parse(text);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      setFlowMetadata({ ...flowMetadata, id: data.id });
      setHasUnsavedChanges(false);
      
      toast({
        title: '✅ Flow Saved Successfully!',
        description: `"${data.name}" is now live and ready to use.`,
      });

      // Save to localStorage draft
      saveDraft(data.name || 'Untitled Flow');

      // Navigate back to dashboard after a brief delay
      setTimeout(() => {
        setLocation('/dashboard/bot-flows');
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save flow',
        variant: 'destructive',
      });
    },
  });

  // Draft saving to localStorage
  const saveDraft = (flowName: string) => {
    const draft = {
      flowName,
      nodes,
      connections,
      variables,
      triggers,
      metadata: flowMetadata,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('botflow_draft', JSON.stringify(draft));
  };

  const loadDraft = () => {
    const draftStr = localStorage.getItem('botflow_draft');
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setNodes(draft.nodes || []);
        setConnections(draft.connections || []);
        setVariables(draft.variables || []);
        setTriggers(draft.triggers || []);
        setFlowMetadata(draft.metadata || {});
        toast({
          title: 'Draft Loaded',
          description: `Restored your work from ${new Date(draft.savedAt).toLocaleString()}`,
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('botflow_draft');
  };

  // Handle save flow
  const handleSaveFlow = async (data: {
    name: string;
    description: string;
    triggerType: string;
    triggerValue: string;
  }) => {
    setIsSaving(true);
    try {
      await saveFlowMutation.mutateAsync(data);
      setShowSaveDialog(false);
      clearDraft();
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize with start node or load existing flow
  useEffect(() => {
    // Only create starter nodes if this is a new flow (no flowId) and no nodes exist yet
    if (nodes.length === 0 && !flowId && !isLoadingFlow) {
      const startNode: FlowNode = {
        id: 'start_node',
        type: 'START',
        position: { x: 500, y: 100 },
        data: { label: 'Start' },
      };
      const messageNode: FlowNode = {
        id: 'message_node_1',
        type: 'MESSAGE',
        position: { x: 500, y: 350 },
        data: { label: 'Welcome Message', message: 'Hello! Welcome to our bot.' },
      };
      const testConnection: Connection = {
        id: 'conn_start_to_msg',
        from: 'start_node',
        to: 'message_node_1',
        label: '',
      };
      setNodes([startNode, messageNode]);
      setConnections([testConnection]);
      pushToHistory([startNode, messageNode], [testConnection]);
    }
  }, [flowId, isLoadingFlow]);

  // Track changes for unsaved indicator
  useEffect(() => {
    if (nodes.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections, variables, triggers]);

  // History management
  const pushToHistory = (newNodes: FlowNode[], newConnections: Connection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(newNodes)),
      connections: JSON.parse(JSON.stringify(newConnections)),
    });
    if (newHistory.length > 50) newHistory.shift(); // Limit history
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Canvas operations
  const handleZoomIn = () => setScale((s) => Math.min(s * 1.2, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s / 1.2, 0.3));
  const handleFitToScreen = () => {
    if (nodes.length === 0) return;
    
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x + 280));
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + 200));
    
    const width = maxX - minX;
    const height = maxY - minY;
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 800;
    
    const scaleX = containerWidth / (width + 200);
    const scaleY = containerHeight / (height + 200);
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
    setPanOffset({
      x: (containerWidth - width * newScale) / 2 - minX * newScale,
      y: (containerHeight - height * newScale) / 2 - minY * newScale,
    });
  };

  // Node operations
  const handleAddNode = (nodeType: string) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: {
        x: 400 - panOffset.x / scale,
        y: 300 - panOffset.y / scale,
      },
      data: {},
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
    setEditingNodeId(newNode.id);
    
    toast({
      title: 'Node Added',
      description: `${NODE_TYPES[nodeType].label} added to canvas`,
    });
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    const newNodes = nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n));
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
  };

  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    
    setDraggingNodeId(nodeId);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleNodeDrag = (e: MouseEvent) => {
    if (!draggingNodeId || !dragStart) return;
    
    const dx = (e.clientX - dragStart.x) / scale;
    const dy = (e.clientY - dragStart.y) / scale;
    
    setDragOffset({ x: dx, y: dy });
  };

  const handleNodeDragEnd = () => {
    if (!draggingNodeId || !dragStart) return;
    
    const node = nodes.find((n) => n.id === draggingNodeId);
    if (!node) return;
    
    const newNodes = nodes.map((n) => {
      if (n.id === draggingNodeId) {
        return {
          ...n,
          position: {
            x: n.position.x + dragOffset.x,
            y: n.position.y + dragOffset.y,
          },
        };
      }
      return n;
    });
    
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
    setDraggingNodeId(null);
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDeleteNode = (nodeId: string) => {
    const newNodes = nodes.filter((n) => n.id !== nodeId);
    const newConnections = connections.filter(
      (c) => c.from !== nodeId && c.to !== nodeId
    );
    setNodes(newNodes);
    setConnections(newConnections);
    pushToHistory(newNodes, newConnections);
    setSelectedNodeId(null);
    
    toast({
      title: 'Node Deleted',
      description: 'Node and its connections have been removed',
    });
  };

  // Connection operations
  const handleConnectionStart = (nodeId: string, outputIndex: number = 0) => {
    setConnectingFrom({ nodeId, outputIndex });
    setConnectionPreview(null);
  };

  const handleConnectionEnd = (toNodeId: string) => {
    if (connectingFrom && connectingFrom.nodeId !== toNodeId) {
      handleAddConnection(connectingFrom.nodeId, toNodeId);
    }
    setConnectingFrom(null);
    setConnectionPreview(null);
  };

  const handleReconnectConnection = (connectionId: string, isFromEnd: boolean) => {
    setReconnectingConnection({ connectionId, isFromEnd });
  };

  const handleReconnectEnd = (toNodeId: string) => {
    if (reconnectingConnection) {
      const connection = connections.find(c => c.id === reconnectingConnection.connectionId);
      if (connection) {
        const newConnections = connections.map(c => {
          if (c.id === reconnectingConnection.connectionId) {
            return {
              ...c,
              [reconnectingConnection.isFromEnd ? 'from' : 'to']: toNodeId
            };
          }
          return c;
        });
        setConnections(newConnections);
        pushToHistory(nodes, newConnections);
      }
    }
    setReconnectingConnection(null);
  };

  const handleAddConnection = (from: string, to: string) => {
    // Prevent duplicate connections
    if (connections.some((c) => c.from === from && c.to === to)) return;
    
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from,
      to,
      label: '',
    };
    
    const newConnections = [...connections, newConnection];
    setConnections(newConnections);
    pushToHistory(nodes, newConnections);
  };

  const handleDeleteConnection = (connectionId: string) => {
    const newConnections = connections.filter((c) => c.id !== connectionId);
    setConnections(newConnections);
    pushToHistory(nodes, newConnections);
  };

  // Trigger operations
  const handleAddTrigger = () => {
    const newTrigger: FlowTrigger = {
      id: `trigger_${Date.now()}`,
      type: 'keyword',
      value: 'New Trigger',
      description: 'Enter trigger keywords',
      enabled: true,
      priority: 5,
    };
    setTriggers([...triggers, newTrigger]);
    toast({ title: 'Trigger Added', description: 'Configure your new trigger' });
  };

  const handleEditTrigger = (trigger: FlowTrigger) => {
    toast({ title: 'Edit Trigger', description: `Editing ${trigger.value}` });
  };

  const handleDeleteTrigger = (triggerId: string) => {
    setTriggers(triggers.filter((t) => t.id !== triggerId));
    toast({ title: 'Trigger Deleted' });
  };

  // Variable operations
  const handleAddVariable = () => {
    const newVariable = {
      name: `variable_${Date.now()}`,
      type: 'text' as const,
      scope: 'session' as const,
      defaultValue: '',
      description: 'New variable',
    };
    setVariables([...variables, newVariable]);
    toast({ title: 'Variable Added', description: 'Configure your new variable' });
  };

  const handleEditVariable = (variable: any) => {
    toast({ title: 'Edit Variable', description: `Editing ${variable.name}` });
  };

  const handleDeleteVariable = (variableName: string) => {
    setVariables(variables.filter((v) => v.name !== variableName));
    toast({ title: 'Variable Deleted' });
  };

  // Auto-save draft to localStorage
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (nodes.length > 0 && hasUnsavedChanges) {
        saveDraft(flowMetadata.name || 'Untitled Flow');
        console.log('Auto-saved draft to localStorage');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [nodes, connections, variables, triggers, flowMetadata, hasUnsavedChanges]);

  // Mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Handle node dragging
      if (draggingNodeId) {
        handleNodeDrag(e);
      }
      
      // Handle connection preview
      if (connectingFrom || reconnectingConnection) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setConnectionPreview({
            x: (e.clientX - rect.left - panOffset.x) / scale,
            y: (e.clientY - rect.top - panOffset.y) / scale
          });
        }
      }
    };

    const handleMouseUp = () => {
      // End node dragging
      if (draggingNodeId) {
        handleNodeDragEnd();
      }
      
      // End connection creation
      if (connectingFrom) {
        setConnectingFrom(null);
        setConnectionPreview(null);
      }
      
      // End reconnection
      if (reconnectingConnection) {
        setReconnectingConnection(null);
        setConnectionPreview(null);
      }
    };

    if (draggingNodeId || connectingFrom || reconnectingConnection) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, dragStart, dragOffset, nodes, connections, connectingFrom, reconnectingConnection, panOffset, scale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          // handleSave();
        }
      }
      
      if (e.key === 'Delete' && selectedNodeId) {
        handleDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, historyIndex]);

  // Show loading state when fetching flow
  if (isLoadingFlow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4"
          >
            <svg
              className="w-full h-full text-purple-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="6" r="2" />
              <circle cx="12" cy="18" r="2" />
              <circle cx="19" cy="12" r="2" />
              <path d="M7 12h3" />
              <path d="M12 8v2" />
              <path d="M12 14v2" />
              <path d="M14 12h3" />
            </svg>
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Flow...</h3>
          <p className="text-gray-600">Preparing your bot flow for editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    setLocation('/dashboard/bot-flows');
                  }
                } else {
                  setLocation('/dashboard/bot-flows');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {flowMetadata.name || 'Untitled Flow'}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Unsaved Changes
                  </Badge>
                )}
              </h1>
              {flowMetadata.description && (
                <p className="text-xs text-gray-500 mt-0.5">{flowMetadata.description}</p>
              )}
            </div>
            
            {/* Canvas Controls */}
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <button
                onClick={() => setShowLeftPanel(!showLeftPanel)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showLeftPanel ? 'Hide Left Panel' : 'Show Left Panel'}
              >
                {showLeftPanel ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeftOpen className="w-4 h-4" />
                )}
              </button>

              <div className="w-px h-6 bg-gray-200" />

              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <div className="px-3 py-1 bg-gray-100 rounded text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </div>
              
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={handleFitToScreen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fit to Screen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Connect Nodes Button */}
              {nodes.length >= 2 && (
                <button
                  onClick={() => {
                    // Auto-connect nodes sequentially for testing
                    const newConnections: Connection[] = [];
                    for (let i = 0; i < nodes.length - 1; i++) {
                      const connId = `conn_${nodes[i].id}_to_${nodes[i + 1].id}`;
                      if (!connections.find(c => c.id === connId)) {
                        newConnections.push({
                          id: connId,
                          from: nodes[i].id,
                          to: nodes[i + 1].id,
                          label: '',
                        });
                      }
                    }
                    if (newConnections.length > 0) {
                      const allConnections = [...connections, ...newConnections];
                      setConnections(allConnections);
                      pushToHistory(nodes, allConnections);
                      toast({
                        title: 'Connections Added',
                        description: `Created ${newConnections.length} connection(s)`,
                      });
                    }
                  }}
                  className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  title="Auto-connect nodes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect
                </button>
              )}

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-lg transition-colors ${
                  showGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
                title="Toggle Grid"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>

            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            <button
              onClick={() => setShowSimulator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
            >
              <Play className="w-4 h-4" />
              Test Flow
            </button>

            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={nodes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed relative"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {flowMetadata.id ? 'Update Flow' : 'Save Flow'}
                  {hasUnsavedChanges && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full border-2 border-white"></span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {showLeftPanel && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 30 }}
              className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col"
            >
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button 
                    onClick={() => setLeftPanelTab('controls')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      leftPanelTab === 'controls'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Flow Controls
                  </button>
                  <button 
                    onClick={() => setLeftPanelTab('nodes')}
                    className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      leftPanelTab === 'nodes'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Nodes
                  </button>
                </div>
              </div>

              {/* Panel Content - Switchable */}
              <div className="flex-1 overflow-hidden">
                {leftPanelTab === 'controls' ? (
                  <LeftSidebarPanels
                    triggers={triggers}
                    variables={variables}
                    onAddTrigger={handleAddTrigger}
                    onEditTrigger={handleEditTrigger}
                    onDeleteTrigger={handleDeleteTrigger}
                    onAddVariable={handleAddVariable}
                    onEditVariable={handleEditVariable}
                    onDeleteVariable={handleDeleteVariable}
                  />
                ) : (
                  <EnhancedNodePalette onAddNode={handleAddNode} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas Area */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {/* Grid Background */}
          {showGrid && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(circle, #cbd5e1 1px, transparent 1px),
                  radial-gradient(circle, #cbd5e1 1px, transparent 1px)
                `,
                backgroundSize: `${40 * scale}px ${40 * scale}px`,
                backgroundPosition: `${panOffset.x}px ${panOffset.y}px, ${panOffset.x + 20 * scale}px ${panOffset.y + 20 * scale}px`,
                opacity: 0.4,
              }}
            />
          )}

          {/* SVG Canvas for Connections */}
          <svg
            ref={canvasRef}
            className="absolute inset-0"
            width="100%"
            height="100%"
            style={{
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <g transform={`translate(${panOffset.x},${panOffset.y}) scale(${scale})`}>
              {/* Existing connections */}
              {connections.map((connection) => {
                const fromNode = nodes.find((n) => n.id === connection.from);
                const toNode = nodes.find((n) => n.id === connection.to);
                
                if (!fromNode || !toNode) return null;

                // Apply drag offset to node positions in real-time
                const fromPos = draggingNodeId === fromNode.id
                  ? { x: fromNode.position.x + dragOffset.x, y: fromNode.position.y + dragOffset.y }
                  : fromNode.position;
                  
                const toPos = draggingNodeId === toNode.id
                  ? { x: toNode.position.x + dragOffset.x, y: toNode.position.y + dragOffset.y }
                  : toNode.position;

                return (
                  <EnhancedConnectionLine
                    key={connection.id}
                    connection={connection}
                    fromNode={fromPos}
                    toNode={toPos}
                    isSelected={selectedConnectionId === connection.id}
                    onClick={() => setSelectedConnectionId(connection.id)}
                    onDelete={() => handleDeleteConnection(connection.id)}
                    onStartDragging={(isFromEnd) => handleReconnectConnection(connection.id, isFromEnd)}
                    isDraggingEnd={
                      reconnectingConnection?.connectionId === connection.id
                        ? { from: reconnectingConnection.isFromEnd, to: !reconnectingConnection.isFromEnd }
                        : undefined
                    }
                    connectionType="default"
                  />
                );
              })}
              
              {/* Preview line when creating connection */}
              {connectingFrom && connectionPreview && (() => {
                const fromNode = nodes.find(n => n.id === connectingFrom.nodeId);
                if (!fromNode) return null;
                
                const fromPos = fromNode.position;
                const start = { x: fromPos.x + 150, y: fromPos.y + 100 };
                const end = connectionPreview;
                
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const controlOffset = distance * 0.3;
                
                const path = `M ${start.x},${start.y} C ${start.x},${start.y + controlOffset} ${end.x},${end.y - controlOffset} ${end.x},${end.y}`;
                
                return (
                  <path
                    d={path}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                );
              })()}
              
              {/* Preview line when reconnecting */}
              {reconnectingConnection && connectionPreview && (() => {
                const connection = connections.find(c => c.id === reconnectingConnection.connectionId);
                if (!connection) return null;
                
                const fromNode = nodes.find(n => n.id === connection.from);
                const toNode = nodes.find(n => n.id === connection.to);
                if (!fromNode || !toNode) return null;
                
                const start = reconnectingConnection.isFromEnd
                  ? connectionPreview
                  : { x: fromNode.position.x + 150, y: fromNode.position.y + 100 };
                const end = reconnectingConnection.isFromEnd
                  ? { x: toNode.position.x + 150, y: toNode.position.y }
                  : connectionPreview;
                
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const controlOffset = distance * 0.3;
                
                const path = `M ${start.x},${start.y} C ${start.x},${start.y + controlOffset} ${end.x},${end.y - controlOffset} ${end.x},${end.y}`;
                
                return (
                  <path
                    d={path}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                );
              })()}
            </g>
          </svg>

          {/* Nodes Layer */}
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              zIndex: 2,
            }}
          >
            {nodes.map((node) => {
              // Apply drag offset for real-time visual feedback
              const nodeWithDragOffset = draggingNodeId === node.id
                ? {
                    ...node,
                    position: {
                      x: node.position.x + dragOffset.x,
                      y: node.position.y + dragOffset.y,
                    },
                  }
                : node;

              return (
                <EnhancedNodeCard
                  key={node.id}
                  node={nodeWithDragOffset}
                  isSelected={selectedNodeId === node.id}
                  isDragging={draggingNodeId === node.id}
                  isConnecting={connectingFrom !== null || reconnectingConnection !== null}
                  canConnect={
                    !!(connectingFrom && connectingFrom.nodeId !== node.id) ||
                    !!(reconnectingConnection && (() => {
                      const conn = connections.find(c => c.id === reconnectingConnection.connectionId);
                      return conn && (
                        (reconnectingConnection.isFromEnd && conn.to !== node.id) ||
                        (!reconnectingConnection.isFromEnd && conn.from !== node.id)
                      );
                    })())
                  }
                  onClick={() => setSelectedNodeId(node.id)}
                  onEdit={() => setEditingNodeId(node.id)}
                  onDelete={() => handleDeleteNode(node.id)}
                  onDragStart={(e) => handleNodeDragStart(node.id, e)}
                  onConnectionStart={(outputIndex) => handleConnectionStart(node.id, outputIndex || 0)}
                  onConnectionEnd={() => {
                    if (connectingFrom) {
                      handleConnectionEnd(node.id);
                    } else if (reconnectingConnection) {
                      handleReconnectEnd(node.id);
                    }
                  }}
                  connectionHandles={{
                    inputs: connections.filter((c) => c.to === node.id).length,
                    outputs: connections.filter((c) => c.from === node.id).length,
                  }}
                />
              );
            })}
          </div>

          {/* Mini Map */}
          {showMinimap && (
            <div className="absolute bottom-6 right-6">
              <MiniMap 
                nodes={nodes} 
                connections={connections}
                viewport={{ x: panOffset.x, y: panOffset.y, scale }}
                canvasSize={{ width: 2000, height: 2000 }}
              />
            </div>
          )}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Create Your First Bot Flow
                </h3>
                <p className="text-gray-500 mb-6">
                  Add nodes from the palette to get started
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Configuration Panel */}
        <AnimatePresence>
          {editingNodeId && (
            <EnhancedConfigPanel
              node={nodes.find((n) => n.id === editingNodeId)!}
              onClose={() => setEditingNodeId(null)}
              onUpdate={(updates) => handleUpdateNode(editingNodeId, updates)}
              variables={variables}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Flow Simulator Modal */}
      <AnimatePresence>
        {showSimulator && (
          <FlowSimulator nodes={nodes} connections={connections} onClose={() => setShowSimulator(false)} />
        )}
      </AnimatePresence>

      {/* Save Flow Dialog */}
      <SaveFlowDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveFlow}
        isSaving={isSaving}
        existingFlow={flowMetadata.name ? {
          name: flowMetadata.name,
          description: flowMetadata.description || '',
          triggerType: flowMetadata.triggerType || 'keyword',
          triggerValue: flowMetadata.triggerValue || '',
        } : undefined}
      />
    </div>
  );
};
