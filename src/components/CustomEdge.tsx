import React, { useState, useEffect } from "react";
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from "reactflow";
import { X } from "lucide-react";

export const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Debug: Log state changes
  useEffect(() => {
    console.log(`Edge ${id}: selected=${selected}, hovered=${isHovered}`);
  }, [selected, isHovered, id]);

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    console.log("Delete button clicked for edge:", id);
    const event = new CustomEvent("deleteEdge", { detail: { edgeId: id } });
    window.dispatchEvent(event);
  };

  // Determine stroke color based on priority: selected > hovered > default
  const strokeColor = selected ? "#ef4444" : isHovered ? "#10b981" : "#b1b1b7";
  const strokeWidth = selected || isHovered ? 4 : 2;

  console.log(
    `Rendering edge ${id}: color=${strokeColor}, width=${strokeWidth}`,
  );

  return (
    <g className="react-flow__edge">
      {/* Main visible edge path - RENDER FIRST */}
      <path
        id={`${id}-path`}
        d={edgePath}
        fill="none"
        className="react-flow__edge-path"
        style={{
          stroke: strokeColor, //  Inline style - overrides CSS
          strokeWidth: strokeWidth, //  Inline style - overrides CSS
          transition: "stroke 0.3s ease, stroke-width 0.3s ease",
          pointerEvents: "none",
        }}
      />

      {/* Invisible wider path for better hover/click detection - RENDER SECOND (on top) */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={30}
        stroke="transparent"
        onMouseEnter={() => {
          console.log("Mouse ENTER edge:", id);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          console.log("Mouse LEAVE edge:", id);
          setIsHovered(false);
        }}
        style={{
          cursor: "pointer",
          pointerEvents: "all",
        }}
        className="react-flow__edge-interaction"
      />

      {/* Delete button when selected */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            <button
              onClick={onEdgeClick}
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all hover:scale-110 flex items-center justify-center"
              title="Delete connection"
              style={{
                width: "32px",
                height: "32px",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
};
