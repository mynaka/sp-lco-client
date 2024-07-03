<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-gray-100 p-8 rounded-lg shadow-lg flex flex-col justify-center items-center">
    <form class="flex flex-col md:flex-row gap-3">
      <div class="flex">
        <input type="text" placeholder="Search Terms" v-model="searchTerm"
        class="w-full md:w-80 px-3 h-10 rounded-l border-2 border-red-700 focus:outline-none focus:border-red-700"
        >
          <button @click="search" type="button" class="bg-red-700 text-white rounded-r px-2 md:px-3 py-0 md:py-1">Search</button>
      </div>
      <MultiSelect 
        v-model="selectedOntology" 
        :options="ontology_options" 
        filter 
        placeholder="Select Ontologies"
        :maxSelectedLabels="3" class="w-full md:w-80" />
  </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import MultiSelect from 'primevue/multiselect';
  import { ref } from 'vue';

  const selectedOntology = ref([]);
  const ontology_options = ref([
    'DOID'
  ]);

  const searchTerm = ref();

  function search() {
    console.log(selectedOntology);
    console.log(searchTerm);
  }
</script>

<style scoped>
</style>
  