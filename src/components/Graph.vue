<template>
    <div class="flex">
        <div class="flex-grow border-2 border-black p-2">
            <div class="flex items-center mb-2">
                <!-- Tree Button -->
                <Button 
                    severity="info" 
                    class="px-4 py-2 bg-blue-500 text-white rounded"
                    @click="goToTree">
                    Switch to Tree View
                </Button>

                <!-- Legend -->
                <div class="ml-4">
                    <p class="font-semibold mb-1">Legend:</p>
                    <div class="flex items-center mb-2">
                        <div class="w-8 h-0.5 bg-green-500 mr-2"></div>
                        <span>Subset of</span>
                    </div>
                </div>
            </div>
            <div v-if="isLoading" class="flex justify-center items-center h-full">
                <ProgressSpinner />
            </div>
            <svg ref="svg" class="border-2" :width="width" :height="height"></svg>
        </div>

        <!-- Node Card Component -->
        <NodeCard :selectedNode="selectedNode" />
    </div>
</template>

<script setup lang="ts">
import * as d3 from 'd3';
import ProgressSpinner from 'primevue/progressspinner';
import NodeCard from './NodeCard.vue';
import { ref, onMounted, nextTick } from 'vue';
import { OntologyService } from "../composables";
import { GraphNode, GraphLink } from "../interfaces";
import Button from 'primevue/button';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
    ontology: string;
    width: number;
    height: number;
}>();
const isLoading = ref(false);
const nodes = ref<GraphNode[]>([]);
const links = ref<GraphLink[]>([]);
const svg = ref<SVGSVGElement | null>(null);
const selectedNode = ref<GraphNode | undefined>();


const route = useRoute();
const router = useRouter();
const query = ref();

const width = ref(props.width);
const height = ref(props.height);
let simulation: any;
let isQuerying = true;

const orderFields = (node: GraphNode): Record<string, any> => {
  const orderedData: Record<string, any> = {};
  const preferredKeys = ["prefLabel", "identifier", "notation", "altLabel", "description", "function", "sequence", "features", "references"];
  
  preferredKeys.forEach(key => {
    if (key in node.data) {
      orderedData[key] = node.data[key];
    }
  });

  Object.keys(node.data).forEach(key => {
    if (!(key in orderedData)) {
      orderedData[key] = node.data[key];
    }
  });

  return orderedData;
}

onMounted(async () => {
    isLoading.value = true;
    await nextTick();
    width.value = props.width;
    height.value = props.height-100;

    const rootResponse = (await OntologyService.getRootDatabaseTree(props.ontology)).data.entries;
    rootResponse.forEach((root: GraphNode) => {
        let sortedData = orderFields(root);
        nodes.value.push({
            id: root.key,
            key: root.key,
            label: root.label,
            data: sortedData,
            x: Math.random() * props.width,
            y: Math.random() * props.height,
            isLoaded: false,
            leaf: root.leaf,
            nodeType: root.nodeType,
            loading: false
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

    if (route.query.code != null) {
        query.value = route.query.code;
        const ancestors = (await OntologyService.getAncestors(query.value)).data.ancestors;
        if (ancestors) for (const ancestor of ancestors) await triggerNodeClick(ancestor);

        isQuerying = false;
        await triggerNodeClick(query.value);
    }

    isQuerying = false;
    isLoading.value = false;
});

function drawGraph() {
    if (svg.value) {
        svg.value.innerHTML = '';

        // Add a defs section for arrow markers
        const defs = d3.select(svg.value)
            .append("defs");

        // Create a marker for each relationship type dynamically
        links.value.forEach(link => {
            // Only create a marker for unique relationship types
            const markerId = `arrow-${link.relationship}`;
            if (!defs.select(`#${markerId}`).node()) {
                const marker = defs.append("marker")
                    .attr("id", markerId)
                    .attr("viewBox", "0 -5 10 10")
                    .attr("refX", 5)
                    .attr("refY", 0)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 6)
                    .attr("orient", "auto");

                marker.append("path")
                    .attr("d", "M0,-5L10,0L0,5") // Arrow shape
                    .attr("fill", link.relationship === 'subset_of' ? "green" : "#999"); // Set color based on relationship
            }
        });

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

        // Create main links
        const linkSelection = zoomGroup
            .selectAll("line.link")
            .data(links.value)
            .join("line")
            .attr("class", "link")
            .attr("stroke", d => d.relationship === 'subset_of' ? "green" : "#999") // Set color based on relationship
            .attr("stroke-opacity", 0.6)
            .attr("marker-end", d => `url(#arrow-${d.relationship})`); // Use dynamic marker for each relationship

        // Create midpoint arrows by adding an invisible segment in the middle
        const arrowSelection = zoomGroup
            .selectAll("line.mid-arrow")
            .data(links.value)
            .join("line")
            .attr("class", "mid-arrow")
            .attr("stroke-opacity", 0)
            .attr("marker-end", d => `url(#arrow-${d.relationship})`); // Apply marker dynamically

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
                    d3.select(`g[data-id="${selectedNode.value.id}"]`).select("circle")
                        .attr("fill", "#69b3a2");
                }
                if (!isQuerying) selectedNode.value = d;

                if (!d.isLoaded && !d.leaf) {
                    d3.select(event.currentTarget)
                        .append("text")
                        .attr("dy", "2em")
                        .attr("font-size", 10)
                        .attr("text-anchor", "middle")
                        .text("Loading...");

                    d.isLoaded = true;
                    const children = (await OntologyService.getNodeChildren(d.id)).data.entries;
                    children.forEach((child: GraphNode) => {
                        if (!nodes.value.find(node => node.id === child.id)) {
                            let sortedData = orderFields(child);
                            nodes.value.push({
                                id: child.key,
                                key: child.key,
                                label: child.label,
                                data: sortedData,
                                x: d.x + (Math.random() - 0.5) * 100,
                                y: d.y + (Math.random() - 0.5) * 100,
                                isLoaded: false,
                                leaf: child.leaf,
                                nodeType: child.nodeType,
                                loading: false
                            });
                            links.value.push({ source: child.key, target: d.id, relationship: 'subset_of' });
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

            // Update the midpoint arrow segment to match link direction
            arrowSelection
                .attr("x1", d => {
                    const midX = ((d.source as GraphNode).x + (d.target as GraphNode).x) / 2;
                    const angleFactor = ((d.target as GraphNode).x - (d.source as GraphNode).x) * 0.05;
                    return midX - angleFactor;
                })
                .attr("y1", d => {
                    const midY = ((d.source as GraphNode).y + (d.target as GraphNode).y) / 2;
                    const angleFactor = ((d.target as GraphNode).y - (d.source as GraphNode).y) * 0.05;
                    return midY - angleFactor;
                })
                .attr("x2", d => {
                    const midX = ((d.source as GraphNode).x + (d.target as GraphNode).x) / 2;
                    const angleFactor = ((d.target as GraphNode).x - (d.source as GraphNode).x) * 0.05;
                    return midX + angleFactor;
                })
                .attr("y2", d => {
                    const midY = ((d.source as GraphNode).y + (d.target as GraphNode).y) / 2;
                    const angleFactor = ((d.target as GraphNode).y - (d.source as GraphNode).y) * 0.05;
                    return midY + angleFactor;
                });

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

async function triggerNodeClick(nodeIdentifier: string): Promise<void> {
    let nodeElement = d3.select(`g[data-id="${nodeIdentifier}"]`).node() as Element | null;

    while (!nodeElement) {
        await new Promise(resolve => setTimeout(resolve, 500));
        nodeElement = d3.select(`g[data-id="${nodeIdentifier}"]`).node() as Element | null;
    }

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    nodeElement.dispatchEvent(event);
}
function goToTree() {
    const ontology = (route.params.ontology as string).toUpperCase();

    const path = `/ontologies/${ontology}/classes`;
    const query = selectedNode.value ? { code: selectedNode.value?.data.identifier } : {};
    console.log(query);
    router.push({ path, query });
}
</script>
