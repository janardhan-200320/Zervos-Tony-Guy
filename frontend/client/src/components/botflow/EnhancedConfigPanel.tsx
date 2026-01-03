import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Smartphone,
  ChevronDown,
  Save,
  Eye,
  Code,
} from 'lucide-react';
import { FlowNode, NODE_TYPES, validateNode } from './NodeTypes';

interface EnhancedConfigPanelProps {
  node: FlowNode;
  onClose: () => void;
  onUpdate: (updates: Partial<FlowNode>) => void;
  variables?: Array<{ name: string; scope: string }>;
}

export const EnhancedConfigPanel: React.FC<EnhancedConfigPanelProps> = ({
  node,
  onClose,
  onUpdate,
  variables = [],
}) => {
  const [editedData, setEditedData] = useState(node.data);
  const [showPreview, setShowPreview] = useState(true);
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  
  const nodeType = NODE_TYPES[node.type];
  const validation = validateNode({ ...node, data: editedData });

  const handleSave = () => {
    if (validation.isValid) {
      onUpdate({ data: editedData });
      onClose();
    }
  };

  const insertVariable = (variableName: string) => {
    // Insert variable at cursor position for message field
    const variableTag = `{{${variableName}}}`;
    const currentMessage = (editedData.message || '') as string;
    setEditedData({ ...editedData, message: currentMessage + variableTag });
    setShowVariablePicker(false);
  };

  // WhatsApp Preview Component
  const WhatsAppPreview = () => {
    const message = (editedData.message || 'Your message will appear here...') as string;
    const buttons = editedData.buttons as Array<{ text: string }> | undefined;

    return (
      <div className="bg-gradient-to-b from-teal-100 to-teal-50 rounded-lg p-4 h-full max-h-[500px] overflow-y-auto">
        {/* WhatsApp Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-teal-200">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Your Bot</div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
        </div>

        {/* Message Bubble */}
        <div className="flex justify-start mb-2">
          <div className="max-w-[85%]">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {message}
              </p>
              <div className="text-xs text-gray-400 mt-1 text-right">12:34 PM</div>
            </div>

            {/* Buttons Preview */}
            {node.type === 'BUTTONS' && buttons && buttons.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    className="w-full px-4 py-2.5 bg-white rounded-lg border-2 border-teal-500 text-teal-600 font-medium text-sm hover:bg-teal-50 transition-colors"
                  >
                    {btn.text || `Button ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* List Preview */}
            {node.type === 'LIST' && editedData.listSections && (
              <button className="mt-2 w-full px-4 py-3 bg-white rounded-lg border-2 border-teal-500 text-teal-600 font-medium text-sm flex items-center justify-between">
                <span>View Menu</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${nodeType.gradient} p-5 text-white`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-3xl">{nodeType.icon}</span>
            <div>
              <h2 className="text-lg font-bold">{nodeType.label}</h2>
              <p className="text-sm text-white/90">{nodeType.description}</p>
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
        {validation.errors.length > 0 && (
          <div className="space-y-1">
            {validation.errors.map((error, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm bg-red-500/30 rounded px-3 py-1.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="space-y-1 mt-2">
            {validation.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm bg-yellow-500/30 rounded px-3 py-1.5"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {validation.isValid && validation.warnings.length === 0 && (
          <div className="flex items-center gap-2 text-sm bg-green-500/30 rounded px-3 py-1.5">
            <Check className="w-4 h-4" />
            <span>Configuration is valid</span>
          </div>
        )}
      </div>

      {/* Preview Toggle */}
      {(node.type === 'MESSAGE' || node.type === 'BUTTONS' || node.type === 'LIST') && (
        <div className="border-b border-gray-200 px-5 py-3 bg-gray-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showPreview
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              WhatsApp Preview
            </button>
            <div className="text-xs text-gray-500">See how it looks to users</div>
          </div>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-0">
          {/* Configuration Form */}
          <div className="p-5 space-y-5">
            {/* MESSAGE Node */}
            {node.type === 'MESSAGE' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Message Text *
                  </label>
                  <textarea
                    value={(editedData.message as string) || ''}
                    onChange={(e) => setEditedData({ ...editedData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    placeholder="Type your message here..."
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Use {'{variable}'} for personalization</p>
                    <button
                      onClick={() => setShowVariablePicker(!showVariablePicker)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      Insert Variable
                    </button>
                  </div>

                  {/* Variable Picker */}
                  {showVariablePicker && variables.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        Available Variables:
                      </div>
                      <div className="space-y-1">
                        {variables.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => insertVariable(v.name)}
                            className="w-full text-left px-2 py-1.5 text-xs font-mono bg-white hover:bg-blue-50 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            {'{{'}
                            {v.name}
                            {'}}'}
                            <span className="ml-2 text-gray-500">({v.scope})</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {/* BUTTONS Node */}
            {node.type === 'BUTTONS' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Button Message *
                  </label>
                  <textarea
                    value={(editedData.message as string) || ''}
                    onChange={(e) => setEditedData({ ...editedData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                    placeholder="What would you like to do?"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-gray-900">
                      Buttons (Max 3) *
                    </label>
                    <button
                      onClick={() => {
                        const buttons = editedData.buttons || [];
                        if ((buttons as Array<any>).length < 3) {
                          setEditedData({
                            ...editedData,
                            buttons: [
                              ...(buttons as Array<any>),
                              { id: `btn_${Date.now()}`, text: '' },
                            ],
                          });
                        }
                      }}
                      disabled={((editedData.buttons as Array<any>)?.length || 0) >= 3}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Button
                    </button>
                  </div>

                  <div className="space-y-2">
                    {((editedData.buttons || []) as Array<{ id: string; text: string }>).map(
                      (button, idx) => (
                        <div
                          key={button.id}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => {
                              const buttons = [
                                ...(editedData.buttons as Array<{ id: string; text: string }>) ||
                                  [],
                              ];
                              buttons[idx] = { ...buttons[idx], text: e.target.value };
                              setEditedData({ ...editedData, buttons });
                            }}
                            placeholder={`Button ${idx + 1} text`}
                            maxLength={20}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => {
                              const buttons = (
                                (editedData.buttons || []) as Array<any>
                              ).filter((_, i) => i !== idx);
                              setEditedData({ ...editedData, buttons });
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Add more node-specific configurations as needed */}
          </div>

          {/* WhatsApp Preview */}
          {showPreview && (node.type === 'MESSAGE' || node.type === 'BUTTONS' || node.type === 'LIST') && (
            <div className="p-5 bg-gray-100 border-t-4 border-teal-500">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Live Preview</h3>
              </div>
              <WhatsAppPreview />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 p-5 bg-gray-50 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!validation.isValid}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </motion.div>
  );
};
