<template>
    <div class="card flex justify-center">
      <Tree :value="nodes" class="w-full md:w-[30rem]"></Tree>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRoute } from 'vue-router';
  import Tree from 'primevue/tree';
  import { OntologyService } from "../composables"; // Make sure this path is correct
  
  const nodes = ref([]);
  const route = useRoute();
  const query = ref();
  const ontology = ref(route.params.ontology.toUpperCase());
  
  console.log(ontology.value);
  
  if (route.query.code != null) {
    query.value = route.query.code;
  }
  
  onMounted(() => {
    OntologyService.getTermsDatabaseTree(ontology.value).then((data) => {
      nodes.value = data.data;
      console.log(nodes.value); // Log the nodes to check the data structure
    });
  });
  </script>