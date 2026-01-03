import React from 'react';
import { Connection } from './NodeTypes';

interface ConnectionLineProps {
  connection: Connection;
  fromNode: { x: number; y: number };
  toNode: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  fromNode,
  toNode,
  isSelected,
  onClick,
  onDelete,
}) => {
  // Calculate control points for bezier curve
  const startX = fromNode.x + 128; // Center of node (width 256 / 2)
  const startY = fromNode.y + 180; // Bottom of node (approximate height)
  const endX = toNode.x + 128;
  const endY = toNode.y - 12; // Top handle position

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  // Control points for smooth S-curve
  const controlPoint1X = startX;
  const controlPoint1Y = startY + Math.abs(deltaY) * 0.5;
  const controlPoint2X = endX;
  const controlPoint2Y = endY - Math.abs(deltaY) * 0.5;

  // Create SVG path
  const pathData = `
    M ${startX} ${startY}
    C ${controlPoint1X} ${controlPoint1Y},
      ${controlPoint2X} ${controlPoint2Y},
      ${endX} ${endY}
  `;

  // Calculate arrow position (at 90% of the path)
  const arrowX = endX - deltaX * 0.1;
  const arrowY = endY - deltaY * 0.1;
  
  // Calculate arrow angle
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Calculate label position (at 50% of the path)
  const labelX = startX + deltaX * 0.5;
  const labelY = startY + deltaY * 0.5;

  const color = connection.labelColor || '#3b82f6';

  return (
    <g onClick={onClick} className="cursor-pointer group" style={{ pointerEvents: 'auto' }}>
      {/* Shadow for better visibility */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={isSelected ? 5 : 4}
        strokeDasharray="8 4"
        strokeLinecap="round"
        style={{ filter: 'blur(2px)' }}
      />
      
      {/* Main dotted path */}
      <path
        d={pathData}
        fill="none"
        stroke={isSelected ? '#ffffff' : color}
        strokeWidth={isSelected ? 4 : 3}
        strokeDasharray="10 5"
        strokeLinecap="round"
        className="transition-all duration-200"
        style={{
          filter: isSelected ? 'drop-shadow(0 0 8px rgba(59,130,246,0.8))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
        }}
      >
        {connection.animated && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="30"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Invisible thick path for easier clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
      />

      {/* Arrow head */}
      <g transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}>
        <path
          d="M 0 0 L -12 -6 L -12 6 Z"
          fill={isSelected ? '#ffffff' : color}
          className="transition-all duration-200"
        />
      </g>

      {/* Label */}
      {connection.label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          {/* Label background */}
          <rect
            x={-40}
            y={-12}
            width={80}
            height={24}
            rx={12}
            fill={isSelected ? '#ffffff' : color}
            className="transition-all duration-200"
          />
          {/* Label text */}
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill={isSelected ? color : '#ffffff'}
            fontSize={12}
            fontWeight="600"
            className="transition-all duration-200 select-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Delete button (appears on hover) */}
      <g
        transform={`translate(${labelX}, ${labelY})`}
        opacity={0}
        className="group-hover:opacity-100 transition-opacity duration-200"
      >
        <circle
          cx={connection.label ? 50 : 0}
          cy={0}
          r={12}
          fill="#ef4444"
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
        <text
          x={connection.label ? 50 : 0}
          y={4}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={14}
          fontWeight="bold"
          className="pointer-events-none select-none"
        >
          ×
        </text>
      </g>
    </g>
  );
};
