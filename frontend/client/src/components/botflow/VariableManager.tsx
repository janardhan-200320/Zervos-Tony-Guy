import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Variable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  defaultValue?: any;
  description?: string;
  scope: 'global' | 'session' | 'user';
}

interface VariableManagerProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
  onInsertVariable?: (variableName: string) => void;
}

export const VariableManager: React.FC<VariableManagerProps> = ({
  variables,
  onVariablesChange,
  onInsertVariable,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [newVariable, setNewVariable] = useState<Variable>({
    name: '',
    type: 'text',
    defaultValue: '',
    description: '',
    scope: 'session',
  });

  // System variables (read-only)
  const systemVariables: Variable[] = [
    { name: 'user_name', type: 'text', description: 'Customer name', scope: 'user' },
    { name: 'phone_number', type: 'text', description: 'Phone number', scope: 'user' },
    { name: 'user_id', type: 'text', description: 'Unique user ID', scope: 'user' },
    { name: 'conversation_id', type: 'text', description: 'Conversation ID', scope: 'session' },
    { name: 'flow_name', type: 'text', description: 'Current flow name', scope: 'session' },
    { name: 'current_time', type: 'date', description: 'Current timestamp', scope: 'global' },
    { name: 'current_date', type: 'date', description: 'Current date', scope: 'global' },
  ];

  const handleAddVariable = () => {
    if (!newVariable.name) return;

    // Check for duplicates
    if (variables.find((v) => v.name === newVariable.name)) {
      alert('Variable name already exists!');
      return;
    }

    onVariablesChange([...variables, newVariable]);
    setNewVariable({
      name: '',
      type: 'text',
      defaultValue: '',
      description: '',
      scope: 'session',
    });
    setShowAddDialog(false);
  };

  const handleDeleteVariable = (name: string) => {
    onVariablesChange(variables.filter((v) => v.name !== name));
  };

  const handleUpdateVariable = () => {
    if (!editingVariable) return;
    
    onVariablesChange(
      variables.map((v) => (v.name === editingVariable.name ? editingVariable : v))
    );
    setEditingVariable(null);
  };

  const VariableItem: React.FC<{ variable: Variable; isSystem?: boolean }> = ({
    variable,
    isSystem = false,
  }) => (
    <motion.div
      layout
      className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-purple-600 font-semibold">
            {'{{'}{variable.name}{'}}'}
          </code>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {variable.type}
          </span>
          {variable.scope === 'global' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
              Global
            </span>
          )}
          {variable.scope === 'user' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">
              User
            </span>
          )}
        </div>
        {variable.description && (
          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onInsertVariable && (
          <button
            onClick={() => onInsertVariable(variable.name)}
            className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition-colors"
            title="Insert into message"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        {!isSystem && (
          <>
            <button
              onClick={() => setEditingVariable(variable)}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Edit variable"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteVariable(variable.name)}
              className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
              title="Delete variable"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <Database className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm text-gray-900">Variables</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">
            {variables.length + systemVariables.length}
          </span>
        </div>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowAddDialog(true);
          }}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Variable
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
              {/* System Variables */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  System Variables
                </h4>
                <div className="space-y-1">
                  {systemVariables.map((variable) => (
                    <VariableItem key={variable.name} variable={variable} isSystem />
                  ))}
                </div>
              </div>

              {/* Custom Variables */}
              {variables.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Custom Variables
                  </h4>
                  <div className="space-y-1">
                    {variables.map((variable) => (
                      <VariableItem key={variable.name} variable={variable} />
                    ))}
                  </div>
                </div>
              )}

              {variables.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No custom variables yet</p>
                  <p className="text-xs mt-1">Click "Add Variable" to create one</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Variable Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Variable</h3>
                  <button
                    onClick={() => setShowAddDialog(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variable Name *
                    </label>
                    <Input
                      value={newVariable.name}
                      onChange={(e) =>
                        setNewVariable({ ...newVariable, name: e.target.value.replace(/\s/g, '_') })
                      }
                      placeholder="my_variable"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Use: {'{{'}{newVariable.name || 'variable_name'}{'}}'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={newVariable.type}
                      onChange={(e) =>
                        setNewVariable({ ...newVariable, type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="date">Date</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scope</label>
                    <select
                      value={newVariable.scope}
                      onChange={(e) =>
                        setNewVariable({ ...newVariable, scope: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="session">Session (resets after conversation ends)</option>
                      <option value="user">User (persists across conversations)</option>
                      <option value="global">Global (shared across all users)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Value
                    </label>
                    <Input
                      value={newVariable.defaultValue}
                      onChange={(e) =>
                        setNewVariable({ ...newVariable, defaultValue: e.target.value })
                      }
                      placeholder="Optional default value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={newVariable.description}
                      onChange={(e) =>
                        setNewVariable({ ...newVariable, description: e.target.value })
                      }
                      placeholder="What is this variable for?"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddVariable} className="flex-1" disabled={!newVariable.name}>
                    Add Variable
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Variable Dialog */}
      <AnimatePresence>
        {editingVariable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingVariable(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Variable</h3>
                  <button
                    onClick={() => setEditingVariable(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variable Name
                    </label>
                    <Input
                      value={editingVariable.name}
                      disabled
                      className="font-mono bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Value
                    </label>
                    <Input
                      value={editingVariable.defaultValue}
                      onChange={(e) =>
                        setEditingVariable({ ...editingVariable, defaultValue: e.target.value })
                      }
                      placeholder="Optional default value"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={editingVariable.description}
                      onChange={(e) =>
                        setEditingVariable({ ...editingVariable, description: e.target.value })
                      }
                      placeholder="What is this variable for?"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setEditingVariable(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateVariable} className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
