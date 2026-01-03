import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';
import { FlowNode, Connection } from './NodeTypes';

interface FlowSimulatorProps {
  nodes: FlowNode[];
  connections: Connection[];
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  buttons?: Array<{ id: string; text: string }>;
  timestamp: Date;
}

export const FlowSimulator: React.FC<FlowSimulatorProps> = ({ nodes, connections, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState('');

  const startSimulation = () => {
    setIsRunning(true);
    setMessages([]);
    const startNode = nodes.find((n) => n.type === 'START');
    if (startNode) {
      executeNode(startNode.id);
    }
  };

  const executeNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setCurrentNodeId(nodeId);

    // Execute based on node type
    switch (node.type) {
      case 'START':
        // Move to next node
        const nextConnection = connections.find((c) => c.from === nodeId);
        if (nextConnection) {
          setTimeout(() => executeNode(nextConnection.to), 500);
        }
        break;

      case 'MESSAGE':
        // Send message
        if (node.data.message) {
          const botMessage: Message = {
            id: `msg_${Date.now()}`,
            type: 'bot',
            content: node.data.message,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);

          // Move to next node
          const nextConn = connections.find((c) => c.from === nodeId);
          if (nextConn) {
            setTimeout(() => executeNode(nextConn.to), 1000);
          } else {
            setIsRunning(false);
          }
        }
        break;

      case 'BUTTONS':
        // Send buttons
        if (node.data.message && node.data.buttons) {
          const botMessage: Message = {
            id: `msg_${Date.now()}`,
            type: 'bot',
            content: node.data.message,
            buttons: node.data.buttons,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          // Wait for user interaction
        }
        break;

      case 'DELAY':
        // Wait
        const duration = (node.data.delayConfig?.duration || 1) * 1000;
        const loadingMessage: Message = {
          id: `msg_${Date.now()}`,
          type: 'bot',
          content: `⏱️ Waiting ${node.data.delayConfig?.duration || 1} ${node.data.delayConfig?.unit || 'seconds'}...`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, loadingMessage]);

        setTimeout(() => {
          const nextConn = connections.find((c) => c.from === nodeId);
          if (nextConn) {
            executeNode(nextConn.to);
          }
        }, duration);
        break;

      case 'END':
        // End conversation
        if (node.data.endMessage) {
          const botMessage: Message = {
            id: `msg_${Date.now()}`,
            type: 'bot',
            content: node.data.endMessage,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
        }
        setIsRunning(false);
        setCurrentNodeId(null);
        break;

      default:
        // For other node types, just continue
        const defaultConn = connections.find((c) => c.from === nodeId);
        if (defaultConn) {
          setTimeout(() => executeNode(defaultConn.to), 500);
        } else {
          setIsRunning(false);
        }
        break;
    }
  };

  const handleButtonClick = (buttonId: string) => {
    if (!currentNodeId) return;

    const node = nodes.find((n) => n.id === currentNodeId);
    if (!node || !node.data.buttons) return;

    const button = node.data.buttons.find((b) => b.id === buttonId);
    if (!button) return;

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: button.text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Find connection for this button
    const connection = connections.find(
      (c) => c.from === currentNodeId && c.fromHandle === `button_${node.data.buttons?.indexOf(button)}`
    );

    if (connection) {
      setTimeout(() => executeNode(connection.to), 500);
    } else {
      setIsRunning(false);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');

    // Continue to next node
    if (currentNodeId) {
      const nextConnection = connections.find((c) => c.from === currentNodeId);
      if (nextConnection) {
        setTimeout(() => executeNode(nextConnection.to), 500);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
      >
        {/* Phone Frame */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-white text-xs mb-3">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 border border-white rounded-sm" />
              <div className="w-3 h-3 border border-white rounded-sm" />
            </div>
          </div>

          {/* Chat Header */}
          <div className="bg-green-600 rounded-t-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="text-white font-semibold">Bot Assistant</h3>
                <p className="text-green-100 text-xs">
                  {isRunning ? 'typing...' : 'online'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="bg-gray-100 h-96 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !isRunning && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-center mb-4">Test your bot flow in action</p>
                <button
                  onClick={startSimulation}
                  className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Start Simulation
                </button>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-green-500 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Buttons */}
                  {message.buttons && (
                    <div className="mt-3 space-y-2">
                      {message.buttons.map((button) => (
                        <button
                          key={button.id}
                          onClick={() => handleButtonClick(button.id)}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
                        >
                          {button.text}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isRunning && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="bg-white rounded-b-xl p-3 flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={!isRunning}
            />
            <button
              onClick={handleSendMessage}
              disabled={!isRunning || !userInput.trim()}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center">
          {!isRunning && messages.length > 0 && (
            <button
              onClick={startSimulation}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Restart Simulation
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
