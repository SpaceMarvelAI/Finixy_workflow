import React, { useRef, useEffect } from "react";
import { useNodes, useEdges, useViewport } from "reactflow";

// This component MUST be rendered as a child of <ReactFlow>
const MiniMapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const nodes = useNodes();
  const edges = useEdges();
  const { x: viewX, y: viewY, zoom } = useViewport();

  const MINIMAP_WIDTH = 240;
  const MINIMAP_HEIGHT = 160;

  useEffect(() => {
    // Safety check: ensure canvas is mounted
    if (!canvasRef.current) {
      console.warn("MiniMap canvas not mounted yet");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) {
      console.warn("MiniMap canvas context not available");
      return;
    }

    try {
      // Clear canvas
      ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

      // Create rounded rectangle path for clipping
      const cornerRadius = 8;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cornerRadius, 0);
      ctx.lineTo(MINIMAP_WIDTH - cornerRadius, 0);
      ctx.quadraticCurveTo(MINIMAP_WIDTH, 0, MINIMAP_WIDTH, cornerRadius);
      ctx.lineTo(MINIMAP_WIDTH, MINIMAP_HEIGHT - cornerRadius);
      ctx.quadraticCurveTo(
        MINIMAP_WIDTH,
        MINIMAP_HEIGHT,
        MINIMAP_WIDTH - cornerRadius,
        MINIMAP_HEIGHT,
      );
      ctx.lineTo(cornerRadius, MINIMAP_HEIGHT);
      ctx.quadraticCurveTo(0, MINIMAP_HEIGHT, 0, MINIMAP_HEIGHT - cornerRadius);
      ctx.lineTo(0, cornerRadius);
      ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
      ctx.closePath();
      ctx.clip();

      // Background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, MINIMAP_HEIGHT);
      gradient.addColorStop(0, "#1f2937");
      gradient.addColorStop(1, "#111827");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

      ctx.restore();

      // Check if we have nodes
      if (!nodes || nodes.length === 0) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No nodes", MINIMAP_WIDTH / 2, MINIMAP_HEIGHT / 2);
        return;
      }

      // Calculate bounds
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      nodes.forEach((node) => {
        if (!node?.position) return;

        const x = node.position.x;
        const y = node.position.y;
        const w = (node as any).width || 280;
        const h = (node as any).height || 80;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      });

      // Add padding
      minX -= 50;
      minY -= 50;
      maxX += 50;
      maxY += 50;

      const workflowWidth = maxX - minX;
      const workflowHeight = maxY - minY;

      // Calculate scale
      const scaleX = (MINIMAP_WIDTH - 20) / workflowWidth;
      const scaleY = (MINIMAP_HEIGHT - 20) / workflowHeight;
      const scale = Math.min(scaleX, scaleY, 0.2);

      // Offsets for centering
      const offsetX =
        (MINIMAP_WIDTH - workflowWidth * scale) / 2 - minX * scale;
      const offsetY =
        (MINIMAP_HEIGHT - workflowHeight * scale) / 2 - minY * scale;

      // Draw edges with smooth lines
      ctx.strokeStyle = "#4b5563";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (edges && Array.isArray(edges)) {
        edges.forEach((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

          if (!sourceNode?.position || !targetNode?.position) return;

          const sw = (sourceNode as any).width || 280;
          const sh = (sourceNode as any).height || 80;
          const tw = (targetNode as any).width || 280;

          const sx = (sourceNode.position.x + sw / 2) * scale + offsetX;
          const sy = (sourceNode.position.y + sh) * scale + offsetY;
          const tx = (targetNode.position.x + tw / 2) * scale + offsetX;
          const ty = targetNode.position.y * scale + offsetY;

          // Draw smooth line
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          // Draw arrow head (filled triangle)
          const angle = Math.atan2(ty - sy, tx - sx);
          const arrowSize = 4;

          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(
            tx - arrowSize * Math.cos(angle - Math.PI / 6),
            ty - arrowSize * Math.sin(angle - Math.PI / 6),
          );
          ctx.lineTo(
            tx - arrowSize * Math.cos(angle + Math.PI / 6),
            ty - arrowSize * Math.sin(angle + Math.PI / 6),
          );
          ctx.closePath();
          ctx.fillStyle = "#4b5563";
          ctx.fill();
        });
      }

      // Color map
      const colors: Record<string, string> = {
        parser: "#f59e0b",
        validator: "#10b981",
        matcher: "#8b5cf6",
        duplicate: "#ec4899",
        exception: "#ef4444",
        billing: "#f59e0b",
        allocator: "#84cc16",
        aging: "#14b8a6",
        recon: "#eab308",
        variance: "#f97316",
        erpsync: "#06b6d4",
        logger: "#64748b",
        apreporting: "#3b82f6",
        arreporting: "#10b981",
        reconreporting: "#6366f1",
        auditreporting: "#8b5cf6",
        orchestrator: "#a855f7",
        codeagent: "#6366f1",
        vizagent: "#a855f7",
        sandbox: "#14b8a6",
        livecode: "#10b981",
        insight: "#f59e0b",
        datagrid: "#06b6d4",
        guardrails: "#ef4444",
        memory: "#64748b",
        trigger: "#8b5cf6",
        email: "#3b82f6",
        export: "#6366f1",
        delay: "#eab308",
        condition: "#f97316",
        loop: "#ec4899",
        approval: "#f59e0b",
        code: "#64748b",
      };

      // Draw nodes
      nodes.forEach((node) => {
        if (!node?.position) return;

        const x = node.position.x * scale + offsetX;
        const y = node.position.y * scale + offsetY;
        const w = ((node as any).width || 280) * scale;
        const h = ((node as any).height || 80) * scale;

        const nodeType = (node.data as any)?.nodeType || "code";
        const color = colors[nodeType] || "#64748b";

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;

        // Draw rounded rectangle
        const radius = Math.min(3, Math.min(w, h) / 4);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
      });

      // Draw viewport with smooth lines
      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 1920;
      const viewportHeight =
        typeof window !== "undefined" ? window.innerHeight : 1080;

      const vx = (-viewX / zoom) * scale + offsetX;
      const vy = (-viewY / zoom) * scale + offsetY;
      const vw = (viewportWidth / zoom) * scale;
      const vh = (viewportHeight / zoom) * scale;

      // Set line properties for smooth rendering
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(vx, vy, vw, vh);

      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.fillRect(vx, vy, vw, vh);

      // Reset line dash and caps
      ctx.setLineDash([]);
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    } catch (error) {
      console.error("MiniMap rendering error:", error);
      // Draw error state
      if (ctx) {
        ctx.fillStyle = "#ef4444";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Render Error", MINIMAP_WIDTH / 2, MINIMAP_HEIGHT / 2);
      }
    }
  }, [nodes, edges, viewX, viewY, zoom]);

  return (
    <canvas
      ref={canvasRef}
      width={MINIMAP_WIDTH}
      height={MINIMAP_HEIGHT}
      style={{
        display: "block",
        borderRadius: "8px",
        backgroundColor: "transparent",
      }}
    />
  );
};

// Wrapper component that positions the minimap
export const CustomMiniMap: React.FC = () => {
  return (
    <div
      className="react-flow__panel react-flow__minimap bottom left"
      style={{ bottom: 16, left: 16 }}
    >
      <div
        style={{
          background:
            "linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.95))",
          border: "2px solid #374151",
          borderRadius: "12px",
          padding: "8px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
        <MiniMapCanvas />
      </div>
    </div>
  );
};
