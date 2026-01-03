import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { FlowNode, NODE_TYPES, validateNode } from './NodeTypes';

interface NodeEditorProps {
  node: FlowNode;
  onClose: () => void;
  onUpdate: (updates: Partial<FlowNode>) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, onClose, onUpdate }) => {
  const [editedData, setEditedData] = useState(node.data);
  const nodeType = NODE_TYPES[node.type];
  const validation = validateNode({ ...node, data: editedData });

  const handleSave = () => {
    if (validation.isValid) {
      onUpdate({ data: editedData });
    }
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: 'spring', damping: 30 }}
      className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-30 overflow-y-auto"
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${nodeType.gradient} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{nodeType.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{nodeType.label}</h2>
                <p className="text-sm text-white/80">{nodeType.description}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Status */}
        <div className="mt-4 space-y-1">
          {validation.errors.map((error, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm bg-red-500/20 rounded px-3 py-1">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ))}
          {validation.warnings.map((warning, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm bg-yellow-500/20 rounded px-3 py-1">
              <AlertCircle className="w-4 h-4" />
              <span>{warning}</span>
            </div>
          ))}
          {validation.isValid && validation.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-sm bg-green-500/20 rounded px-3 py-1">
              <Check className="w-4 h-4" />
              <span>Configuration is valid</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* MESSAGE Node */}
        {node.type === 'MESSAGE' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Message Text *
              </label>
              <textarea
                value={editedData.message || ''}
                onChange={(e) => setEditedData({ ...editedData, message: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use variables: {'{user_name}'}, {'{phone_number}'}
              </p>
            </div>
          </>
        )}

        {/* BUTTONS Node */}
        {node.type === 'BUTTONS' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Button Message *
              </label>
              <textarea
                value={editedData.message || ''}
                onChange={(e) => setEditedData({ ...editedData, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="What would you like to do?"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Buttons (Max 3) *
                </label>
                <button
                  onClick={() => {
                    const buttons = editedData.buttons || [];
                    if (buttons.length < 3) {
                      setEditedData({
                        ...editedData,
                        buttons: [...buttons, { id: `btn_${Date.now()}`, text: '' }],
                      });
                    }
                  }}
                  disabled={(editedData.buttons?.length || 0) >= 3}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                  Add Button
                </button>
              </div>

              <div className="space-y-2">
                {(editedData.buttons || []).map((button, idx) => (
                  <div key={button.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={button.text}
                      onChange={(e) => {
                        const buttons = [...(editedData.buttons || [])];
                        buttons[idx] = { ...buttons[idx], text: e.target.value };
                        setEditedData({ ...editedData, buttons });
                      }}
                      placeholder={`Button ${idx + 1} text`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => {
                        const buttons = (editedData.buttons || []).filter((_, i) => i !== idx);
                        setEditedData({ ...editedData, buttons });
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LIST Node */}
        {node.type === 'LIST' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                List Message *
              </label>
              <textarea
                value={editedData.message || ''}
                onChange={(e) => setEditedData({ ...editedData, message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Choose from our services..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                List Sections *
              </label>
              <button
                onClick={() => {
                  const sections = editedData.listSections || [];
                  setEditedData({
                    ...editedData,
                    listSections: [
                      ...sections,
                      { title: 'New Section', rows: [] },
                    ],
                  });
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>

              <div className="space-y-4 mt-4">
                {(editedData.listSections || []).map((section, sectionIdx) => (
                  <div key={sectionIdx} className="border border-gray-200 rounded-lg p-4">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const sections = [...(editedData.listSections || [])];
                        sections[sectionIdx] = { ...sections[sectionIdx], title: e.target.value };
                        setEditedData({ ...editedData, listSections: sections });
                      }}
                      placeholder="Section Title"
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-semibold"
                    />

                    <div className="space-y-2">
                      {section.rows.map((row, rowIdx) => (
                        <div key={row.id} className="flex gap-2">
                          <input
                            type="text"
                            value={row.title}
                            onChange={(e) => {
                              const sections = [...(editedData.listSections || [])];
                              sections[sectionIdx].rows[rowIdx] = {
                                ...sections[sectionIdx].rows[rowIdx],
                                title: e.target.value,
                              };
                              setEditedData({ ...editedData, listSections: sections });
                            }}
                            placeholder="Option title"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => {
                              const sections = [...(editedData.listSections || [])];
                              sections[sectionIdx].rows = sections[sectionIdx].rows.filter(
                                (_, i) => i !== rowIdx
                              );
                              setEditedData({ ...editedData, listSections: sections });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const sections = [...(editedData.listSections || [])];
                        sections[sectionIdx].rows.push({
                          id: `row_${Date.now()}`,
                          title: '',
                          description: '',
                        });
                        setEditedData({ ...editedData, listSections: sections });
                      }}
                      className="w-full mt-2 flex items-center justify-center gap-1 px-3 py-1 text-sm text-pink-600 border border-pink-300 rounded-lg hover:bg-pink-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Option
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* API_CALL Node */}
        {node.type === 'API_CALL' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                HTTP Method *
              </label>
              <select
                value={editedData.apiConfig?.method || 'GET'}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    apiConfig: { method: e.target.value, url: editedData.apiConfig?.url || '', ...editedData.apiConfig },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                API URL *
              </label>
              <input
                type="text"
                value={editedData.apiConfig?.url || ''}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    apiConfig: { method: editedData.apiConfig?.method || 'GET', url: e.target.value, ...editedData.apiConfig },
                  })
                }
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </>
        )}

        {/* DATA_CAPTURE Node */}
        {node.type === 'DATA_CAPTURE' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Variable Name *
              </label>
              <input
                type="text"
                value={editedData.captureConfig?.variable || ''}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    captureConfig: { variable: e.target.value, prompt: editedData.captureConfig?.prompt || '', ...editedData.captureConfig },
                  })
                }
                placeholder="user_email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prompt Message *
              </label>
              <textarea
                value={editedData.captureConfig?.prompt || ''}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    captureConfig: { variable: editedData.captureConfig?.variable || '', prompt: e.target.value, ...editedData.captureConfig },
                  })
                }
                rows={3}
                placeholder="Please enter your email address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Validation Type
              </label>
              <select
                value={editedData.captureConfig?.validationType || 'text'}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    captureConfig: {
                      variable: editedData.captureConfig?.variable || '',
                      prompt: editedData.captureConfig?.prompt || '',
                      validationType: e.target.value as any,
                      ...editedData.captureConfig,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="phone">Phone Number</option>
              </select>
            </div>
          </>
        )}

        {/* DELAY Node */}
        {node.type === 'DELAY' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration *
                </label>
                <input
                  type="number"
                  value={editedData.delayConfig?.duration || 0}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      delayConfig: {
                        duration: parseInt(e.target.value),
                        unit: editedData.delayConfig?.unit || 'seconds',
                        ...editedData.delayConfig,
                      },
                    })
                  }
                  min={0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={editedData.delayConfig?.unit || 'seconds'}
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      delayConfig: {
                        duration: editedData.delayConfig?.duration || 0,
                        unit: e.target.value as any,
                        ...editedData.delayConfig,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* END Node */}
        {node.type === 'END' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Message
              </label>
              <textarea
                value={editedData.endMessage || ''}
                onChange={(e) => setEditedData({ ...editedData, endMessage: e.target.value })}
                rows={3}
                placeholder="Thank you for chatting with us!"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Action
              </label>
              <select
                value={editedData.endAction || 'close'}
                onChange={(e) =>
                  setEditedData({ ...editedData, endAction: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="close">Close Conversation</option>
                <option value="handover">Handover to Human</option>
                <option value="wait">Wait for User</option>
              </select>
            </div>
          </>
        )}

        {/* Node Label (all types) */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Node Label (Optional)
          </label>
          <input
            type="text"
            value={editedData.label || ''}
            onChange={(e) => setEditedData({ ...editedData, label: e.target.value })}
            placeholder="Custom label for this node"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!validation.isValid}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </motion.div>
  );
};
