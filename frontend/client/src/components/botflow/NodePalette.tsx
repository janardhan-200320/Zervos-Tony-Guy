import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { NODE_TYPES } from './NodeTypes';

interface NodePaletteProps {
  onAddNode: (nodeType: string) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  // Group nodes by category
  const categories = {
    trigger: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
    message: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
    interaction: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
    logic: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
    action: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
    end: [] as typeof NODE_TYPES[keyof typeof NODE_TYPES][],
  };

  Object.values(NODE_TYPES).forEach((nodeType) => {
    if (nodeType.type !== 'START') { // Start node is auto-created
      categories[nodeType.category].push(nodeType);
    }
  });

  const categoryLabels = {
    trigger: '🎯 Triggers',
    message: '💬 Messages',
    interaction: '🔘 Interactions',
    logic: '🔀 Logic',
    action: '⚡ Actions',
    end: '🏁 End Points',
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Palette</h2>
        <p className="text-sm text-gray-600 mt-1">Click to add nodes to canvas</p>
      </div>

      <div className="p-4 space-y-6">
        {(Object.keys(categories) as Array<keyof typeof categories>).map((category) => {
          if (categories[category].length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {categoryLabels[category]}
              </h3>
              <div className="space-y-2">
                {categories[category].map((nodeType) => (
                  <motion.button
                    key={nodeType.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddNode(nodeType.type)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg
                      bg-gradient-to-br ${nodeType.gradient}
                      text-white shadow-sm hover:shadow-md
                      transition-all duration-200
                      border border-white/20
                    `}
                  >
                    <span className="text-2xl">{nodeType.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm">{nodeType.label}</div>
                      <div className="text-xs text-white/80 line-clamp-1">
                        {nodeType.description}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 opacity-70" />
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="p-4 border-t border-gray-200 bg-blue-50">
        <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Drag nodes to position them</li>
          <li>• Click output handles to connect</li>
          <li>• Hover nodes for quick actions</li>
          <li>• Use minimap for navigation</li>
          <li>• Press Ctrl+Z to undo</li>
        </ul>
      </div>
    </div>
  );
};
