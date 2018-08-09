/* eslint-disable no-param-reassign */

import {
  drag,
  event,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  select,
  zoom,
  selectAll
} from "d3";

import "../css/index.pcss";
import dataset from "./countries.json";

const req = require.context("../assets", false, /.png$/);
const flags = {};
req.keys().forEach(key => {
  // extract filename: "./us.png" => "us"
  flags[/[^./]+(?=\.png$)/.exec(key)[0]] = req(key);
});

const w = 1000;
const h = 500;
const flagSize = 32;

// Initialize a simple force layout, using the nodes and edges in dataset
const simulation = forceSimulation(dataset.nodes)
  .force("charge", forceManyBody().strength(-100))
  .force("link", forceLink(dataset.edges).distance(70))
  .force(
    "center",
    forceCenter()
      .x(w / 2)
      .y(h / 2)
  )
  .force("collision", forceCollide());

select("#chart")
  .append("h1")
  .classed("heading", true)
  .text("National Contiguity");

select("#chart")
  .append("p")
  .text(
    "This chart shows countries which have common borders or have close proximity to each other."
  );
select("#chart")
  .append("small")
  .text("To move click and drag. To zoom use the mouse wheel.");

const svg = select("#chart")
  .append("div")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .classed("chart", true);

svg
  .append("rect")
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("fill", "#fff");

const filterDef = svg.append("defs");
const filter = filterDef
  .append("filter")
  .attr("id", "dropshadow")
  .attr("height", "130%");
filter
  .append("feGaussianBlur")
  .attr("in", "SourceAlpha")
  .attr("stdDeviation", "1");
filter
  .append("feOffset")
  .attr("dx", "1")
  .attr("dy", "1")
  .attr("result", "offsetblur");

const feComponentTransfer = filter.append("feComponentTransfer");
feComponentTransfer.append("feFuncA").attr("linear", "0.9"); // shadow opacity

const filterMerge = filter.append("feMerge");
filterMerge.append("feMergeNode");
filterMerge.append("feMergeNode").attr("in", "SourceGraphic");

const chart = svg.append("g");

const dragging = {
  start(d) {
    if (!event.active) {
      simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  },
  during(d) {
    d.fx = event.x;
    d.fy = event.y;
  },
  end(d) {
    if (!event.active) {
      simulation.alphaTarget(0);
    }
    d.fx = null;
    d.fy = null;
  },
  subject(d) {
    return simulation.find(d.x, d.y);
  }
};

const edges = chart
  .selectAll("line")
  .data(dataset.edges)
  .enter()
  .append("line")
  .style("stroke", "#ccc")
  .style("stroke-width", 1);

function movingTooltip(x, y) {
  select("#tooltip")
    .attr("x", x + flagSize / 2)
    .attr("y", y);
}

function restingTooltip() {
  select("#tooltip").remove();
}

function startingTooltip(x, y, country) {
  chart
    .append("text")
    .attr("id", "tooltip")
    .attr("x", x + flagSize / 2)
    .attr("y", y)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("font-weight", "bold")
    .attr("fill", "black")
    .text(country);
}

const nodes = chart
  .selectAll("image")
  .data(dataset.nodes)
  .enter()
  .append("svg:image")
  .attr("xlink:href", ({ code }) => flags[code])
  .attr("width", flagSize)
  .attr("height", flagSize)
  .on("mouseover", ({ x, y, country }) => {
    startingTooltip(x, y, country);
  })
  .on("mousemove", ({ x, y }) => {
    movingTooltip(x, y);
  })
  .on("mouseout", () => {
    restingTooltip();
  })
  .call(
    drag()
      .subject(dragging.subject)
      .on("start", d => {
        dragging.start(d);
      })
      .on("drag", d => {
        dragging.during(d);
        const { x, y } = d;
        movingTooltip(x, y);
      })
      .on("end", d => {
        dragging.end(d);
        restingTooltip();
      })
  );

selectAll("#chart image").style("filter", "url(#dropshadow)");

function zoomActions() {
  chart.attr("transform", event.transform);
}

const zoomHandler = zoom()
  .scaleExtent([0.2, 2.0])
  .translateExtent([[-w * 3, -h * 3], [w * 3, h * 3]])
  .on("zoom", zoomActions);

zoomHandler(svg);

simulation.on("tick", () => {
  nodes
    .attr("x", d => {
      d.x = Math.max(-w * 3 + flagSize, Math.min(w * 3 - flagSize, d.x));
      return d.x;
    })
    .attr("y", d => {
      d.y = Math.max(-h * 3 + flagSize, Math.min(h * 3 - flagSize, d.y));
      return d.y;
    });
  edges
    .attr("x1", d => d.source.x + flagSize / 2)
    .attr("y1", d => d.source.y + flagSize / 2)
    .attr("x2", d => d.target.x + flagSize / 2)
    .attr("y2", d => d.target.y + flagSize / 2);
});
