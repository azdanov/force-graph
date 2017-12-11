/* eslint-disable no-param-reassign,import/no-dynamic-require,global-require */
import dataset from "./countries.json";
import "../css/index.css";

// Load all flags from directory
const req = require.context("../flags", false, /.svg$/);
const flags = {};
req.keys().forEach(key => {
    // extract filename, e.g "./de.svg" => "de"
    flags[/[^./]+(?=\.svg$)/.exec(key)[0]] = req(key);
});

const w = 1000;
const h = 600;
const flagWidth = 20;
const flagHeight = 15;

// Initialize a simple force layout, using the nodes and edges in dataset
const force = d3
    .forceSimulation(dataset.nodes)
    .force("charge", d3.forceManyBody().distanceMax(100))
    .force("link", d3.forceLink(dataset.edges))
    .force(
        "center",
        d3
            .forceCenter()
            .x(w / 2)
            .y(h / 2),
    );

d3
    .select("body")
    .append("h1")
    .text("National Contiguity");

// Create SVG element
const svg = d3
    .select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

// Create edges as lines
const edges = svg
    .selectAll("line")
    .data(dataset.edges)
    .enter()
    .append("line")
    .style("stroke", "#ccc")
    .style("stroke-width", 1);

// Create nodes as circles
const nodes = svg
    .selectAll("image")
    .data(dataset.nodes)
    .enter()
    .append("image")
    .attr("width", flagWidth)
    .attr("height", flagHeight)
    .attr("xlink:href", ({ code }) => flags[code]);

// Add a simple tooltip
nodes.append("title").text(({ country }) => country);

// Every time the simulation "ticks", this will be called
force.on("tick", () => {
    edges
        .attr("x1", d => d.source.x + flagWidth / 2)
        .attr("y1", d => d.source.y + flagHeight / 2)
        .attr("x2", d => d.target.x + flagWidth / 2)
        .attr("y2", d => d.target.y + flagHeight / 2);

    nodes.attr("x", d => d.x).attr("y", d => d.y);
});
