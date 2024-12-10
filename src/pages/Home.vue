<template>
  <div class="fixed w-full">
    <Navbar />
  </div>
  <div class="min-h-screen flex items-center justify-center">
    <Card class="flex flex-col justify-center lg:w-2/4 sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full border-white p-8 shadow-lg">
    <template #title>
      <div class="flex justify-center">
        <img src="../assets/logo/uplb-official-logo.png" width="200" alt="UPLB Logo" />
      </div>
      <div class="text-center sm:text-2xl text-sm mt-2">
        Term Ontology Lookup Service
      </div>
    </template>
    <template #content>
      <div class="flex justify-center items-center">
        <SearchBar                
          :floatMessage="searchMsg"
          :func="component"/>
      </div>
      <div class="bg-white h-[20px]"></div>
      <div class="flex justify-center items-center">OR</div>
      <div class="flex justify-center items-center">Look for terms in the following Ontologies</div>
      <div class="flex justify-center items-center">
        <Button 
          class="h-16 w-1/3 mt-5 flex items-center justify-center"
          severity="warn"
          @click="redirectToOntology('omp')"
        ><strong>Ontology of Microbial Phenotypes</strong>
        </Button>
      </div>
      <div class="flex justify-center items-center">
        <Button 
          class="h-16 w-1/3 mt-5 flex items-center justify-center"
          severity="contrast"
          @click="redirectToOntology('ncbi')"
          outlined
        >
        <strong>NCBI Pathogen/Gene Ontology  </strong>
        </Button>
      </div>
      <div class="flex justify-center items-center">
        <Button 
          class="h-16 w-1/3 mt-5 flex items-center justify-center"
          @click="redirectToOntology('doid')"
          severity="info"
        >
        <strong>Disease Ontology</strong>
        </Button>
      </div>
      <div class="flex justify-center items-center">
        <Button 
          class="h-16 w-1/3 mt-5 flex items-center justify-center"
          @click="redirectToOntology('table')"
        >
        <strong>Convert Datasets to Controlled Vocabularies</strong>
        </Button>
      </div>
    </template>
  </Card>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  import Button from 'primevue/button';
  import Card from 'primevue/card';
  import Navbar from '../components/Navbar.vue';
  import SearchBar from '../components/SearchBar.vue';

  const router = useRouter();
  const searchMsg = ref<string>('Search for a Term');
  const component = ref<string>('Home');

  function redirectToOntology(ontology: string) {
    const path = `/ontologies/${ontology}/classes`;
    router.push({ path });
  }
</script>