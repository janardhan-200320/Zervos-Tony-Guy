import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection } from './NodeTypes';

interface EnhancedConnectionLineProps {
  connection: Connection;
  fromNode: { x: number; y: number; width?: number; height?: number };
  toNode: { x: number; y: number; width?: number; height?: number };
  isSelected: boolean;
  isHovered?: boolean;
  onClick: () => void;
  onDelete: () => void;
  onReconnect?: (isFromEnd: boolean) => void;
  onStartDragging?: (isFromEnd: boolean) => void;
  isDraggingEnd?: { from: boolean; to: boolean };
  connectionType?: 'success' | 'error' | 'condition' | 'default' | 'user-action';
  label?: string;
}

// Professional color scheme for different connection types
const CONNECTION_COLORS = {
  success: {
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    label: '#059669',
    particles: '#34d399',
  },
  error: {
    stroke: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    label: '#dc2626',
    particles: '#f87171',
  },
  condition: {
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    label: '#d97706',
    particles: '#fbbf24',
  },
  'user-action': {
    stroke: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    label: '#7c3aed',
    particles: '#a78bfa',
  },
  default: {
    stroke: '#6b7280',
    glow: 'rgba(107, 114, 128, 0.4)',
    label: '#4b5563',
    particles: '#9ca3af',
  },
};

export const EnhancedConnectionLine: React.FC<EnhancedConnectionLineProps> = ({
  connection,
  fromNode,
  toNode,
  isSelected,
  isHovered = false,
  onClick,
  onDelete,
  onReconnect,
  onStartDragging,
  isDraggingEnd,
  connectionType = 'default',
  label,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hoveringEnd, setHoveringEnd] = useState<'from' | 'to' | null>(null);
  
  // Calculate positions with proper node dimensions
  const nodeWidth = fromNode.width || 256;
  const nodeHeight = fromNode.height || 160;

  const startX = fromNode.x + nodeWidth / 2;
  const startY = fromNode.y + nodeHeight; // Bottom of source node
  const endX = toNode.x + (toNode.width || 256) / 2;
  const endY = toNode.y; // Top of target node

  const { pathData, labelPosition, arrowPosition, arrowAngle } = useMemo(() => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaY = Math.abs(deltaY);

    // Enhanced Bézier curve control points for smooth, natural-looking curves
    const verticalOffset = Math.max(absDeltaY * 0.6, 80);
    
    const controlPoint1X = startX + deltaX * 0.1;
    const controlPoint1Y = startY + verticalOffset;
    const controlPoint2X = endX - deltaX * 0.1;
    const controlPoint2Y = endY - verticalOffset;

    // Create smooth cubic Bézier curve
    const path = `
      M ${startX} ${startY}
      C ${controlPoint1X} ${controlPoint1Y},
        ${controlPoint2X} ${controlPoint2Y},
        ${endX} ${endY}
    `;

    // Calculate label position (center of curve)
    const t = 0.5;
    const labelX = 
      Math.pow(1 - t, 3) * startX +
      3 * Math.pow(1 - t, 2) * t * controlPoint1X +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2X +
      Math.pow(t, 3) * endX;
    
    const labelY = 
      Math.pow(1 - t, 3) * startY +
      3 * Math.pow(1 - t, 2) * t * controlPoint1Y +
      3 * (1 - t) * Math.pow(t, 2) * controlPoint2Y +
      Math.pow(t, 3) * endY;

    // Calculate arrow position (at 95% of path)
    const t2 = 0.95;
    const arrowX =
      Math.pow(1 - t2, 3) * startX +
      3 * Math.pow(1 - t2, 2) * t2 * controlPoint1X +
      3 * (1 - t2) * Math.pow(t2, 2) * controlPoint2X +
      Math.pow(t2, 3) * endX;
    
    const arrowY =
      Math.pow(1 - t2, 3) * startY +
      3 * Math.pow(1 - t2, 2) * t2 * controlPoint1Y +
      3 * (1 - t2) * Math.pow(t2, 2) * controlPoint2Y +
      Math.pow(t2, 3) * endY;

    // Calculate tangent angle at arrow position
    const dx = 3 * (
      -Math.pow(1 - t2, 2) * startX +
      (3 * Math.pow(1 - t2, 2) - 6 * (1 - t2) * t2) * controlPoint1X +
      (6 * (1 - t2) * t2 - 3 * Math.pow(t2, 2)) * controlPoint2X +
      Math.pow(t2, 2) * endX
    );
    
    const dy = 3 * (
      -Math.pow(1 - t2, 2) * startY +
      (3 * Math.pow(1 - t2, 2) - 6 * (1 - t2) * t2) * controlPoint1Y +
      (6 * (1 - t2) * t2 - 3 * Math.pow(t2, 2)) * controlPoint2Y +
      Math.pow(t2, 2) * endY
    );

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    return {
      pathData: path,
      labelPosition: { x: labelX, y: labelY },
      arrowPosition: { x: arrowX, y: arrowY },
      arrowAngle: angle,
    };
  }, [startX, startY, endX, endY]);

  const colors = CONNECTION_COLORS[connectionType];
  const displayLabel = label || connection.label || '';
  const hovering = isHovering || isHovered || isSelected;

  // Generate flowing particles along the path
  const particles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      offset: (i / 8) * 100,
    }));
  }, []);

  return (
    <g 
      onMouseEnter={() => {
        setIsHovering(true);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowActions(false);
      }}
      onClick={onClick} 
      className="cursor-pointer group" 
      style={{ pointerEvents: 'all' }}
    >
      {/* Glow effect when hovered or selected */}
      {hovering && (
        <motion.path
          d={pathData}
          fill="none"
          stroke={colors.glow}
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.2 }}
          style={{ filter: 'blur(12px)', pointerEvents: 'none' }}
        />
      )}

      {/* Shadow for depth */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0, 0, 0, 0.08)"
        strokeWidth={isSelected ? 4 : 3}
        strokeDasharray="8 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ 
          filter: 'blur(2px)',
          transform: 'translate(0, 2px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main smooth curved line */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={hovering ? '#3b82f6' : colors.stroke}
        strokeWidth={hovering ? 4 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300 cursor-grab active:cursor-grabbing"
        animate={{
          strokeWidth: hovering ? 4 : 2.5,
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseDown={(e) => {
          // Direct line dragging - determine which end is closer
          if (onStartDragging && !isSelected) {
            const svgPoint = (e.target as SVGPathElement).ownerSVGElement?.createSVGPoint();
            if (svgPoint) {
              svgPoint.x = e.clientX;
              svgPoint.y = e.clientY;
              
              // Calculate rough distance to both endpoints
              const distToStart = Math.hypot(startX - svgPoint.x / 10, startY - svgPoint.y / 10);
              const distToEnd = Math.hypot(endX - svgPoint.x / 10, endY - svgPoint.y / 10);
              
              // Drag the end that's closer
              onStartDragging(distToStart < distToEnd);
              e.stopPropagation();
            }
          }
        }}
        style={{
          filter: hovering 
            ? `drop-shadow(0 0 8px ${colors.glow})` 
            : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
          pointerEvents: 'stroke',
        }}
      />

      {/* Flowing particle dots animation */}
      {particles.map((particle) => (
        <motion.circle
          key={particle.id}
          r={hovering ? 3 : 2}
          fill={hovering ? '#3b82f6' : colors.particles}
          style={{
            offsetPath: `path('${pathData}')`,
            offsetDistance: `${particle.offset}%`,
            filter: `drop-shadow(0 0 ${hovering ? 6 : 3}px ${colors.particles})`,
          }}
          animate={{
            offsetDistance: ['0%', '100%'],
            opacity: [0.3, 1, 0.3],
            scale: hovering ? [1, 1.3, 1] : [1, 1.1, 1],
          }}
          transition={{
            offsetDistance: {
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: particle.id * 0.15,
            },
            opacity: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.id * 0.15,
            },
            scale: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: particle.id * 0.15,
            },
          }}
        />
      ))}

      {/* Invisible thick path for easier clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Directional arrow */}
      <motion.g
        transform={`translate(${arrowPosition.x}, ${arrowPosition.y}) rotate(${arrowAngle})`}
        animate={{
          scale: hovering ? 1.2 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <path
          d="M -6 -4 L 0 0 L -6 4"
          fill="none"
          stroke={hovering ? '#3b82f6' : colors.stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: hovering ? `drop-shadow(0 0 4px ${colors.glow})` : 'none',
          }}
        />
      </motion.g>

      {/* Label */}
      {displayLabel && (
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Label background */}
          <rect
            x={labelPosition.x - displayLabel.length * 3.5}
            y={labelPosition.y - 12}
            width={displayLabel.length * 7}
            height={20}
            rx={10}
            fill="white"
            stroke={hovering ? '#3b82f6' : colors.stroke}
            strokeWidth={2}
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            }}
          />
          {/* Label text */}
          <text
            x={labelPosition.x}
            y={labelPosition.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={hovering ? '#3b82f6' : colors.label}
            fontSize="12"
            fontWeight="600"
            pointerEvents="none"
          >
            {displayLabel}
          </text>
        </motion.g>
      )}

      {/* Dual endpoint handles - appear when connection is selected */}
      <AnimatePresence>
        {isSelected && onStartDragging && (
          <>
            {/* FROM endpoint handle (source - green) */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <motion.circle
                cx={startX}
                cy={startY}
                r={14}
                fill="white"
                stroke={isDraggingEnd?.from ? "#059669" : "#10b981"}
                strokeWidth={3}
                className="cursor-move"
                onMouseEnter={() => setHoveringEnd('from')}
                onMouseLeave={() => setHoveringEnd(null)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDragging(true);
                }}
                whileHover={{ scale: 1.15, r: 16 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.5))',
                }}
              />
              {/* From indicator icon */}
              <motion.g
                transform={`translate(${startX - 5}, ${startY - 5})`}
                pointerEvents="none"
              >
                <path
                  d="M 5 2 L 5 8 M 2 5 L 5 2 L 8 5"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
              {hoveringEnd === 'from' && (
                <motion.text
                  x={startX}
                  y={startY - 25}
                  textAnchor="middle"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: -25 }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    fill: '#10b981',
                    pointerEvents: 'none',
                  }}
                >
                  Drag Source
                </motion.text>
              )}
            </motion.g>

            {/* TO endpoint handle (target - blue) */}
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.05 }}
            >
              <motion.circle
                cx={endX}
                cy={endY}
                r={14}
                fill="white"
                stroke={isDraggingEnd?.to ? "#2563eb" : "#3b82f6"}
                strokeWidth={3}
                className="cursor-move"
                onMouseEnter={() => setHoveringEnd('to')}
                onMouseLeave={() => setHoveringEnd(null)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onStartDragging(false);
                }}
                whileHover={{ scale: 1.15, r: 16 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.5))',
                }}
              />
              {/* To indicator icon */}
              <motion.g
                transform={`translate(${endX - 5}, ${endY - 5})`}
                pointerEvents="none"
              >
                <path
                  d="M 5 8 L 5 2 M 2 5 L 5 8 L 8 5"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.g>
              {hoveringEnd === 'to' && (
                <motion.text
                  x={endX}
                  y={endY + 35}
                  textAnchor="middle"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 35 }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    fill: '#3b82f6',
                    pointerEvents: 'none',
                  }}
                >
                  Drag Target
                </motion.text>
              )}
            </motion.g>
          </>
        )}
      </AnimatePresence>

      {/* Quick reconnection handle at midpoint - appears on hover (when NOT selected) */}
      <AnimatePresence>
        {hovering && !isSelected && onStartDragging && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.circle
              cx={labelPosition.x}
              cy={labelPosition.y}
              r={12}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={3}
              className="cursor-move"
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartDragging(false);
              }}
              whileHover={{ scale: 1.2, r: 14 }}
              whileTap={{ scale: 0.9 }}
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.4))',
              }}
            />
            <motion.g
              transform={`translate(${labelPosition.x - 6}, ${labelPosition.y - 6})`}
              pointerEvents="none"
            >
              <path
                d="M 2 4 L 10 4 M 2 7 L 10 7 M 2 10 L 10 10"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Delete button */}
      <AnimatePresence>
        {showActions && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.05 }}
          >
            <motion.circle
              cx={labelPosition.x + 25}
              cy={labelPosition.y - 25}
              r={10}
              fill="#ef4444"
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              whileHover={{ scale: 1.2, r: 12 }}
              whileTap={{ scale: 0.9 }}
              style={{
                filter: 'drop-shadow(0 2px 8px rgba(239, 68, 68, 0.4))',
              }}
            />
            {/* X icon */}
            <motion.g
              transform={`translate(${labelPosition.x + 25}, ${labelPosition.y - 25})`}
              pointerEvents="none"
            >
              <path
                d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
};
