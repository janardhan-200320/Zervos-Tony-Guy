// Node Type Definitions for WhatsApp Bot Flow Builder
export interface NodeType {
  type: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  category: 'trigger' | 'message' | 'interaction' | 'logic' | 'action' | 'end';
  maxOutputs?: number; // undefined = unlimited
  hasInput?: boolean; // if false, cannot be connected to
  hasOutput?: boolean; // if false, cannot connect from
  outputLabels?: string[]; // custom labels for outputs
  badge?: string; // optional badge text
}

export const NODE_TYPES: Record<string, NodeType> = {
  START: {
    type: 'START',
    label: 'Start',
    icon: '🎯',
    color: '#10b981',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Entry point for the conversation flow',
    category: 'trigger',
    maxOutputs: 1,
    hasInput: false,
    hasOutput: true,
    badge: 'ENTRY',
  },
  MESSAGE: {
    type: 'MESSAGE',
    label: 'Send Message',
    icon: '💬',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-blue-600',
    description: 'Send a text message to the user',
    category: 'message',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
  },
  MEDIA_MESSAGE: {
    type: 'MEDIA_MESSAGE',
    label: 'Media Message',
    icon: '🖼️',
    color: '#7c3aed',
    gradient: 'from-purple-600 to-violet-700',
    description: 'Send image, video, or document',
    category: 'message',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
  },
  TEMPLATE_MESSAGE: {
    type: 'TEMPLATE_MESSAGE',
    label: 'Template Message',
    icon: '📄',
    color: '#0891b2',
    gradient: 'from-cyan-600 to-teal-700',
    description: 'Send WhatsApp approved template',
    category: 'message',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
    badge: 'APPROVED',
  },
  BUTTONS: {
    type: 'BUTTONS',
    label: 'Button Menu',
    icon: '🔘',
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Send up to 3 clickable buttons',
    category: 'interaction',
    maxOutputs: 3,
    hasInput: true,
    hasOutput: true,
    badge: 'MAX 3',
  },
  QUICK_REPLY: {
    type: 'QUICK_REPLY',
    label: 'Quick Reply',
    icon: '⚡',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Send quick reply chips',
    category: 'interaction',
    maxOutputs: 10,
    hasInput: true,
    hasOutput: true,
  },
  LIST: {
    type: 'LIST',
    label: 'List Menu',
    icon: '📋',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    description: 'Send a menu with sections and options',
    category: 'interaction',
    hasInput: true,
    hasOutput: true,
  },
  CONDITION: {
    type: 'CONDITION',
    label: 'Condition Branch',
    icon: '🔀',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Branch the flow based on conditions',
    category: 'logic',
    hasInput: true,
    hasOutput: true,
    outputLabels: ['IF', 'ELSE'],
  },
  API_CALL: {
    type: 'API_CALL',
    label: 'API Integration',
    icon: '🔌',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Call external API and store response',
    category: 'action',
    maxOutputs: 2,
    hasInput: true,
    hasOutput: true,
    outputLabels: ['SUCCESS', 'ERROR'],
  },
  DATA_CAPTURE: {
    type: 'DATA_CAPTURE',
    label: 'Capture Input',
    icon: '📝',
    color: '#14b8a6',
    gradient: 'from-teal-500 to-cyan-600',
    description: 'Capture and validate user input',
    category: 'action',
    maxOutputs: 2,
    hasInput: true,
    hasOutput: true,
    outputLabels: ['VALID', 'INVALID'],
  },
  DELAY: {
    type: 'DELAY',
    label: 'Delay/Wait',
    icon: '⏱️',
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    description: 'Wait before continuing the flow',
    category: 'action',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
  },
  ASSIGN_AGENT: {
    type: 'ASSIGN_AGENT',
    label: 'Assign Agent',
    icon: '👤',
    color: '#8b5cf6',
    gradient: 'from-violet-600 to-purple-700',
    description: 'Transfer to human agent',
    category: 'action',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
  },
  ADD_TAG: {
    type: 'ADD_TAG',
    label: 'Add/Remove Tag',
    icon: '🏷️',
    color: '#10b981',
    gradient: 'from-emerald-500 to-green-600',
    description: 'Tag or untag the contact',
    category: 'action',
    maxOutputs: 1,
    hasInput: true,
    hasOutput: true,
  },
  LOOP: {
    type: 'LOOP',
    label: 'Loop',
    icon: '🔄',
    color: '#84cc16',
    gradient: 'from-lime-500 to-green-600',
    description: 'Repeat actions for a set of items',
    category: 'logic',
    maxOutputs: 2,
    hasInput: true,
    hasOutput: true,
    outputLabels: ['CONTINUE', 'EXIT'],
  },
  END: {
    type: 'END',
    label: 'End Flow',
    icon: '🏁',
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
    description: 'Complete the conversation',
    category: 'end',
    maxOutputs: 0,
    hasInput: true,
    hasOutput: false,
  },
};

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    message?: string;
    buttons?: Array<{ id: string; text: string; nextNodeId?: string }>;
    listSections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string; nextNodeId?: string }>;
    }>;
    conditions?: Array<{
      id: string;
      variable: string;
      operator: string;
      value: string;
      nextNodeId?: string;
    }>;
    apiConfig?: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: string;
      successNodeId?: string;
      errorNodeId?: string;
    };
    captureConfig?: {
      variable: string;
      prompt: string;
      validationType?: 'text' | 'number' | 'email' | 'phone';
      validationPattern?: string;
      validNodeId?: string;
      invalidNodeId?: string;
    };
    delayConfig?: {
      duration: number;
      unit: 'seconds' | 'minutes' | 'hours';
    };
    loopConfig?: {
      arrayVariable: string;
      itemVariable: string;
      continueNodeId?: string;
      exitNodeId?: string;
    };
    endMessage?: string;
    endAction?: 'close' | 'handover' | 'wait';
  };
  nextNodeId?: string;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface Connection {
  id: string;
  from: string; // node id
  to: string; // node id
  fromHandle?: string; // for multi-output nodes
  toHandle?: string;
  label?: string;
  labelColor?: string;
  animated?: boolean;
}

export interface BotFlowData {
  nodes: FlowNode[];
  connections: Connection[];
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    defaultValue?: any;
    description?: string;
    scope: 'global' | 'session' | 'user';
  }>;
  triggers: Array<{
    id: string;
    type: 'keyword' | 'welcome' | 'button' | 'time' | 'event' | 'webhook';
    value: string;
    description?: string;
    enabled: boolean;
    priority: number;
  }>;
  version: number;
  lastModified: string;
}

// Validation helpers
export const validateNode = (node: FlowNode): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (node.type) {
    case 'START':
      if (!node.nextNodeId) warnings.push('Start node has no connection');
      break;
    case 'MESSAGE':
      if (!node.data.message) errors.push('Message content is required');
      if (!node.nextNodeId) warnings.push('Message has no next step');
      break;
    case 'BUTTONS':
      if (!node.data.message) errors.push('Button message is required');
      if (!node.data.buttons || node.data.buttons.length === 0) errors.push('At least one button is required');
      if (node.data.buttons && node.data.buttons.length > 3) errors.push('Maximum 3 buttons allowed');
      node.data.buttons?.forEach((btn, idx) => {
        if (!btn.text) errors.push(`Button ${idx + 1} text is required`);
        if (!btn.nextNodeId) warnings.push(`Button "${btn.text}" has no connection`);
      });
      break;
    case 'LIST':
      if (!node.data.message) errors.push('List message is required');
      if (!node.data.listSections || node.data.listSections.length === 0) {
        errors.push('At least one list section is required');
      }
      break;
    case 'CONDITION':
      if (!node.data.conditions || node.data.conditions.length === 0) {
        errors.push('At least one condition is required');
      }
      break;
    case 'API_CALL':
      if (!node.data.apiConfig?.url) errors.push('API URL is required');
      if (!node.data.apiConfig?.method) errors.push('HTTP method is required');
      break;
    case 'DATA_CAPTURE':
      if (!node.data.captureConfig?.variable) errors.push('Variable name is required');
      if (!node.data.captureConfig?.prompt) errors.push('Capture prompt is required');
      break;
    case 'DELAY':
      if (!node.data.delayConfig?.duration) errors.push('Delay duration is required');
      break;
    case 'LOOP':
      if (!node.data.loopConfig?.arrayVariable) errors.push('Array variable is required');
      break;
    case 'END':
      // End nodes are always valid
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Get output handles for a node
export const getNodeOutputs = (node: FlowNode): Array<{ id: string; label: string; color: string }> => {
  const outputs: Array<{ id: string; label: string; color: string }> = [];

  switch (node.type) {
    case 'START':
    case 'MESSAGE':
    case 'DELAY':
      outputs.push({ id: 'default', label: 'Next', color: '#3b82f6' });
      break;
    case 'BUTTONS':
      node.data.buttons?.forEach((btn, idx) => {
        outputs.push({ id: `button_${idx}`, label: btn.text, color: '#8b5cf6' });
      });
      break;
    case 'LIST':
      node.data.listSections?.forEach((section) => {
        section.rows.forEach((row) => {
          outputs.push({ id: `list_${row.id}`, label: row.title, color: '#ec4899' });
        });
      });
      break;
    case 'CONDITION':
      node.data.conditions?.forEach((cond, idx) => {
        outputs.push({ id: `condition_${idx}`, label: `If ${cond.variable} ${cond.operator} ${cond.value}`, color: '#f59e0b' });
      });
      outputs.push({ id: 'else', label: 'Else', color: '#6b7280' });
      break;
    case 'API_CALL':
      outputs.push({ id: 'success', label: 'Success', color: '#10b981' });
      outputs.push({ id: 'error', label: 'Error', color: '#ef4444' });
      break;
    case 'DATA_CAPTURE':
      outputs.push({ id: 'valid', label: 'Valid', color: '#10b981' });
      outputs.push({ id: 'invalid', label: 'Invalid', color: '#ef4444' });
      break;
    case 'LOOP':
      outputs.push({ id: 'continue', label: 'Continue Loop', color: '#84cc16' });
      outputs.push({ id: 'exit', label: 'Exit Loop', color: '#6b7280' });
      break;
    case 'END':
      // No outputs
      break;
  }

  return outputs;
};
