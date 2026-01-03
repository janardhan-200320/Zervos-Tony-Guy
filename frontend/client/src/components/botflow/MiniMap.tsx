import React from 'react';
import { FlowNode, Connection, NODE_TYPES } from './NodeTypes';

interface MiniMapProps {
  nodes: FlowNode[];
  connections: Connection[];
  viewport: { x: number; y: number; scale: number };
  canvasSize: { width: number; height: number };
}

export const MiniMap: React.FC<MiniMapProps> = ({ nodes, connections, viewport, canvasSize }) => {
  const minimapWidth = 200;
  const minimapHeight = 150;
  const scaleFactor = 0.05; // Scale down the entire canvas

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-700">Mini Map</h3>
      </div>
      <div className="p-2">
        <svg
          width={minimapWidth}
          height={minimapHeight}
          className="bg-gray-100 rounded"
        >
          {/* Connections */}
          {connections.map((connection) => {
            const fromNode = nodes.find((n) => n.id === connection.from);
            const toNode = nodes.find((n) => n.id === connection.to);
            if (!fromNode || !toNode) return null;

            const x1 = fromNode.position.x * scaleFactor;
            const y1 = fromNode.position.y * scaleFactor;
            const x2 = toNode.position.x * scaleFactor;
            const y2 = toNode.position.y * scaleFactor;

            return (
              <line
                key={connection.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const nodeType = NODE_TYPES[node.type];
            const x = node.position.x * scaleFactor;
            const y = node.position.y * scaleFactor;
            const width = 256 * scaleFactor;
            const height = 120 * scaleFactor;

            return (
              <rect
                key={node.id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={nodeType.color}
                rx={2}
                className="opacity-80"
              />
            );
          })}

          {/* Viewport indicator */}
          <rect
            x={-viewport.x * scaleFactor}
            y={-viewport.y * scaleFactor}
            width={(canvasSize.width / viewport.scale) * scaleFactor}
            height={(canvasSize.height / viewport.scale) * scaleFactor}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            className="pointer-events-none"
          />
        </svg>
      </div>
    </div>
  );
};
