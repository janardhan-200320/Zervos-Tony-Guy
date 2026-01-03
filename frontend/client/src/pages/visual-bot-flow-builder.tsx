import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Bot, Plus, Save, Trash2, MessageSquare, List, GitBranch, Phone, Play,
  Copy, Settings, Download, Upload, Zap, AlertCircle
} from 'lucide-react';

// Flow node types
const NODE_TYPES = {
  START: 'start',
  MESSAGE: 'message',
  BUTTONS: 'buttons',
  LIST: 'list',
  CONDITION: 'condition',
  API_CALL: 'api_call',
  DELAY: 'delay',
  END: 'end',
};

interface FlowNode {
  id: string;
  type: string;
  x: number;
  y: number;
  data: {
    label: string;
    message?: string;
    buttons?: Array<{ id: string; text: string; nextNodeId?: string }>;
    listItems?: Array<{ id: string; title: string; description?: string; nextNodeId?: string }>;
    condition?: { variable: string; operator: string; value: string; trueNodeId?: string; falseNodeId?: string };
    apiEndpoint?: string;
    delayTime?: number;
  };
  width?: number;
  height?: number;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  outputKey?: string;  // For button/list items (button_0, button_1, etc)
  conditionBranch?: 'true' | 'false';  // For condition nodes
}

interface ConnectionLineProps {
  from: FlowNode;
  to: FlowNode;
  label?: string;
  labelColor?: string;
}

const ConnectionLine = ({ from, to, label, labelColor = '#3b82f6' }: ConnectionLineProps) => {
  const x1 = from.x + 90;
  const y1 = from.y + 80;

  const x2 = to.x;
  const y2 = to.y + 40;

  const controlX = (x1 + x2) / 2;
  const controlY = (y1 + y2) / 2;

  // Calculate label position (middle of curve)
  const labelX = controlX;
  const labelY = controlY - 15;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill={labelColor} />
        </marker>
      </defs>
      <path
        d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
        stroke={labelColor}
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#arrowhead)`}
      />
      {label && (
        <g>
          <rect
            x={labelX - 35}
            y={labelY - 12}
            width="70"
            height="22"
            rx="3"
            fill="white"
            stroke={labelColor}
            strokeWidth="1"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium"
            fill={labelColor}
          >
            {label}
          </text>
        </g>
      )}
    </svg>
  );
};

interface NodePaletteProps {
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
}

const NodePalette = ({ onDragStart }: NodePaletteProps) => {
  const nodes = [
    { type: NODE_TYPES.MESSAGE, icon: MessageSquare, label: 'Message' },
    { type: NODE_TYPES.BUTTONS, icon: Zap, label: 'Buttons' },
    { type: NODE_TYPES.LIST, icon: List, label: 'List Menu' },
    { type: NODE_TYPES.CONDITION, icon: GitBranch, label: 'Condition' },
    { type: NODE_TYPES.DELAY, icon: Phone, label: 'Delay' },
    { type: NODE_TYPES.API_CALL, icon: Phone, label: 'API Call' },
    { type: NODE_TYPES.END, icon: Phone, label: 'End' },
  ];

  return (
    <div className="w-64 border-r bg-slate-50 p-4 space-y-2">
      <h3 className="font-semibold text-sm text-slate-700 mb-4">Nodes</h3>
      {nodes.map((node) => (
        <div
          key={node.type}
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
          className="p-3 bg-white border rounded-lg cursor-move hover:shadow-md hover:border-blue-400 transition-all"
        >
          <div className="flex items-center gap-2">
            <node.icon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{node.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface FlowNodeProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onDelete: (nodeId: string) => void;
  onDragStart: (e: React.DragEvent, nodeType: string) => void;
}

const FlowNode = ({ node, isSelected, onClick, onDoubleClick, onDelete }: FlowNodeProps) => {
  const getNodeColor = (type: string) => {
    switch (type) {
      case NODE_TYPES.START: return 'bg-green-100 border-green-500';
      case NODE_TYPES.MESSAGE: return 'bg-blue-100 border-blue-500';
      case NODE_TYPES.BUTTONS: return 'bg-purple-100 border-purple-500';
      case NODE_TYPES.LIST: return 'bg-orange-100 border-orange-500';
      case NODE_TYPES.CONDITION: return 'bg-yellow-100 border-yellow-500';
      case NODE_TYPES.API_CALL: return 'bg-red-100 border-red-500';
      case NODE_TYPES.DELAY: return 'bg-pink-100 border-pink-500';
      case NODE_TYPES.END: return 'bg-gray-100 border-gray-500';
      default: return 'bg-slate-100 border-slate-500';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('nodeId', node.id);
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`absolute p-4 rounded-lg border-2 cursor-move min-w-[180px] ${getNodeColor(node.type)} ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
      }`}
      style={{ left: node.x, top: node.y }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm">{node.data.label}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="p-1 hover:bg-red-200 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>
      
      {node.data.message && (
        <p className="text-xs text-slate-700 mb-2 line-clamp-2">{node.data.message}</p>
      )}
      
      {node.type === NODE_TYPES.BUTTONS && node.data.buttons && (
        <div className="text-xs space-y-1">
          {node.data.buttons.map((btn: { id: string; text: string }) => (
            <div key={btn.id} className="bg-white/50 px-2 py-1 rounded text-slate-700">
              {btn.text}
            </div>
          ))}
        </div>
      )}

      {/* Connection ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full border border-white" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border border-white" />
    </div>
  );
};

export default function VisualBotFlowBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      id: 'start_1',
      type: NODE_TYPES.START,
      x: 50,
      y: 50,
      data: { label: 'Start' },
    }
  ]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeFormData, setNodeFormData] = useState({
    label: '',
    message: '',
    buttons: [] as Array<{ id: string; text: string; nextNodeId?: string }>,
  });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Fetch flows
  const { data: flows = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/bot/flows'],
  });

  // Create/Update flow mutation
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      const response = await fetch('/api/bot/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      if (!response.ok) throw new Error('Failed to save flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: 'Success', description: 'Flow saved successfully!' });
    },
  });

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const nodeId = e.dataTransfer.getData('nodeId');

    if (nodeType) {
      // New node from palette
      const rect = canvasRef.current?.getBoundingClientRect();
      const x = e.clientX - rect!.left;
      const y = e.clientY - rect!.top;

      const newNode: FlowNode = {
        id: `${nodeType}_${Date.now()}`,
        type: nodeType,
        x,
        y,
        data: {
          label: nodeType.replace('_', ' ').toUpperCase(),
          message: '',
        },
      };

      setNodes([...nodes, newNode]);
      setEditingNodeId(newNode.id);
      setShowNodeModal(true);
    } else if (nodeId) {
      // Moving existing node
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const rect = canvasRef.current?.getBoundingClientRect();
        const newX = e.clientX - rect!.left - 90; // Center on cursor
        const newY = e.clientY - rect!.top - 40;

        setNodes(
          nodes.map((n) =>
            n.id === nodeId ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) } : n
          )
        );
      }
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditingNodeId(nodeId);
      setNodeFormData({
        label: node.data.label,
        message: node.data.message || '',
        buttons: node.data.buttons || [],
      });
      setShowNodeModal(true);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setConnections(
      connections.filter((c) => c.from !== nodeId && c.to !== nodeId)
    );
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleSaveNode = () => {
    if (!editingNodeId) return;

    setNodes(
      nodes.map((n) =>
        n.id === editingNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ...nodeFormData,
              },
            }
          : n
      )
    );

    setShowNodeModal(false);
    setEditingNodeId(null);
    setNodeFormData({ label: '', message: '', buttons: [] });
  };

  const handleConnect = (fromId: string) => {
    if (connectingFrom === fromId) {
      setConnectingFrom(null);
    } else {
      setConnectingFrom(fromId);
      toast({
        title: 'Connecting',
        description: 'Click on the target node to complete the connection',
      });
    }
  };

  const handleCompleteConnection = (toId: string, outputKey?: string, conditionBranch?: 'true' | 'false') => {
    if (connectingFrom && connectingFrom !== toId) {
      const connectionKey = `${connectingFrom}-${toId}-${outputKey || conditionBranch || 'default'}`;
      if (!connections.find((c) => 
        c.from === connectingFrom && 
        c.to === toId && 
        c.outputKey === outputKey &&
        c.conditionBranch === conditionBranch
      )) {
        const newConnection: FlowConnection = {
          from: connectingFrom,
          to: toId,
        };
        
        if (outputKey) newConnection.outputKey = outputKey;
        if (conditionBranch) newConnection.conditionBranch = conditionBranch;
        
        setConnections([...connections, newConnection]);
        
        const fromNode = nodes.find(n => n.id === connectingFrom);
        const labelText = outputKey || conditionBranch || 'connected';
        toast({ 
          title: 'Connected', 
          description: `${fromNode?.data.label} → ${labelText}` 
        });
      }
      setConnectingFrom(null);
    }
  };

  const handleSaveFlow = () => {
    if (!flowName) {
      toast({ title: 'Error', description: 'Please enter a flow name', variant: 'destructive' });
      return;
    }

    const flowData = {
      name: flowName,
      description: flowDescription,
      triggerType: 'keyword',
      triggerValue: flowName.toLowerCase().replace(/\s+/g, '_'),
      isActive: 'true',
      priority: '10',
      flowData: {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: n.data,
          nextNodeId: connections.find((c) => c.from === n.id)?.to,
        })),
        startNodeId: 'start_1',
      },
    };

    saveFlowMutation.mutate(flowData);
  };

  const handleExportFlow = () => {
    const flowData = {
      name: flowName,
      nodes,
      connections,
    };
    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowName || 'flow'}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen bg-white">
        {/* Toolbar */}
        <div className="border-b bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <Label className="text-sm">Flow Name</Label>
              <Input
                placeholder="Enter flow name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportFlow}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleSaveFlow} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Flow
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Node Palette */}
          <NodePalette onDragStart={handleDragStart} />

          {/* Canvas */}
          <div
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto relative cursor-crosshair"
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Connection Lines */}
            {connections.map((conn) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              
              // Determine label and color based on connection type
              let displayLabel = conn.label;
              let lineColor = '#3b82f6';
              
              if (conn.conditionBranch) {
                displayLabel = conn.conditionBranch.toUpperCase();
                lineColor = conn.conditionBranch === 'true' ? '#10b981' : '#ef4444';
              } else if (fromNode?.type === NODE_TYPES.BUTTONS && conn.outputKey) {
                const buttonIndex = parseInt(conn.outputKey.split('_')[1]);
                const button = fromNode.data.buttons?.[buttonIndex];
                displayLabel = button?.text || `Button ${buttonIndex + 1}`;
                lineColor = '#a855f7';
              } else if (fromNode?.type === NODE_TYPES.LIST && conn.outputKey) {
                const itemIndex = parseInt(conn.outputKey.split('_')[1]);
                const item = fromNode.data.listItems?.[itemIndex];
                displayLabel = item?.title || `Item ${itemIndex + 1}`;
                lineColor = '#f97316';
              }
              
              return fromNode && toNode ? (
                <ConnectionLine 
                  key={`${conn.from}-${conn.to}-${conn.outputKey || conn.conditionBranch}`}
                  from={fromNode} 
                  to={toNode}
                  label={displayLabel}
                  labelColor={lineColor}
                />
              ) : null;
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <div key={node.id} onClick={() => handleNodeClick(node.id)}>
                <FlowNode
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onClick={() => handleNodeClick(node.id)}
                  onDoubleClick={() => handleNodeDoubleClick(node.id)}
                  onDelete={handleDeleteNode}
                  onDragStart={handleDragStart}
                />
              </div>
            ))}

            {nodes.length === 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">Drag nodes from the left panel</p>
                  <p className="text-sm text-slate-400">to build your WhatsApp bot flow</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Node Properties */}
          {selectedNodeId && (
            <div className="w-72 border-l bg-slate-50 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Node Properties</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Node Label</Label>
                      <Input
                        value={nodes.find((n) => n.id === selectedNodeId)?.data.label || ''}
                        onChange={(e) =>
                          setNodes(
                            nodes.map((n) =>
                              n.id === selectedNodeId
                                ? { ...n, data: { ...n.data, label: e.target.value } }
                                : n
                            )
                          )
                        }
                        className="mt-1"
                      />
                    </div>

                    {(nodes.find((n) => n.id === selectedNodeId)?.type === NODE_TYPES.MESSAGE ||
                      nodes.find((n) => n.id === selectedNodeId)?.type === NODE_TYPES.BUTTONS) && (
                      <div>
                        <Label className="text-sm">Message Text</Label>
                        <textarea
                          value={nodes.find((n) => n.id === selectedNodeId)?.data.message || ''}
                          onChange={(e) =>
                            setNodes(
                              nodes.map((n) =>
                                n.id === selectedNodeId
                                  ? { ...n, data: { ...n.data, message: e.target.value } }
                                  : n
                              )
                            )
                          }
                          className="mt-1 w-full p-2 border rounded text-sm"
                          rows={4}
                        />
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setEditingNodeId(selectedNodeId);
                        const node = nodes.find((n) => n.id === selectedNodeId);
                        setNodeFormData({
                          label: node?.data.label || '',
                          message: node?.data.message || '',
                          buttons: node?.data.buttons || [],
                        });
                        setShowNodeModal(true);
                      }}
                      size="sm"
                      className="w-full"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Modal */}
      <Dialog open={showNodeModal} onOpenChange={setShowNodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Node</DialogTitle>
            <DialogDescription>Set up the node properties</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label</Label>
              <Input
                value={nodeFormData.label}
                onChange={(e) => setNodeFormData({ ...nodeFormData, label: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                value={nodeFormData.message}
                onChange={(e) => setNodeFormData({ ...nodeFormData, message: e.target.value })}
                className="mt-1 w-full p-2 border rounded"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNodeModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNode} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
