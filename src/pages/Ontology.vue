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
            {{ ontology }}
          </template>
          <template #content>
            <template v-if="isLoadingTree">
              <ProgressSpinner />
            </template>
            <template v-else>
              <Tree :value="nodes"
                @node-expand="onNodeExpand"
                @nodeSelect="onNodeSelect"
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
          <h3>{{ selectedNode.label }}</h3>
          <ul>
            <li v-for="(value, key) in selectedNode.data" :key="key">
              <strong v-if="key != 'sample'">{{ key }}:</strong> 
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
import { useRoute } from 'vue-router';
import {
  Node
} from "../interfaces";

import Button from 'primevue/button';
import Card from 'primevue/card';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';

import { OntologyService } from "../composables";

const nodes = ref<Node[]>([]);
const route = useRoute();
const query = ref();
const isLoadingTree = ref(true);
const ontology = ref((route.params.ontology as string).toUpperCase());

const selectedKey = ref();
const selectedNode = ref();


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
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    nodes.value.map((node) => (
      node.loading = false,
      node.isLoaded = false
    ));
    isLoadingTree.value = false;
  }
};


/**
 * Get the children of the node from the backend if node is not expanded already
 * @param node node to be expanded
 */
const onNodeExpand = (node: Node): void => {
  if (!node.isLoaded){
    const children = ref<Node[]>([]);
    if (!node.leaf) node.loading = true;

    setTimeout(() => {
      let notation = node.data.notation ?? node.data.identifier;
      
      OntologyService.getNodeChildren(notation).then(async (data) => {
        children.value = data.data.entries;

        node.children = children.value;
        node.children.forEach((child) => {
          child.loading = false;
        });
        node.loading = false;
        node.isLoaded = true;
      }).catch((error) => {
        console.error("Error fetching data:", error);
        node.loading = false;
      });
    }, 500);
  }
}

const downloadCSV = () => {
  try {
    // Get sample data from selectedNode
    const sampleData = JSON.parse(selectedNode.value.data.sample);
    
    // Prepare the CSV header
    const headers = Object.keys(sampleData);
    const csvRows = [];
    
    // Add the header row to CSV
    csvRows.push(headers.join(','));

    // Get the maximum number of rows in any of the arrays
    const maxRows = Math.max(...Object.values(sampleData).map(arr => arr.length));

    // Create rows for CSV
    for (let i = 0; i < maxRows; i++) {
      const row = headers.map(header => {
        // Get the value for each header, or an empty string if undefined
        return sampleData[header][i] !== undefined ? sampleData[header][i] : '';
      });
      csvRows.push(row.join(','));
    }

    // Create a CSV string
    const csvString = csvRows.join('\n');

    // Open the CSV in a new tab
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

function convertToDataTableFormat(jsonData) {
  if (typeof jsonData === 'string') {
    jsonData = JSON.parse(jsonData);
  }

  const dataTableData = Object.keys(jsonData).map(key => {
    return {
      field: key,
      type: jsonData[key]  // Assume the first item determines the type
    };
  });

  return dataTableData;
}

onMounted(() => {
  isLoadingTree.value = true;
  loadOntologies();
});
</script>