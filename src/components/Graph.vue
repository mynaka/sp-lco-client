<template>
    <svg ref="svg" :width="width" :height="height"></svg>
</template>

<script setup lang="ts">
    import * as d3 from 'd3'
    import { ref, onMounted } from 'vue';
    import { OntologyService } from "../composables";
    import { GraphNode, GraphLink } from "../interfaces";

    const props = defineProps<{
        ontology: string;
    }>();

    const width = 1920; 
    const height = 750;
    const nodes = ref<GraphNode[]>([]); // Array to hold nodes
    const links = ref<GraphLink[]>([]); // Array to hold links
    const svg = ref<SVGSVGElement | null>(null); // SVG reference

    onMounted(async () => {
    const rootResponse = (await OntologyService.getRootDatabaseTree(props.ontology)).data.entries;
    rootResponse.forEach((item: any) => {
        nodes.value.push({
        id: item.key,
        label: item.label,
        data: item.data,
        x: Math.random() * width,
        y: Math.random() * height,
        isLoaded: false,
        leaf: item.leaf
        });
    });

    drawGraph();
    });

    function drawGraph() {
    if (svg.value) {
        svg.value.innerHTML = ''; // Clear previous drawings

        const simulation = d3.forceSimulation(nodes.value)
        .force("link", d3.forceLink().id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2));

        const linkSelection = d3.select(svg.value)
        .selectAll("line")
        .data(links.value)
        .join("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6);

        const nodeSelection = d3.select(svg.value)
        .selectAll("g")
        .data(nodes.value)
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
        )
        .on("click", async (event, d) => {
            console.log(`Node clicked: ${d.id}`);

            d3.select(event.currentTarget).classed("selected", !d3.select(event.currentTarget).classed("selected"));

            if (!d.isLoaded && !d.leaf){
            const children = (await OntologyService.getNodeChildren(d.id)).data.entries;
            children.forEach((child: any) => {
                if (!nodes.value.find(node => node.id === child.id)) {
                nodes.value.push({
                    id: child.key,
                    label: child.label,
                    data: child.data,
                    x: d.x + (Math.random() - 0.5) * 100,
                    y: d.y + (Math.random() - 0.5) * 100,
                    isLoaded: false,
                    leaf: child.leaf
                });
                links.value.push({ source: d.id, target: child.key });
                updateGraph(simulation);
                } 
                d.isLoaded = true;

            });
            }
        });

        nodeSelection.append("circle")
        .attr("fill", "#69b3a2")
        .attr("r", 30);

        nodeSelection.append("text")
        .attr("dy", ".35em")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .text(d => d.label)
        .style("user-select", "none");

        simulation.on('tick', () => {
        linkSelection
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        nodeSelection
            .attr("transform", d => `translate(${d.x},${d.y})`);
        });
    }
    }

    function updateGraph(simulation: any) {
    simulation.nodes(nodes.value);
    simulation.force("link").links(links.value);
    simulation.alpha(1).restart(); // Restart the simulation
    drawGraph();
    }

    function dragstarted(event: any, d: any) {
    if (!event.active) d3.forceSimulation().alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    }

    function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
    }

    function dragended(event: any, d: any) {
    if (!event.active) d3.forceSimulation().alphaTarget(0);
    d.fx = null;
    d.fy = null;
    }
</script>

<style>
.link {
stroke: #999;
stroke-opacity: 0.6;
}

.node {
  stroke: #fff;
  stroke-width: 1.5px;
  fill: #00b3ff; /* Default color */
}

.node.selected {
  fill: #ff6347; /* Color when selected, e.g., Tomato */
}
</style>
