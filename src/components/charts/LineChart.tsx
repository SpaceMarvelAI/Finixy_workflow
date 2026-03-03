import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  color?: string;
  title?: string;
  showArea?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 400,
  color = "#3b82f6",
  title,
  showArea = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 80, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.label))
      .range([0, chartWidth])
      .padding(0.5);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .nice()
      .range([chartHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "#9ca3af")
      .style("font-size", "12px");

    g.append("g")
      .call(
        d3.axisLeft(y).tickFormat((d) => `₹${d3.format(".2s")(d as number)}`),
      )
      .selectAll("text")
      .style("fill", "#9ca3af")
      .style("font-size", "12px");

    g.selectAll(".domain, .tick line")
      .style("stroke", "#374151")
      .style("stroke-width", "1px");

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-chartWidth)
          .tickFormat(() => ""),
      )
      .selectAll("line")
      .style("stroke", "#374151")
      .style("stroke-opacity", 0.3)
      .style("stroke-dasharray", "3,3");

    if (showArea) {
      const gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.4);

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0);

      const area = d3
        .area<{ label: string; value: number }>()
        .x((d) => x(d.label) || 0)
        .y0(chartHeight)
        .y1((d) => y(d.value))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(data)
        .attr("fill", "url(#area-gradient)")
        .attr("d", area);
    }

    const line = d3
      .line<{ label: string; value: number }>()
      .x((d) => x(d.label) || 0)
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = g
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 3)
      .attr("d", line);

    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    g.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.label) || 0)
      .attr("cy", (d) => y(d.value))
      .attr("r", 0)
      .attr("fill", color)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        d3.select(this).transition().duration(200).attr("r", 8);

        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr("transform", `translate(${x(d.label)},${y(d.value) - 20})`);

        tooltip
          .append("rect")
          .attr("x", -60)
          .attr("y", -35)
          .attr("width", 120)
          .attr("height", 30)
          .attr("fill", "#1f2937")
          .attr("rx", 4)
          .attr("stroke", color)
          .attr("stroke-width", 2);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", -17)
          .style("fill", "#fff")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text(`₹${d3.format(",.0f")(d.value)}`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("r", 5);
        g.selectAll(".tooltip").remove();
      })
      .transition()
      .delay((_d, i) => i * 100 + 1500)
      .duration(300)
      .attr("r", 5);

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
  }, [data, width, height, color, title, showArea]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
