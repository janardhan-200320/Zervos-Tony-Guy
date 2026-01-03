import React, { useState, useRef, useEffect } from 'react';
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
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { NodeCard } from './NodeCard';
import { ConnectionLine } from './ConnectionLine';
import { NodePalette } from './NodePalette';
import { NodeEditor } from './NodeEditor.tsx';
import { MiniMap } from './MiniMap.tsx';
import { FlowSimulator } from './FlowSimulator.tsx';
import { VariableManager } from './VariableManager';
import { TriggerManager, FlowTrigger } from './TriggerManager';
import { FlowNode, Connection, BotFlowData, NODE_TYPES, getNodeOutputs } from './NodeTypes';

interface VisualBotFlowBuilderProps {
  flowId?: string;
}

export const VisualBotFlowBuilder: React.FC<VisualBotFlowBuilderProps> = ({ flowId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [variables, setVariables] = useState<BotFlowData['variables']>([]);
  const [triggers, setTriggers] = useState<FlowTrigger[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  // Canvas transform
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Connection creation
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingFromHandle, setConnectingFromHandle] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  
  // UI state
  const [showMinimap, setShowMinimap] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  // Undo/Redo
  const [history, setHistory] = useState<Array<{ nodes: FlowNode[]; connections: Connection[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load flow data
  const { data: flowData, isLoading } = useQuery({
    queryKey: ['bot-flow', flowId],
    queryFn: async () => {
      if (!flowId) return null;
      const response = await fetch(`/api/bot/flows/${flowId}`);
      if (!response.ok) throw new Error('Failed to load flow');
      return response.json();
    },
    enabled: !!flowId,
  });

  // Initialize with start node if new flow
  useEffect(() => {
    if (nodes.length === 0 && !isLoading) {
      const startNode: FlowNode = {
        id: 'start_node',
        type: 'START',
        position: { x: 400, y: 50 },
        data: { label: 'Start' },
      };
      setNodes([startNode]);
      pushToHistory([startNode], []);
    }
  }, [nodes.length, isLoading]);

  // Load flow data
  useEffect(() => {
    if (flowData?.flowData) {
      setNodes(flowData.flowData.nodes || []);
      setConnections(flowData.flowData.connections || []);
      setVariables(flowData.flowData.variables || []);
      setTriggers(flowData.flowData.triggers || []);
    }
  }, [flowData]);

  // Save flow mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const flowDataToSave: BotFlowData = {
        nodes,
        connections,
        variables,
        triggers,
        version: (flowData?.version || 0) + 1,
        lastModified: new Date().toISOString(),
      };

      const url = flowId ? `/api/bot/flows/${flowId}` : '/api/bot/flows';
      const method = flowId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowData: flowDataToSave }),
      });

      if (!response.ok) throw new Error('Failed to save flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-flows'] });
    },
  });

  // History management
  const pushToHistory = (newNodes: FlowNode[], newConnections: Connection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, connections: newConnections });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setConnections(previousState.connections);
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

  // Node operations
  const addNode = (nodeType: string) => {
    const newNode: FlowNode = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: {
        x: (window.innerWidth / 2 - panOffset.x) / scale - 128,
        y: (window.innerHeight / 2 - panOffset.y) / scale - 100,
      },
      data: {},
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
    setEditingNodeId(newNode.id);
  };

  const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    const newNodes = nodes.map((node) =>
      node.id === nodeId ? { ...node, ...updates } : node
    );
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
  };

  const deleteNode = (nodeId: string) => {
    const newNodes = nodes.filter((node) => node.id !== nodeId);
    const newConnections = connections.filter(
      (conn) => conn.from !== nodeId && conn.to !== nodeId
    );
    setNodes(newNodes);
    setConnections(newConnections);
    pushToHistory(newNodes, newConnections);
  };

  const duplicateNode = (nodeId: string) => {
    const originalNode = nodes.find((n) => n.id === nodeId);
    if (!originalNode) return;

    const newNode: FlowNode = {
      ...JSON.parse(JSON.stringify(originalNode)),
      id: `node_${Date.now()}`,
      position: {
        x: originalNode.position.x + 50,
        y: originalNode.position.y + 50,
      },
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    pushToHistory(newNodes, connections);
  };

  // Connection operations
  const startConnection = (handleId: string) => {
    const [nodeId, handleType] = handleId.split(':');
    setConnectingFrom(nodeId);
    setConnectingFromHandle(handleType);
  };

  const completeConnection = (toNodeId: string) => {
    if (!connectingFrom || !connectingFromHandle) return;

    // Prevent self-connection
    if (connectingFrom === toNodeId) {
      setConnectingFrom(null);
      setConnectingFromHandle(null);
      return;
    }

    // Check if connection already exists
    const existingConnection = connections.find(
      (c) => c.from === connectingFrom && c.to === toNodeId && c.fromHandle === connectingFromHandle
    );

    if (existingConnection) {
      toast({
        title: 'Connection exists',
        description: 'This connection already exists',
        variant: 'destructive',
      });
      setConnectingFrom(null);
      setConnectingFromHandle(null);
      return;
    }

    // Get label for the connection from the node
    const fromNode = nodes.find((n) => n.id === connectingFrom);
    let label = '';
    let labelColor = '#3b82f6';

    if (fromNode) {
      const outputs = getNodeOutputs(fromNode);
      const output = outputs.find((o: { id: string; label: string; color: string }) => o.id === connectingFromHandle);
      if (output) {
        label = output.label;
        labelColor = output.color;
      }
    }

    // Create new connection
    const newConnection: Connection = {
      id: `conn_${Date.now()}`,
      from: connectingFrom,
      to: toNodeId,
      fromHandle: connectingFromHandle,
      label,
      labelColor,
      animated: true,
    };

    const newConnections = [...connections, newConnection];
    setConnections(newConnections);
    pushToHistory(nodes, newConnections);
    setConnectingFrom(null);
    setConnectingFromHandle(null);

    toast({
      title: 'Connection created',
      description: `Connected ${label || 'nodes'}`,
    });
  };

  const deleteConnection = (connectionId: string) => {
    const newConnections = connections.filter((conn) => conn.id !== connectionId);
    setConnections(newConnections);
    pushToHistory(nodes, newConnections);
  };

  // Zoom operations
  const zoomIn = () => setScale(Math.min(scale * 1.2, 3));
  const zoomOut = () => setScale(Math.max(scale * 0.8, 0.3));
  const resetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan operations
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
    if (connectingFrom) {
      setConnectionPreview({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
      setConnectingFromHandle(null);
      setConnectionPreview(null);
    }
  };

  // Auto-arrange nodes
  const autoArrange = () => {
    const arrangedNodes = [...nodes];
    const startNode = arrangedNodes.find((n) => n.type === 'START');
    if (!startNode) return;

    // Simple hierarchical layout
    const layers: Record<number, FlowNode[]> = {};
    const visited = new Set<string>();

    const assignLayer = (nodeId: string, layer: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = arrangedNodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (!layers[layer]) layers[layer] = [];
      layers[layer].push(node);

      const outgoingConnections = connections.filter((c) => c.from === nodeId);
      outgoingConnections.forEach((conn) => assignLayer(conn.to, layer + 1));
    };

    assignLayer(startNode.id, 0);

    // Position nodes
    Object.entries(layers).forEach(([layerStr, layerNodes]) => {
      const layer = parseInt(layerStr);
      const layerWidth = layerNodes.length * 350;
      const startX = (window.innerWidth - layerWidth) / 2;

      layerNodes.forEach((node, index) => {
        node.position = {
          x: startX + index * 350,
          y: 100 + layer * 250,
        };
      });
    });

    setNodes(arrangedNodes);
    pushToHistory(arrangedNodes, connections);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's') {
          e.preventDefault();
          saveMutation.mutate();
        }
      }
      if (e.key === 'Delete' && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, historyIndex]);

  const editingNode = nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="relative w-full h-screen flex overflow-hidden bg-gray-50">
      {/* Left Sidebar - Variables & Triggers */}
      {showLeftPanel && (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            <TriggerManager triggers={triggers} onTriggersChange={setTriggers} />
            <VariableManager
              variables={variables}
              onVariablesChange={setVariables}
              onInsertVariable={(varName) => {
                // Copy to clipboard
                navigator.clipboard.writeText(`{{${varName}}}`);
                toast({
                  title: 'Copied to clipboard',
                  description: `{{${varName}}} copied. Paste it in any message field.`,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Node Palette */}
      <NodePalette onAddNode={addNode} />

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className={`p-2 hover:bg-gray-100 rounded ${showLeftPanel ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Toggle Settings Panel"
            >
              {showLeftPanel ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <button
              onClick={autoArrange}
              className="p-2 hover:bg-gray-100 rounded"
              title="Auto-arrange"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 hover:bg-gray-100 rounded ${showGrid ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Toggle Grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSimulator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span className="font-semibold">Test Flow</span>
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-lg disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="font-semibold">
                {saveMutation.isPending ? 'Saving...' : 'Save Flow'}
              </span>
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
          <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-xs text-center font-semibold text-gray-600">
            {Math.round(scale * 100)}%
          </div>
          <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={resetZoom} className="p-2 hover:bg-gray-100 rounded" title="Reset View">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-gray-300 my-1" />
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            className={`p-2 hover:bg-gray-100 rounded ${showMinimap ? 'bg-blue-50 text-blue-600' : ''}`}
            title="Toggle Minimap"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => {
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
          }}
          className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
          style={{
            backgroundImage: showGrid
              ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
              : 'none',
            backgroundSize: '20px 20px',
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '5000px',
              height: '5000px',
              position: 'relative',
            }}
          >
            {/* SVG for connections */}
            <svg
              className="absolute top-0 left-0"
              style={{ 
                width: '5000px', 
                height: '5000px', 
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
              
              {connections.map((connection) => {
                const fromNode = nodes.find((n) => n.id === connection.from);
                const toNode = nodes.find((n) => n.id === connection.to);
                if (!fromNode || !toNode) return null;

                return (
                  <g key={connection.id} style={{ pointerEvents: 'auto' }}>
                    <ConnectionLine
                      connection={connection}
                      fromNode={fromNode.position}
                      toNode={toNode.position}
                      isSelected={selectedConnectionId === connection.id}
                      onClick={() => setSelectedConnectionId(connection.id)}
                      onDelete={() => deleteConnection(connection.id)}
                    />
                  </g>
                );
              })}

              {/* Connection preview */}
              {connectingFrom && connectionPreview && (
                <g>
                  <path
                    d={`
                      M ${(nodes.find((n) => n.id === connectingFrom)?.position.x || 0) + 128} ${(nodes.find((n) => n.id === connectingFrom)?.position.y || 0) + 180}
                      Q ${((nodes.find((n) => n.id === connectingFrom)?.position.x || 0) + 128 + (connectionPreview.x - panOffset.x) / scale) / 2} ${((nodes.find((n) => n.id === connectingFrom)?.position.y || 0) + 180 + (connectionPreview.y - panOffset.y) / scale) / 2},
                      ${(connectionPreview.x - panOffset.x) / scale} ${(connectionPreview.y - panOffset.y) / scale}
                    `}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    strokeDasharray="8 4"
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                </g>
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                isSelected={selectedNodeId === node.id}
                onSelect={() => setSelectedNodeId(node.id)}
                onDragEnd={(position) => updateNode(node.id, { position })}
                onEdit={() => setEditingNodeId(node.id)}
                onDelete={() => deleteNode(node.id)}
                onDuplicate={() => duplicateNode(node.id)}
                onConnectStart={startConnection}
                scale={scale}
              />
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <div className="absolute bottom-4 left-4 z-20">
            <MiniMap
              nodes={nodes}
              connections={connections}
              viewport={{ x: panOffset.x, y: panOffset.y, scale }}
              canvasSize={{ width: window.innerWidth, height: window.innerHeight }}
            />
          </div>
        )}
      </div>

      {/* Node Editor Side Drawer */}
      <AnimatePresence>
        {editingNode && (
          <NodeEditor
            node={editingNode}
            onClose={() => setEditingNodeId(null)}
            onUpdate={(updates: Partial<FlowNode>) => {
              updateNode(editingNode.id, updates);
              setEditingNodeId(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Flow Simulator Modal */}
      <AnimatePresence>
        {showSimulator && (
          <FlowSimulator
            nodes={nodes}
            connections={connections}
            onClose={() => setShowSimulator(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
