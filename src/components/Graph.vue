<template>
    <div class="flex">
        <div class="flex-grow border-2 border-black p-2">
            <div v-if="isLoading" class="flex justify-center items-center h-full">
                <ProgressSpinner />
            </div>
            <svg ref="svg" :width="width" :height="height"></svg>
        </div>
        <Node :selectedNode="selectedNode" :dataKeys="dataKeys" />
    </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import ProgressSpinner from 'primevue/progressspinner';
import Node from '../components/Node.vue';
import { ref, onMounted, nextTick } from 'vue';
import { OntologyService } from "../composables";
import { GraphNode, GraphLink } from "../interfaces";

const props = defineProps<{
    ontology: string;
    width: number;
    height: number;
}>();
const isLoading = ref(false);
const nodes = ref<GraphNode[]>([]);
const links = ref<GraphLink[]>([]);
const svg = ref<SVGSVGElement | null>(null);
const selectedNode = ref<GraphNode>();
const lastSelectedNode = ref();
const dataKeys = ref({});

const width = ref(props.width);
const height = ref(props.height);
let simulation: any;
onMounted(async () => {
    isLoading.value = true;
    await nextTick();
    width.value = props.width;
    height.value = props.height-20;

    const rootResponse = (await OntologyService.getRootDatabaseTree(props.ontology)).data.entries;
    const preferredKeys = ["prefLabel", "identifier", "notation", "description"];
    rootResponse.forEach((item: any) => {
        /**
         * Sort data first to make sure things like preferred terms and description come first
        */
        const sortedData = Object.keys(item.data)
            .sort((a, b) => {
                const indexA = preferredKeys.indexOf(a);
                const indexB = preferredKeys.indexOf(b);

                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                if (indexA !== -1) {
                    return -1;
                }
                if (indexB !== -1) {
                    return 1;
                }

                return a.localeCompare(b);
            })
            .reduce((acc, key) => {
                acc[key] = item.data[key];
                return acc;
            }, {} as Record<string, any>);
        nodes.value.push({
            id: item.key,
            label: item.label,
            data: sortedData,
            x: Math.random() * props.width,
            y: Math.random() * props.height,
            isLoaded: false,
            leaf: item.leaf
        });
    });

    /**
     * Initialize svg sim
     */
    simulation = d3.forceSimulation(nodes.value)
        .force("link", d3.forceLink().id((d: any) => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(props.width / 2, props.height / 2));

    drawGraph();
    isLoading.value = false;
});

function drawGraph() {
    if (svg.value) {
        svg.value.innerHTML = '';

        const zoomGroup = d3.select(svg.value)
            .append("g")
            .attr("class", "zoom-group");

        d3.select(svg.value as SVGSVGElement)
            .call(
                d3.zoom<SVGSVGElement, unknown>()
                    .scaleExtent([0.5, 5])
                    .on("zoom", (event) => {
                        zoomGroup.attr("transform", event.transform);
                    })
            );


        const linkSelection = zoomGroup
            .selectAll("line")
            .data(links.value)
            .join("line")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6);

        const nodeSelection = zoomGroup
            .selectAll<SVGGElement, GraphNode>("g")
            .data(nodes.value)
            .join("g")
            .attr("transform", (d: GraphNode) => `translate(${d.x},${d.y})`)
            .attr("data-id", d => d.id)
            .call(
                d3.drag<SVGGElement, GraphNode>()
                    .on("start", (event, d) => dragstarted(event, d))
                    .on("drag", (event, d) => dragged(event, d))
                    .on("end", (event, d) => dragended(event, d))
            )
            .on("click", async (event, d: GraphNode) => {
                d3.select(event.currentTarget)
                    .select("circle")
                    .attr("fill", "orange");
                if (selectedNode.value && selectedNode.value != d) {
                    console.log(selectedNode.value);
                    console.log(selectedNode.value.id);
                    d3.select(`g[data-id="${selectedNode.value.id}"]`).select("circle")
                        .attr("fill", "#69b3a2");
                }
                selectedNode.value = d;
                if (!d.isLoaded && !d.leaf) {
                    d.isLoaded = true;
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
                                leaf: child.leaf,
                            });
                            links.value.push({ source: d.id, target: child.key });
                        }
                    });
                    updateGraph();
                }
            });


        nodeSelection.append("circle")
            .attr("fill", d => d === selectedNode.value ? "orange" : "#69b3a2")
            .attr("r", 30);

        nodeSelection.append("text")
            .attr("dy", ".35em")
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .text((d: any) => d.label)
            .style("user-select", "none");

        simulation.on('tick', () => {
            linkSelection
                .attr("x1", d => (d.source as GraphNode).x)
                .attr("y1", d => (d.source as GraphNode).y)
                .attr("x2", d => (d.target as GraphNode).x)
                .attr("y2", d => (d.target as GraphNode).y);

            nodeSelection
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });
    }
}

function updateGraph() {
    simulation.nodes(nodes.value);
    simulation.force("link").links(links.value);
    simulation.alpha(0.5).alphaTarget(0).restart();

    drawGraph();
}

function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}
</script>
