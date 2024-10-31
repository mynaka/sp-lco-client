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
              <!-- <Tree
                v-model:selectionKeys="selectedKey"
                :expandedKeys="expandedKeys"
                :filter="true"
                filterMode="strict"
                :value="nodes"
                selectionMode="single"
                :metaKeySelection="false"
                @nodeSelect="onNodeSelect"
                class="w-full h-full"
              /> -->
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
        v-if="selectedKey!=null">
        <template #title>
          {{ selectedNode.label }}
          <Button class="ml-2" 
            @click="downloadJson"
            label="Download JSON" 
            severity="info" 
            rounded/>
        </template>
        <template #content>
        </template>
      </Card>
      <Card class="mx-auto my-auto h-fit shadow-lg"
        v-else>
        <template #title class="justify-center items-center">
          SELECT A TERM TO VIEW
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
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

const isSearching = ref(true);

console.log(ontology.value);

if (route.query.code != null) {
  query.value = route.query.code;
}

const onNodeSelect = (node: any) => {
  // isSearching.value = false;
  // selectedNode.value = node;
  // cardContents.value = parsedElements.value;
  // query.value = node.key;
  console.log(node);
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
      let notation = node.data.notation;
      
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

const downloadJson = () => {
  // Parse `elements` string into a JSON object if it is a string
  let elementsObj;
  try {
    elementsObj = JSON.parse(selectedNode.value?.data?.elements || '{}');
  } catch (error) {
    console.error('Error parsing elements:', error);
    elementsObj = {}; // Default to an empty object if parsing fails
  }

  // Create a copy of selectedNode without the `children` field
  const { data: { children, parents = [], equivalents = [], ...restData }, ...rest } = selectedNode.value || {};

  // Prepare associated terms object conditionally
  const associatedTerms: { subset_of?: string[], equivalent_to?: string[] } = {};

  if (parents.length > 0) {
    associatedTerms.subset_of = parents.map((parent: any) => parent.code || '');
  }

  if (equivalents.length > 0) {
    associatedTerms.equivalent_to = equivalents.map((eq: any) => eq.code || '');
  }

  // Construct the JSON object to download
  const jsonToDownload = {
    name: selectedNode.value?.label || 'Unnamed Node',
    term_code: selectedNode.value?.key || 'Unknown Code',
    ...restData,
    elements: elementsObj,
    ...(Object.keys(associatedTerms).length > 0 ? { associated_terms: associatedTerms } : {})
  };

  const dataStr: string = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonToDownload, null, 2));
  const downloadAnchorNode: HTMLAnchorElement = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${ontology.value}_${selectedNode.value?.label || 'data'}.json`);
  document.body.appendChild(downloadAnchorNode); // Required for Firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

onMounted(() => {
  isLoadingTree.value = true;
  loadOntologies();
});
</script>