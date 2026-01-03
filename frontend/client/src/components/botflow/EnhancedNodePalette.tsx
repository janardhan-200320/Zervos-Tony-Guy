import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, MessageSquare, MousePointerClick, GitBranch, Zap, Search } from 'lucide-react';
import { NODE_TYPES } from './NodeTypes';

interface EnhancedNodePaletteProps {
  onAddNode: (nodeType: string) => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'message',
    label: 'Messages',
    icon: <MessageSquare className="w-4 h-4" />,
    color: '#3b82f6',
    description: 'Send text, media, and template messages',
  },
  {
    id: 'interaction',
    label: 'Interactions',
    icon: <MousePointerClick className="w-4 h-4" />,
    color: '#8b5cf6',
    description: 'Buttons, lists, and user inputs',
  },
  {
    id: 'logic',
    label: 'Logic & Flow',
    icon: <GitBranch className="w-4 h-4" />,
    color: '#f59e0b',
    description: 'Conditions, loops, and branching',
  },
  {
    id: 'action',
    label: 'Actions',
    icon: <Zap className="w-4 h-4" />,
    color: '#14b8a6',
    description: 'APIs, delays, tags, and agents',
  },
];

export const EnhancedNodePalette: React.FC<EnhancedNodePaletteProps> = ({ onAddNode }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['message', 'interaction', 'logic', 'action'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Filter nodes by search query
  const filteredNodeTypes = Object.entries(NODE_TYPES).filter(([key, nodeType]) => {
    if (nodeType.type === 'START' || nodeType.type === 'END') return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      nodeType.label.toLowerCase().includes(query) ||
      nodeType.description.toLowerCase().includes(query) ||
      nodeType.category.toLowerCase().includes(query)
    );
  });

  // Group nodes by category
  const nodesByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category.id] = filteredNodeTypes.filter(
      ([_, nodeType]) => nodeType.category === category.id
    );
    return acc;
  }, {} as Record<string, Array<[string, any]>>);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Node Palette</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories and Nodes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {CATEGORIES.map((category) => {
            const categoryNodes = nodesByCategory[category.id];
            const isExpanded = expandedCategories.has(category.id);
            
            if (searchQuery && categoryNodes.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    {React.cloneElement(category.icon as React.ReactElement, {
                      style: { color: category.color },
                    })}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-gray-900">
                      {category.label}
                    </div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>

                  <div className="text-gray-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Category Nodes */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 pl-3"
                    >
                      {categoryNodes.map(([key, nodeType]) => (
                        <motion.button
                          key={key}
                          onClick={() => onAddNode(nodeType.type)}
                          onMouseEnter={() => setHoveredNode(key)}
                          onMouseLeave={() => setHoveredNode(null)}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            border-2 border-transparent
                            transition-all duration-200
                            ${
                              hoveredNode === key
                                ? 'bg-gradient-to-r shadow-lg scale-105'
                                : 'bg-white hover:bg-gray-50'
                            }
                          `}
                          style={{
                            ...(hoveredNode === key && {
                              background: `linear-gradient(135deg, ${nodeType.color}10, ${nodeType.color}20)`,
                              borderColor: nodeType.color,
                            }),
                          }}
                        >
                          <div className="text-2xl">{nodeType.icon}</div>
                          
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900">
                                {nodeType.label}
                              </span>
                              {nodeType.badge && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                                  style={{
                                    backgroundColor: `${nodeType.color}20`,
                                    color: nodeType.color,
                                  }}
                                >
                                  {nodeType.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {nodeType.description}
                            </p>
                          </div>

                          {/* Drag indicator */}
                          {hoveredNode === key && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col gap-0.5"
                            >
                              <div className="w-1 h-1 rounded-full bg-gray-400" />
                              <div className="w-1 h-1 rounded-full bg-gray-400" />
                              <div className="w-1 h-1 rounded-full bg-gray-400" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Tips */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Click to add a node to the canvas
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Drag connections between nodes
          </p>
        </div>
      </div>
    </div>
  );
};
