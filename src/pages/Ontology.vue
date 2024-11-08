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
                class="w-full md:w-[30rem]"/>
            </template>
          </template>
          </Card>
      </div>
    </div>

    <!-- Main content -->
    <div class="flex w-full md:w-3/4 p-4 overflow-y-auto">

      <Card class="lg:w-2/4 sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg"
        v-if="selectedNode!=null">
        <template #title>
          {{ selectedNode.label }}
          <Button class="ml-2"
            v-if="selectedNode.data.sample"
            @click="downloadCSV"
            label="Download Sample CSV" 
            severity="info" 
            rounded/>
        </template>
        <template #content>
          <div v-if="selectedNode && selectedNode.data">
          <ul>
            <li v-for="(value, key) in selectedNode.data" :key="key">
              <strong v-if="key != 'sample'"
              v-tooltip.bottom="{
                value: dataKeys[key]?.description,
                pt: {
                  arrow: {
                    style: {
                      borderBottomColor: '#7b1113' // Matches tooltip background color
                    }
                  }
                }
              }"
              >
                {{ dataKeys[key]?.displayName || key }}:
              </strong> 
              <template v-if="isValidJsonString(value) && key != 'sample'">
                <table border="1" class="table-auto w-full text-left">
                  <thead>
                    <tr>
                      <th class="px-4 py-2">Field</th>
                      <th class="px-4 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in convertToDataTableFormat(value)" :key="item.field">
                      <td class="border px-4 py-2">{{ item.field }}</td>
                      <td class="border px-4 py-2">{{ item.type }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
              <template v-else-if="key !== 'sample'" >
                {{ value }}
              </template>
            </li>
          </ul>
        </div>
        </template>
      </Card>
      <Card class="mx-auto my-auto h-fit shadow-lg" v-else>
        <template #title class="justify-center items-center">
          SELECT A TERM TO VIEW
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Node, dataKeys } from "../interfaces";

import Button from 'primevue/button';
import Card from 'primevue/card';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';

import { OntologyService } from "../composables";

const nodes = ref<Node[]>([]);
const route = useRoute();
const router = useRouter();
const query = ref();
const isLoadingTree = ref(true);
const ontology = ref((route.params.ontology as string).toUpperCase());

const selectedNode = ref();
const expandedKeys = ref({});


if (route.query.code != null) {
  query.value = route.query.code;
}

const onNodeSelect = (node: any) => {
  // isSearching.value = false;
  selectedNode.value = node;
  // cardContents.value = parsedElements.value;
  // query.value = node.key;
};

/**
 * Get the root nodes of the ontology specified in the endpoint params
 */
const loadOntologies = async (): Promise<void> => {
  try {
    const rootResponse = await OntologyService.getRootDatabaseTree(ontology.value);
    nodes.value = rootResponse.data.entries;

    // Reorder keys in each node's data
    nodes.value = nodes.value.map(node => {
      const orderedData: Record<string, any> = {};

      const preferredKeys = ["prefLabel", "identifier", "notation", "description"];
      
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

      // Assign the ordered data back to node.data
      node.data = orderedData;
      return node;
    });
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    nodes.value.forEach(node => {
      node.loading = false;
      node.isLoaded = false;
    });
  }
};


/**
 * Get the children of the node from the backend if node is not expanded already
 * @param node node to be expanded
 */
 async function onNodeExpand(node: Node): Promise<void> {
  if (!node.isLoaded) {
    const children = ref<Node[]>([]);
    if (!node.leaf) node.loading = true;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      let notation = node.data.notation ?? node.data.identifier;
      
      const data = await OntologyService.getNodeChildren(notation);
      children.value = data.data.entries;

      node.children = children.value;
      node.children.forEach((child) => {
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


const downloadCSV = () => {
  try {
    const sampleData = JSON.parse(selectedNode.value.data.sample);
    const headers = Object.keys(sampleData);
    const csvRows = [];

    csvRows.push(headers.join(','));

    const maxRows = Math.max(...Object.values(sampleData).map(arr => arr.length));

    for (let i = 0; i < maxRows; i++) {
      const row = headers.map(header => {
        return sampleData[header][i] !== undefined ? sampleData[header][i] : '';
      });
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');

    const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.setAttribute('href', csvUrl);
    a.setAttribute('target', '_blank');
    a.setAttribute('download', 'sample_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error parsing or converting to CSV:', error);
  }
};


const isValidJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

function convertToDataTableFormat(jsonData: string) {
  let parsedJSONData:Record<string, any> = JSON.parse(jsonData);;
  parsedJSONData = JSON.parse(jsonData);

  const dataTableData = Object.keys(parsedJSONData).map(key => {
    return {
      field: key,
      type: parsedJSONData[key]
    };
  });

  return dataTableData;
}

function goToGraph() {
  const path = `/ontologies/${ontology.value}/graph`;
  const query = route.query.code ? { code: route.query.code } : {};
  router.push({ path, query });
}

function getNodeMap(nodes: Node[]): Map<string, Node> {
  const map = new Map<string, Node>();

  function traverse(nodes: Node[]) {
    for (const node of nodes) {
      map.set(node.key, node);
      if (node.children) {
        traverse(node.children);  // Recurse into children
      }
    }
  }

  traverse(nodes);
  return map;
}

onMounted(async () => {
  isLoadingTree.value = true;
  try {
    loadOntologies();
    if (query.value) {
      const ancestors = (await OntologyService.getAncestors(query.value)).data.ancestors ?? [];
      for (const ancestor of ancestors) {
        const nodeMap = getNodeMap(nodes.value);
        const matchedNode = nodeMap.get(ancestor);
        
        if (matchedNode) {
          await onNodeExpand(matchedNode);  
        } else {
          console.log(`No match found for ancestor: ${ancestor}`);
        }
      }
      selectedNode.value = getNodeMap(nodes.value).get(query.value);


    }
  } catch (error) {
    console.error("Error loading ancestors or nodes:", error);
  }
  isLoadingTree.value = false;
});
</script>