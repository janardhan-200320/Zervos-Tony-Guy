import React, { useState, useRef } from 'react';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import { Check, AlertCircle, AlertTriangle, Edit2, Copy, Trash2, Link as LinkIcon } from 'lucide-react';
import { FlowNode, NODE_TYPES, validateNode, getNodeOutputs } from './NodeTypes';

interface NodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (position: { x: number; y: number }) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onConnectStart: (handleId: string) => void;
  scale: number;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onDragEnd,
  onEdit,
  onDelete,
  onDuplicate,
  onConnectStart,
  scale,
}) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const nodeType = NODE_TYPES[node.type];
  const validation = validateNode(node);
  const outputs = getNodeOutputs(node);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    onDragEnd({
      x: node.position.x + info.offset.x / scale,
      y: node.position.y + info.offset.y / scale,
    });
  };

  const getNodeLabel = (): string => {
    if (node.data.label) return node.data.label;
    if (node.type === 'MESSAGE' && node.data.message) {
      return node.data.message.slice(0, 30) + (node.data.message.length > 30 ? '...' : '');
    }
    if (node.type === 'BUTTONS' && node.data.buttons && node.data.buttons.length > 0) {
      return `${node.data.buttons.length} Button${node.data.buttons.length > 1 ? 's' : ''}`;
    }
    return nodeType.label;
  };

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className={`group relative transition-all duration-200 ${isDragging ? 'z-50' : 'z-10'}`}
    >
      {/* Node Card */}
      <div
        className={`
          relative w-64 rounded-xl shadow-lg backdrop-blur-sm
          bg-gradient-to-br ${nodeType.gradient}
          border-2 transition-all duration-200
          ${isSelected ? 'border-white shadow-2xl scale-105' : 'border-white/20 hover:border-white/40'}
          ${isDragging ? 'shadow-2xl' : ''}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{nodeType.icon}</span>
              <div>
                <h3 className="text-white font-semibold text-sm">{nodeType.label}</h3>
                <p className="text-white/70 text-xs">{getNodeLabel()}</p>
              </div>
            </div>
            {/* Validation Badge */}
            <div className="flex items-center gap-1">
              {!validation.isValid && (
                <div className="p-1 bg-red-500/20 rounded-full" title={validation.errors.join(', ')}>
                  <AlertCircle className="w-4 h-4 text-red-200" />
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div className="p-1 bg-yellow-500/20 rounded-full" title={validation.warnings.join(', ')}>
                  <AlertTriangle className="w-4 h-4 text-yellow-200" />
                </div>
              )}
              {validation.isValid && validation.warnings.length === 0 && (
                <div className="p-1 bg-green-500/20 rounded-full">
                  <Check className="w-4 h-4 text-green-200" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="px-4 py-3 text-white/90 text-sm">
          {node.type === 'MESSAGE' && (
            <p className="line-clamp-2">{node.data.message || 'No message set'}</p>
          )}
          {node.type === 'BUTTONS' && (
            <div className="space-y-1">
              {node.data.buttons?.slice(0, 3).map((btn, idx) => (
                <div key={idx} className="px-2 py-1 bg-white/10 rounded text-xs">
                  {btn.text || `Button ${idx + 1}`}
                </div>
              ))}
            </div>
          )}
          {node.type === 'LIST' && (
            <div className="text-xs">
              {node.data.listSections?.length || 0} section(s)
            </div>
          )}
          {node.type === 'CONDITION' && (
            <div className="text-xs">
              {node.data.conditions?.length || 0} condition(s)
            </div>
          )}
          {node.type === 'API_CALL' && (
            <div className="text-xs font-mono">
              {node.data.apiConfig?.method || 'GET'} {node.data.apiConfig?.url || 'No URL set'}
            </div>
          )}
          {node.type === 'DATA_CAPTURE' && (
            <div className="text-xs">
              Capture: {node.data.captureConfig?.variable || 'variable'}
            </div>
          )}
          {node.type === 'DELAY' && (
            <div className="text-xs">
              Wait: {node.data.delayConfig?.duration || 0} {node.data.delayConfig?.unit || 'seconds'}
            </div>
          )}
          {node.type === 'LOOP' && (
            <div className="text-xs">
              Loop over: {node.data.loopConfig?.arrayVariable || 'array'}
            </div>
          )}
          {node.type === 'END' && (
            <div className="text-xs">
              {node.data.endMessage || 'Conversation ends'}
            </div>
          )}
          {node.type === 'START' && (
            <div className="text-xs text-white/70">
              Entry point
            </div>
          )}
        </div>

        {/* Output Handles */}
        {outputs.length > 0 && (
          <div className="px-4 pb-3 space-y-1">
            {outputs.map((output) => (
              <div
                key={output.id}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart(`${node.id}:${output.id}`);
                }}
                className="relative flex items-center justify-between px-2 py-1 bg-white/10 rounded hover:bg-white/20 cursor-crosshair transition-colors"
                style={{ borderLeft: `3px solid ${output.color}` }}
              >
                <span className="text-xs text-white/90">{output.label}</span>
                <LinkIcon className="w-3 h-3 text-white/70" />
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions (hover) */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
              title="Edit Node"
            >
              <Edit2 className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
              title="Duplicate Node"
            >
              <Copy className="w-4 h-4 text-gray-700" />
            </button>
            {node.type !== 'START' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 bg-red-500 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                title="Delete Node"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Input Handle (top center) */}
      {node.type !== 'START' && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full shadow-lg hover:scale-110 transition-transform"
          style={{ zIndex: 100 }}
        >
          <div className="absolute inset-1 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
        </div>
      )}
    </motion.div>
  );
};
