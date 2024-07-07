<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div class="hidden md:flex flex-auto md:w-1/4 flex-col">
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
    <div class="flex w-full md:w-3/4 p-4">
      <Card class="lg:w-2/4 sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg"
        v-if="selectedKey!=null">
        <template #title>
          {{ selectedNode.label }}
        </template>
        <template #content>
          {{ selectedNode.data }}
        </template>
      </Card>
      <Card class="mx-auto my-auto h-fit shadow-lg"
        v-else>
        <template #title class="justify-center items-center">
          SELECT A TERM TO VIEW
        </template>
      </Card>
      <!-- Your main content goes here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import Card from 'primevue/card';
import Tree from 'primevue/tree';
import ProgressSpinner from 'primevue/progressspinner';

import { OntologyService } from "../composables"; // Make sure this path is correct
import { queryObjects } from 'v8';

const nodes = ref([]);
const route = useRoute();
const query = ref();
const isLoadingTree = ref(true);
const ontology = ref(route.params.ontology.toUpperCase());

const selectedKey = ref();
const expandedKeys = ref({});
const selectedNode = ref();

console.log(ontology.value);

if (route.query.code != null) {
  query.value = route.query.code;
}

const onNodeSelect = (node: any) => {
  selectedNode.value = node;
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


onMounted(() => {
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
          onNodeSelect(node);
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
});
</script>