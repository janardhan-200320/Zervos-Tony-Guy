import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Zap,
  Database,
  Plus,
  Edit2,
  Trash2,
  Globe,
  User,
  Clock,
  MessageCircle,
  MousePointerClick,
} from 'lucide-react';
import { FlowTrigger } from './TriggerManager';

interface LeftSidebarPanelsProps {
  triggers: FlowTrigger[];
  variables: Array<{ name: string; type: string; scope: string; value?: any }>;
  onAddTrigger: () => void;
  onEditTrigger: (trigger: FlowTrigger) => void;
  onDeleteTrigger: (triggerId: string) => void;
  onAddVariable: () => void;
  onEditVariable: (variable: any) => void;
  onDeleteVariable: (variableName: string) => void;
}

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  welcome: <MessageCircle className="w-4 h-4" />,
  keyword: <Zap className="w-4 h-4" />,
  button_click: <MousePointerClick className="w-4 h-4" />,
  webhook: <Globe className="w-4 h-4" />,
  time_based: <Clock className="w-4 h-4" />,
  event_based: <Zap className="w-4 h-4" />,
};

const VARIABLE_ICONS: Record<string, React.ReactNode> = {
  system: <Globe className="w-3.5 h-3.5" />,
  session: <Clock className="w-3.5 h-3.5" />,
  user: <User className="w-3.5 h-3.5" />,
  global: <Database className="w-3.5 h-3.5" />,
};

const VARIABLE_COLORS: Record<string, string> = {
  system: '#6366f1',
  session: '#f59e0b',
  user: '#8b5cf6',
  global: '#10b981',
};

export const LeftSidebarPanels: React.FC<LeftSidebarPanelsProps> = ({
  triggers,
  variables,
  onAddTrigger,
  onEditTrigger,
  onDeleteTrigger,
  onAddVariable,
  onEditVariable,
  onDeleteVariable,
}) => {
  const [triggersExpanded, setTriggersExpanded] = useState(true);
  const [variablesExpanded, setVariablesExpanded] = useState(true);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Triggers Panel */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setTriggersExpanded(!triggersExpanded)}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          
          <div className="flex-1 text-left">
            <div className="font-semibold text-sm text-gray-900">Triggers</div>
            <div className="text-xs text-gray-500">{triggers.length} active</div>
          </div>

          {triggersExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {triggersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4"
            >
              {/* Add Trigger Button */}
              <button
                onClick={onAddTrigger}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-colors text-sm font-medium text-gray-600 hover:text-amber-700"
              >
                <Plus className="w-4 h-4" />
                Add Trigger
              </button>

              {/* Trigger List */}
              <div className="space-y-2">
                {triggers.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No triggers configured yet
                  </div>
                ) : (
                  triggers.map((trigger) => (
                    <motion.div
                      key={trigger.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600">
                        {TRIGGER_ICONS[trigger.type] || <Zap className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {trigger.value || trigger.type}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {trigger.description || trigger.type.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTrigger(trigger);
                          }}
                          className="p-1 hover:bg-amber-200 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrigger(trigger.id);
                          }}
                          className="p-1 hover:bg-red-200 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Trigger Type Info */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Triggers</strong> determine when your bot flow starts. Configure welcome
                  messages, keywords, webhooks, or time-based events.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Variables Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <button
          onClick={() => setVariablesExpanded(!variablesExpanded)}
          className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-200"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          
          <div className="flex-1 text-left">
            <div className="font-semibold text-sm text-gray-900">Variables</div>
            <div className="text-xs text-gray-500">{variables.length} defined</div>
          </div>

          {variablesExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {variablesExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {/* Add Variable Button */}
                <button
                  onClick={onAddVariable}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-sm font-medium text-gray-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Variable
                </button>

                {/* Variable List */}
                <div className="space-y-2">
                  {variables.length === 0 ? (
                    <div className="text-xs text-gray-500 text-center py-4">
                      No variables defined yet
                    </div>
                  ) : (
                    variables.map((variable, index) => (
                      <motion.div
                        key={variable.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="group flex items-start gap-2 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${VARIABLE_COLORS[variable.scope]}20` }}
                        >
                          <div style={{ color: VARIABLE_COLORS[variable.scope] }}>
                            {VARIABLE_ICONS[variable.scope]}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 font-mono truncate">
                            {'{{'}
                            {variable.name}
                            {'}}'}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: `${VARIABLE_COLORS[variable.scope]}20`,
                                color: VARIABLE_COLORS[variable.scope],
                              }}
                            >
                              {variable.scope}
                            </span>
                            <span className="text-xs text-gray-500">{variable.type}</span>
                          </div>
                          {variable.value !== undefined && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              Default: {String(variable.value)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditVariable(variable);
                            }}
                            className="p-1 hover:bg-purple-200 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          {variable.scope !== 'system' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteVariable(variable.name);
                              }}
                              className="p-1 hover:bg-red-200 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Variable Info Footer */}
              <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="space-y-2 text-xs">
                  <p className="font-semibold text-purple-900">Variable Scopes:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-gray-700">
                        <strong>System:</strong> Read-only system values
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-gray-700">
                        <strong>Session:</strong> Current conversation
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-gray-700">
                        <strong>User:</strong> Persistent user data
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-700">
                        <strong>Global:</strong> Shared across all users
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
