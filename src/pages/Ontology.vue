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
              <Tree
                v-model:selectionKeys="selectedKey"
                :expandedKeys="expandedKeys"
                :filter="true"
                filterMode="strict"
                :value="nodes"
                selectionMode="single"
                :metaKeySelection="false"
                @nodeSelect="onNodeSelect"
                class="w-full h-full"
              />
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
        </template>
        <template #content>
          <div class="p-4">
            <div class="list-disc pl-4">
              <div v-for="(values, key) in cardContents" :key="key">
                <strong>{{ key }}</strong>
                <div class="list-disc pl-4">
                  <div v-if="values instanceof Array" v-for="value in values" :key="value">{{ value }}</div>
                  <div v-else>{{ values }}</div>
                </div>
              </div>
              <div>
                <strong>subset_of</strong>
                <div class="list-disc pl-4">
                  <div v-for="value in selectedNodeParents">{{ value }}</div>
                </div>
              </div>
            </div>
          </div>
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

import Card from 'primevue/card';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';

import { OntologyService } from "../composables"; // Make sure this path is correct

const nodes = ref([]);
const route = useRoute();
const query = ref();
const isLoadingTree = ref(true);
const ontology = ref(route.params.ontology.toUpperCase());

const selectedKey = ref();
const expandedKeys = ref({});
const selectedNode = ref();
const selectedNodeParents = ref();
const cardContents = ref();

const isSearching = ref(true);

console.log(ontology.value);

if (route.query.code != null) {
  query.value = route.query.code;
}

const onNodeSelect = (node: any) => {
  isSearching.value = false;
  selectedNode.value = node;
  cardContents.value = parsedElements.value;
  query.value = node.key;
  isLoadingTree.value = true;
  loadOntologies();
};

const collectAncestors = (key: string, nodes: any[], ancestors: any[] = []): any[] | null => {
  for (const node of nodes) {
    if (node.key === key) {
      return [...ancestors, ...(node.data.parents || [])];
    }
    if (node.children && node.children.length > 0) {
      const result = collectAncestors(key, node.children, [...ancestors, node.key]);
      if (result) {
        return result;
      }
    }
  }
  return null;
};

const navigateToNode = (key: string) => {
  // close all expandedKeys
  for (const key in expandedKeys.value) {
    expandedKeys.value[key] = false;
  }

  const paths = nodes.value.map(node => collectAncestors(key, [node])).filter(path => path !== null);
  if (paths.length > 0) {
    selectedKey.value = { [key]: true };
    paths.forEach(pathToNode => {
      pathToNode!.forEach(parentKey => {
        expandedKeys.value[parentKey] = true;
      });
    });
  } else {
    console.log('Node not found');
  }
};

const loadOntologies = () => {
  OntologyService.getTermsDatabaseTree(ontology.value).then(async (data) => {
    nodes.value = data.data.entries;
    let foundNode = false;
    if (query.value != null) {
      const stack = [...nodes.value];
      while (stack.length > 0) {
        const node = stack.pop();
        //if node was found
        if (node.key == query.value) {
          foundNode = true;
          if (isSearching.value) onNodeSelect(node);
          break;
        }
        if (node.children && node.children.length > 0) {
          stack.push(...node.children);
        }
      }

      if (foundNode) {
        console.log('Found node');
      } else {
        console.log('Node not found with key:', query.value);
        // Handle no node found scenario
      }
    }

    await nextTick();
    isLoadingTree.value = false;

    if (foundNode) {
      navigateToNode(query.value);
      selectedKey.value = { [query.value]: true };
    }
  }).catch((error) => {
    console.error("Error fetching data:", error);
  });
}

const parsedElements = computed(() => {
  selectedNodeParents.value = selectedNode.value.data.parents;
  try {
    return JSON.parse(selectedNode.value.data.elements);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
});

onMounted(() => {
  loadOntologies();
});
</script>