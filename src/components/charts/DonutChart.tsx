import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DonutChartProps {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  colors?: string[];
  title?: string;
  centerText?: string;
  centerSubtext?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  width = 400,
  height = 400,
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"],
  title,
  centerText,
  centerSubtext,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const radius = Math.min(chartWidth, chartHeight) / 2;
    const innerRadius = radius * 0.6;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2},${height / 2 + margin.top / 2})`,
      );

    const color = d3.scaleOrdinal<string>().range(colors);

    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    const arcHover = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 10);

    const arcs = g
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.label))
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover as any);

        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(0, ${-radius - 40})`);

        tooltip
          .append("rect")
          .attr("x", -80)
          .attr("y", -25)
          .attr("width", 160)
          .attr("height", 45)
          .attr("fill", "#1f2937")
          .attr("rx", 6)
          .attr("stroke", color(d.data.label))
          .attr("stroke-width", 2);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", -8)
          .style("fill", "#fff")
          .style("font-size", "12px")
          .style("font-weight", "600")
          .text(d.data.label);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", 10)
          .style("fill", "#9ca3af")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .text(`₹${d3.format(",.0f")(d.data.value)}`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc as any);
        g.selectAll(".tooltip").remove();
      })
      .transition()
      .duration(800)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t) as any) || "";
        };
      });

    if (centerText) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("y", centerSubtext ? -8 : 5)
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .style("fill", "#e5e7eb")
        .text(centerText);
    }

    if (centerSubtext) {
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 15)
        .style("font-size", "12px")
        .style("fill", "#9ca3af")
        .text(centerSubtext);
    }

    if (title) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "#e5e7eb")
        .text(title);
    }

    const legend = svg
      .append("g")
      .attr("transform", `translate(20, ${height - data.length * 22 - 20})`);

    const legendItems = legend
      .selectAll(".legend-item")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (_d, i) => `translate(0, ${i * 22})`);

    legendItems
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 2)
      .attr("fill", (d) => color(d.label));

    legendItems
      .append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "11px")
      .style("fill", "#9ca3af")
      .text((d) => {
        const percentage = (
          (d.value / d3.sum(data, (d) => d.value)) *
          100
        ).toFixed(0);
        return `${d.label} (${percentage}%)`;
      });
  }, [data, width, height, colors, title, centerText, centerSubtext]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
