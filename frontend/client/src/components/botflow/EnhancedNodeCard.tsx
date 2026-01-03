import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { FlowNode, NODE_TYPES } from './NodeTypes';

interface EnhancedNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  isDragging?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onConnectionStart?: (outputIndex?: number) => void;
  onConnectionEnd?: () => void;
  isConnecting?: boolean;
  canConnect?: boolean;
  connectionHandles?: {
    inputs: number;
    outputs: number;
  };
}

export const EnhancedNodeCard: React.FC<EnhancedNodeCardProps> = ({
  node,
  isSelected,
  isDragging,
  onClick,
  onEdit,
  onDelete,
  onDragStart,
  onConnectionStart,
  onConnectionEnd,
  isConnecting = false,
  canConnect = false,
  connectionHandles,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredHandle, setHoveredHandle] = useState<'input' | 'output' | null>(null);
  const nodeType = NODE_TYPES[node.type];

  if (!nodeType) return null;

  // Get preview text based on node type
  const getPreviewText = (): string => {
    if (node.data.message) {
      const text = node.data.message as string;
      return text.length > 60 ? text.substring(0, 60) + '...' : text;
    }
    if (node.data.buttons && Array.isArray(node.data.buttons)) {
      return `${node.data.buttons.length} button(s)`;
    }
    if (node.data.listSections && Array.isArray(node.data.listSections)) {
      return `${node.data.listSections.length} section(s)`;
    }
    if (node.data.delayConfig) {
      return `Wait ${node.data.delayConfig.duration} ${node.data.delayConfig.unit}`;
    }
    return nodeType.description;
  };

  const hasValidationErrors = node.validation?.errors && node.validation.errors.length > 0;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: 280,
        zIndex: isSelected || isDragging ? 1000 : 1,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isSelected ? 1.05 : 1,
        opacity: 1,
        y: isDragging ? -4 : 0,
      }}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Input Connection Handle */}
      {nodeType.hasInput !== false && (
        <motion.div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ scale: 0 }}
          animate={{ 
            scale: hoveredHandle === 'input' || (isConnecting && canConnect) ? 1.3 : 1 
          }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
          onMouseEnter={() => setHoveredHandle('input')}
          onMouseLeave={() => setHoveredHandle(null)}
        >
          <motion.div
            className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg cursor-pointer relative"
            style={{
              borderColor: hoveredHandle === 'input' || (isConnecting && canConnect) 
                ? '#3b82f6' 
                : nodeType.color,
              borderWidth: 3,
              borderStyle: 'solid',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isConnecting && onConnectionEnd) {
                onConnectionEnd();
              }
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Magnetic pulse animation when connection is active */}
            {isConnecting && canConnect && (
              <motion.div
                className="absolute inset-0 rounded-full bg-blue-400"
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            )}
            <motion.div
              className="w-3 h-3 rounded-full relative z-10"
              style={{ 
                backgroundColor: hoveredHandle === 'input' || (isConnecting && canConnect) 
                  ? '#3b82f6' 
                  : nodeType.color 
              }}
              animate={{
                scale: hoveredHandle === 'input' || (isConnecting && canConnect) ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: hoveredHandle === 'input' || (isConnecting && canConnect) ? Infinity : 0,
              }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Main Card */}
      <motion.div
        className={`
          rounded-xl overflow-hidden shadow-lg
          bg-white
          ${isSelected ? 'ring-4' : 'ring-0'}
          transition-all duration-200
        `}
        style={{
          boxShadow: isSelected
            ? `0 20px 40px -12px ${nodeType.color}40, 0 0 0 4px ${nodeType.color}30`
            : isDragging
            ? '0 20px 40px -12px rgba(0,0,0,0.25)'
            : '0 4px 12px -2px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header with Gradient */}
        <div
          className={`bg-gradient-to-r ${nodeType.gradient} p-4 text-white relative`}
          onMouseDown={onDragStart}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{nodeType.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{nodeType.label}</h3>
                {nodeType.badge && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
                    {nodeType.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {node.type !== 'START' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 hover:bg-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Validation Error Indicator */}
          {hasValidationErrors && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 text-xs bg-red-500/30 rounded px-2 py-1"
            >
              <AlertCircle className="w-3 h-3" />
              <span className="flex-1 truncate">Configuration incomplete</span>
            </motion.div>
          )}
        </div>

        {/* Content Area */}
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {/* Description */}
            <p className="text-xs text-gray-500 mb-3">{nodeType.description}</p>

            {/* Preview Content */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {getPreviewText()}
              </p>
            </div>

            {/* Node-specific indicators */}
            {node.type === 'BUTTONS' && node.data.buttons && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {(node.data.buttons as Array<{ text: string }>).slice(0, 3).map((btn, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-violet-100 text-violet-700 text-xs font-medium"
                  >
                    {btn.text || `Button ${idx + 1}`}
                  </span>
                ))}
              </div>
            )}

            {node.type === 'CONDITION' && node.data.conditions && (
              <div className="mt-3 space-y-1">
                {(node.data.conditions as Array<any>).slice(0, 2).map((condition, idx) => (
                  <div key={idx} className="text-xs text-gray-600 bg-amber-50 rounded px-2 py-1">
                    {condition.variable} {condition.operator} {condition.value}
                  </div>
                ))}
              </div>
            )}

            {node.type === 'API_CALL' && node.data.apiConfig?.url && (
              <div className="mt-3 text-xs">
                <span className="inline-block px-2 py-1 bg-cyan-100 text-cyan-700 rounded font-mono">
                  {node.data.apiConfig.method || 'GET'} {node.data.apiConfig.url}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Connection Stats */}
        {connectionHandles && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>{connectionHandles.inputs} input(s)</span>
            <span>{connectionHandles.outputs} output(s)</span>
          </div>
        )}
      </motion.div>

      {/* Output Connection Handles */}
      {nodeType.hasOutput !== false && (
        <div className="absolute -bottom-3 left-0 right-0 flex justify-center gap-4 z-20">
          {Array.from({ length: nodeType.maxOutputs || 1 }).map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ 
                scale: hoveredHandle === 'output' ? 1.3 : 1 
              }}
              transition={{ delay: 0.1 + idx * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
              className="relative"
              onMouseEnter={() => setHoveredHandle('output')}
              onMouseLeave={() => setHoveredHandle(null)}
            >
              <motion.div
                className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg cursor-pointer relative"
                style={{
                  borderColor: hoveredHandle === 'output' ? '#3b82f6' : nodeType.color,
                  borderWidth: 3,
                  borderStyle: 'solid',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (onConnectionStart) {
                    onConnectionStart(idx);
                  }
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Connection drag indicator */}
                {hoveredHandle === 'output' && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                    }}
                  />
                )}
                <motion.div
                  className="w-3 h-3 rounded-full relative z-10"
                  style={{ 
                    backgroundColor: hoveredHandle === 'output' ? '#3b82f6' : nodeType.color 
                  }}
                  animate={{
                    scale: hoveredHandle === 'output' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: hoveredHandle === 'output' ? Infinity : 0,
                  }}
                />
              </motion.div>
              {/* Output Label */}
              {nodeType.outputLabels && nodeType.outputLabels[idx] && (
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${nodeType.color}15`,
                      color: nodeType.color,
                    }}
                  >
                    {nodeType.outputLabels[idx]}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Hover Indicator */}
      {isHovered && !isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: `0 0 0 2px ${nodeType.color}40`,
          }}
        />
      )}
    </motion.div>
  );
};
