/* eslint-disable no-param-reassign,import/no-dynamic-require,global-require,no-return-assign */
import "../css/index.css";
import dataset from "./countries.json";

const req = require.context("../assets", false, /.png$/);
const flags = {};
req.keys().forEach(key => {
    // extract filename, e.g "./us.png" => "us"
    flags[/[^./]+(?=\.png$)/.exec(key)[0]] = req(key);
});

const w = 1000;
const h = 500;
const flagSize = 32;

// Initialize a simple force layout, using the nodes and edges in dataset
const simulation = d3
    .forceSimulation(dataset.nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("link", d3.forceLink(dataset.edges).distance(70))
    .force(
        "center",
        d3
            .forceCenter()
            .x(w / 2)
            .y(h / 2),
    )
    .force("collision", d3.forceCollide());

d3
    .select("body")
    .append("h1")
    .text("National Contiguity");

d3
    .select("body")
    .append("p")
    .text("This chart shows countries which have common borders or have close proximity to each other.");
d3
    .select("body")
    .append("small")
    .text("To move click and drag. To zoom use the mouse wheel.");

const svg = d3
    .select("body")
    .append("main")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

svg
    .append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "#ecf0f1");

const chart = svg.append("g");

const drag = {
    start(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    },
    during(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    },
    end(d) {
        if (!d3.event.active) {
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    },
};

// Create edges as lines
const edges = chart
    .selectAll("line")
    .data(dataset.edges)
    .enter()
    .append("line")
    .style("stroke", "#ccc")
    .style("stroke-width", 1);

function movingTooltip(x, y) {
    d3
        .select("#tooltip")
        .attr("x", x + flagSize / 2)
        .attr("y", y);
}

function stoppingTooltip() {
    d3.select("#tooltip").remove();
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

// Create nodes as flags
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
        stoppingTooltip();
    })
    .call(
        d3
            .drag()
            .on("start", d => {
                drag.start(d);
            })
            .on("drag", d => {
                drag.during(d);
                const { x, y } = d;
                movingTooltip(x, y);
            })
            .on("end", d => {
                drag.end(d);
                stoppingTooltip();
            }),
    );

function zoomActions() {
    chart.attr("transform", d3.event.transform);
}

const zoomHandler = d3
    .zoom()
    .scaleExtent([0.2, 2.0])
    .translateExtent([[-w * 3, -h * 3], [w * 3, h * 3]])
    .on("zoom", zoomActions);

zoomHandler(svg);

simulation.on("tick", () => {
    nodes
        .attr("x", d => (d.x = Math.max(-w * 3 + flagSize, Math.min(w * 3 - flagSize, d.x))))
        .attr("y", d => (d.y = Math.max(-h * 3 + flagSize, Math.min(h * 3 - flagSize, d.y))));
    edges
        .attr("x1", d => d.source.x + flagSize / 2)
        .attr("y1", d => d.source.y + flagSize / 2)
        .attr("x2", d => d.target.x + flagSize / 2)
        .attr("y2", d => d.target.y + flagSize / 2);
});
