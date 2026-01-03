import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Edit2, Trash2, Zap, MessageSquare, Clock, MousePointer, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FlowTrigger {
  id: string;
  type: 'keyword' | 'welcome' | 'button' | 'time' | 'event' | 'webhook';
  value: string;
  description?: string;
  enabled: boolean;
  priority: number;
}

interface TriggerManagerProps {
  triggers: FlowTrigger[];
  onTriggersChange: (triggers: FlowTrigger[]) => void;
}

export const TriggerManager: React.FC<TriggerManagerProps> = ({
  triggers,
  onTriggersChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<FlowTrigger | null>(null);
  const [newTrigger, setNewTrigger] = useState<FlowTrigger>({
    id: '',
    type: 'keyword',
    value: '',
    description: '',
    enabled: true,
    priority: 5,
  });

  const triggerIcons = {
    keyword: <MessageSquare className="w-4 h-4" />,
    welcome: <Zap className="w-4 h-4" />,
    button: <MousePointer className="w-4 h-4" />,
    time: <Clock className="w-4 h-4" />,
    event: <Zap className="w-4 h-4" />,
    webhook: <Zap className="w-4 h-4" />,
  };

  const triggerColors = {
    keyword: 'bg-blue-100 text-blue-600',
    welcome: 'bg-green-100 text-green-600',
    button: 'bg-purple-100 text-purple-600',
    time: 'bg-orange-100 text-orange-600',
    event: 'bg-pink-100 text-pink-600',
    webhook: 'bg-cyan-100 text-cyan-600',
  };

  const handleAddTrigger = () => {
    if (!newTrigger.value) return;

    const trigger: FlowTrigger = {
      ...newTrigger,
      id: `trigger_${Date.now()}`,
    };

    onTriggersChange([...triggers, trigger]);
    setNewTrigger({
      id: '',
      type: 'keyword',
      value: '',
      description: '',
      enabled: true,
      priority: 5,
    });
    setShowAddDialog(false);
  };

  const handleDeleteTrigger = (id: string) => {
    onTriggersChange(triggers.filter((t) => t.id !== id));
  };

  const handleToggleTrigger = (id: string) => {
    onTriggersChange(
      triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const handleUpdateTrigger = () => {
    if (!editingTrigger) return;
    
    onTriggersChange(
      triggers.map((t) => (t.id === editingTrigger.id ? editingTrigger : t))
    );
    setEditingTrigger(null);
  };

  const TriggerItem: React.FC<{ trigger: FlowTrigger }> = ({ trigger }) => (
    <motion.div
      layout
      className={`group flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
        trigger.enabled
          ? 'border-gray-200 hover:border-gray-300 bg-white'
          : 'border-gray-100 bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${triggerColors[trigger.type]}`}>
          {triggerIcons[trigger.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {trigger.type}
            </span>
            {trigger.priority > 7 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                High Priority
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate mt-0.5">
            {trigger.type === 'keyword' && `Keywords: ${trigger.value}`}
            {trigger.type === 'welcome' && 'Triggers on first message'}
            {trigger.type === 'button' && `Button ID: ${trigger.value}`}
            {trigger.type === 'time' && `Schedule: ${trigger.value}`}
            {trigger.type === 'event' && `Event: ${trigger.value}`}
            {trigger.type === 'webhook' && `Webhook: ${trigger.value}`}
          </p>
          {trigger.description && (
            <p className="text-xs text-gray-500 mt-1">{trigger.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={trigger.enabled}
            onChange={() => handleToggleTrigger(trigger.id)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingTrigger(trigger)}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors"
            title="Edit trigger"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteTrigger(trigger.id)}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
            title="Delete trigger"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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
          <Zap className="w-4 h-4 text-yellow-600" />
          <h3 className="font-semibold text-sm text-gray-900">Flow Triggers</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">
            {triggers.filter((t) => t.enabled).length} active
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
          Add Trigger
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
            <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
              {triggers.length > 0 ? (
                triggers.map((trigger) => <TriggerItem key={trigger.id} trigger={trigger} />)
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No triggers configured</p>
                  <p className="text-xs mt-1">Add triggers to define when this flow starts</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Trigger Dialog */}
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
                  <h3 className="text-lg font-semibold text-gray-900">Add Trigger</h3>
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
                      Trigger Type *
                    </label>
                    <select
                      value={newTrigger.type}
                      onChange={(e) =>
                        setNewTrigger({ ...newTrigger, type: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="keyword">Keyword - User types specific words</option>
                      <option value="welcome">Welcome - First message from new user</option>
                      <option value="button">Button - User clicks a button</option>
                      <option value="time">Time-based - Schedule at specific time</option>
                      <option value="event">Event - After specific action</option>
                      <option value="webhook">Webhook - External trigger</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {newTrigger.type === 'keyword' && 'Keywords (comma-separated) *'}
                      {newTrigger.type === 'welcome' && 'Welcome Message'}
                      {newTrigger.type === 'button' && 'Button ID *'}
                      {newTrigger.type === 'time' && 'Cron Expression *'}
                      {newTrigger.type === 'event' && 'Event Name *'}
                      {newTrigger.type === 'webhook' && 'Webhook Path *'}
                    </label>
                    <Input
                      value={newTrigger.value}
                      onChange={(e) => setNewTrigger({ ...newTrigger, value: e.target.value })}
                      placeholder={
                        newTrigger.type === 'keyword'
                          ? 'hi, hello, start, help'
                          : newTrigger.type === 'time'
                          ? '0 9 * * *'
                          : newTrigger.type === 'button'
                          ? 'btn_book_appointment'
                          : ''
                      }
                    />
                    {newTrigger.type === 'keyword' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Flow will trigger when user sends any of these words
                      </p>
                    )}
                    {newTrigger.type === 'time' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Use cron syntax: minute hour day month weekday
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-10)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newTrigger.priority}
                      onChange={(e) =>
                        setNewTrigger({ ...newTrigger, priority: parseInt(e.target.value) })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher priority triggers are checked first
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={newTrigger.description}
                      onChange={(e) =>
                        setNewTrigger({ ...newTrigger, description: e.target.value })
                      }
                      placeholder="Optional description"
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
                  <Button onClick={handleAddTrigger} className="flex-1" disabled={!newTrigger.value}>
                    Add Trigger
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Trigger Dialog */}
      <AnimatePresence>
        {editingTrigger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingTrigger(null)}
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
                  <h3 className="text-lg font-semibold text-gray-900">Edit Trigger</h3>
                  <button
                    onClick={() => setEditingTrigger(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <Input
                      value={editingTrigger.value}
                      onChange={(e) =>
                        setEditingTrigger({ ...editingTrigger, value: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-10)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={editingTrigger.priority}
                      onChange={(e) =>
                        setEditingTrigger({
                          ...editingTrigger,
                          priority: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={editingTrigger.description}
                      onChange={(e) =>
                        setEditingTrigger({ ...editingTrigger, description: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTrigger(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTrigger} className="flex-1">
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
