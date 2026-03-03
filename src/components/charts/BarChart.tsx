import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  width?: number;
  height?: number;
  color?: string;
  title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 600,
  height = 400,
  color = "#3b82f6",
  title,
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
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, chartWidth])
      .padding(0.2);

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

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) || 0)
      .attr("width", x.bandwidth())
      .attr("y", chartHeight)
      .attr("height", 0)
      .attr("fill", color)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseover", function (_event, d) {
        d3.select(this).attr("opacity", 0.8);

        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${x(d.label)! + x.bandwidth() / 2},${y(d.value) - 10})`,
          );

        tooltip
          .append("rect")
          .attr("x", -60)
          .attr("y", -30)
          .attr("width", 120)
          .attr("height", 25)
          .attr("fill", "#1f2937")
          .attr("rx", 4)
          .attr("stroke", color)
          .attr("stroke-width", 2);

        tooltip
          .append("text")
          .attr("text-anchor", "middle")
          .attr("y", -12)
          .style("fill", "#fff")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .text(`₹${d3.format(",.0f")(d.value)}`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        g.selectAll(".tooltip").remove();
      })
      .transition()
      .duration(800)
      .delay((_d, i) => i * 100)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => chartHeight - y(d.value));

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
  }, [data, width, height, color, title]);

  return <svg ref={svgRef} className="w-full h-full" />;
};
