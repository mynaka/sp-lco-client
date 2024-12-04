<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="hidden md:flex flex-auto md:w-1/4 flex-col overflow-y-auto">
      <div class="flex-auto flex flex-col justify-center items-center">
        <Card class="w-full h-full">
          <template #title>
            <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
              <img src="../assets/logo/uplb-logo.png" class="h-8 md:h-10 lg:h-12" alt="UPLB Logo" />
              <span class="self-center text-xl font-semibold whitespace-nowrap">Liver Cancer Ontologies</span>
            </a>
            <br>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <span class="flex items-center">{{ ontology }}</span>
              <Button 
                class="h-12 w-40 text-sm" 
                severity="info" 
                label="Switch to Graph View" 
                @click="goToGraph" 
              rounded />
            </div>
          </template>
          <template #content>
            <template v-if="isLoadingTree">
              <ProgressSpinner />
            </template>
            <template v-else>
              <Tree :value="nodes"
                @node-expand="onNodeExpand"
                @nodeSelect="onNodeSelect"
                :expanded-keys="expandedKeys"
                selectionMode="single"
                loadingMode="icon" 
                class="w-full"/>
            </template>
          </template>
          </Card>
      </div>
    </div>
    <NodeCard :selectedNode="selectedNode" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NodeData } from "../interfaces";

import Button from 'primevue/button';
import Card from 'primevue/card';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';

import { OntologyService } from "../composables";
import NodeCard from "../components/NodeCard.vue";

const nodes = ref<NodeData[]>([]);
const route = useRoute();
const router = useRouter();
const query = ref();
const isLoadingTree = ref(true);
const ontology = ref((route.params.ontology as string).toUpperCase());

const selectedNode = ref<NodeData>();
const expandedKeys: Ref<Record<string, boolean>> = ref({});;
let nodeMap: Map<string, NodeData>;


if (route.query.code != null) {
  query.value = route.query.code;
}

const onNodeSelect = (node: any) => {
  selectedNode.value = node;
};

/**
 * Get the root nodes of the ontology specified in the endpoint params
 */
const loadOntologies = async (): Promise<void> => {
  try {
    const rootResponse = await OntologyService.getRootDatabaseTree(ontology.value);
    nodes.value = rootResponse.data.entries;

    nodes.value = nodes.value.map(node => {
      node.data = orderFields(node);
      return node;
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    nodes.value.forEach(node => {
      node.loading = false;
      node.isLoaded = false;
    });
    nodeMap = getNodeMap(nodes.value);
  }
};

const orderFields = (node: NodeData): Record<string, any> => {
  const orderedData: Record<string, any> = {};
  const preferredKeys = ["prefLabel", "identifier", "notation", "altLabel", "description", "function", "activity_regulation", "optimal_ph", "sequence", "site_features", "pheno_variant_features", "features", "references"];
  
  preferredKeys.forEach(key => {
    if (key in node.data) {
      orderedData[key] = node.data[key];
      if (key == 'identifier') {
        orderedData['type'] = node.nodeType;
      }
    }
  });

  Object.keys(node.data).forEach(key => {
    if (!(key in orderedData)) {
      orderedData[key] = node.data[key];
    }
  });

  return orderedData;
}

/**
 * Get the children of the node from the backend if node is not expanded already
 * @param node node to be expanded
 */
async function onNodeExpand(node: NodeData): Promise<void> {
  if (!node.isLoaded) {
    const children = ref<NodeData[]>([]);
    if (!node.leaf) node.loading = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let notation = node.data.notation ?? node.data.identifier;
      
      const data = await OntologyService.getNodeChildren(notation);
      children.value = data.data.entries;

      node.children = children.value;
      node.children.forEach((child) => {
        child.data = orderFields(child);
        child.loading = false;
      });
      node.loading = false;
      node.isLoaded = true;
      expandedKeys.value[node.key] = true;
    } catch (error) {
      console.error("Error fetching data:", error);
      node.loading = false;
    }
  }
}

function goToGraph() {
  const path = `/ontologies/${ontology.value}/graph`;
  const query = selectedNode.value?.key ? { code: selectedNode.value?.key } : {};
  router.push({ path, query });
}

function getNodeMap(nodes: NodeData[]): Map<string, NodeData> {
  const map = new Map<string, NodeData>();

  function traverse(nodes: NodeData[]) {
    for (const node of nodes) {
      map.set(node.key, node);
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return map;
}

onMounted(async () => {
  loadOntologies();
  try {
    if (query.value) {
      const ancestors = (await OntologyService.getAncestors(query.value)).data.ancestors ?? [];
      for (const ancestor of ancestors) {
        const matchedNode = nodeMap.get(ancestor);
        
        if (matchedNode) {
          await onNodeExpand(matchedNode);
          if (matchedNode.children) {
            matchedNode.children.forEach(child => {
              nodeMap.set(child.key, child);
            });
          }
        } else {
          console.log(`No match found for ancestor: ${ancestor}`);
        }
      }
      selectedNode.value = getNodeMap(nodes.value).get(query.value);
      isLoadingTree.value = false;
    } else {
      isLoadingTree.value = false;
    }
  } catch (error) {
    console.error("Error loading ancestors or nodes:", error);
  }
});
</script>
<style>
/**Reference:
*
*/
.info {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='black'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M12 17.139v-6.167'/%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M11.958 7.563h.008'/%3E%3Crect width='18.5' height='18.5' x='2.75' y='2.75' stroke-width='0.7' rx='6'/%3E%3C/g%3E%3C/svg%3E");
}
</style>