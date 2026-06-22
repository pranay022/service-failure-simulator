import React from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from 'reactflow';


export const DependencyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}) => {
  let edgePath = '';

  const dx = Math.abs(sourceX - targetX);

  if (dx < 30) {
    // Vertically aligned (or nearly so): arc to the right to avoid overlapping nodes
    const offset = 80; // How far the curve bows out to the right
    const midY = (sourceY + targetY) / 2;

    // Cubic Bezier: M startX startY C controlX controlY1, controlX controlY2, endX endY
    edgePath = `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY + (midY - sourceY) * 0.5}, ${targetX + offset} ${targetY - (targetY - midY) * 0.5}, ${targetX} ${targetY}`;
  } else {
    // Standard Bezier path for diagonally-offset nodes
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetPosition,
      targetX,
      targetY,
    });
    edgePath = path;
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={style}
    />
  );
};

export default DependencyEdge;
