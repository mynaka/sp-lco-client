<template>
  <HomeLayout>
    <div class="min-h-screen flex items-center justify-center">
      <Card class="flex flex-col justify-center lg:w-2/4 sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full border-white p-8 shadow-lg">
      <template #title>
        <div class="flex justify-center">
          <img src="../assets/logo/uplb-official-logo.png" width="200" alt="UPLB Logo" />
        </div>
        <div class="text-center sm:text-2xl text-sm mt-2">
          Welcome to the Liver Cancer Ontology Lookup Service
        </div>
      </template>
      <template #content>
        <div class="flex justify-center items-center">
          <Floatlabel class="mt-8 mx-auto">
          <AutoComplete 
            v-model="searchTerm" 
            optionLabel="name"
            inputId="term"
            class="h-10 min-w-10"
            :suggestions="filteredTermOptions" 
            @complete="search">
            <template #option="slotProps">
              <li @click="handleItemClick(slotProps.option)">
                <div class="flex items-center justify-between w-full">
                  <div>{{ slotProps.option.name }}</div>
                  <Button class="h-6 ml-2" 
                  :label="getButtonLabel(slotProps.option)" 
                  :severity="getButtonSeverity(slotProps.option)" 
                  :style="{ 'pointer-events': 'none' }"
                  rounded/>
                </div>
              </li>
            </template>
          </AutoComplete>
          <label for="term">Search for a Term</label>
          </Floatlabel>
        </div>
        <div class="bg-white h-[20px]"></div>
        <div class="flex justify-center items-center">OR</div>
        <div class="flex justify-center items-center">Look for terms in the following Ontologies</div>
        <div class="flex justify-center items-center">
          <Button 
            class="h-16 w-32 sm:h-20 sm:w-40 mt-5 flex items-center justify-center"
            severity="info"
            @click="redirectToOntology('doid')"
            outlined
          >
            <img src="../assets/logo/do-color-logo.png" alt="Button Icon" class="h-full w-auto object-contain"/>
          </Button>
        </div>
        <div class="flex justify-center items-center">
        <Button 
            class="h-16 w-32 sm:h-20 sm:w-40 mt-5 flex items-center justify-center"
            severity="contrast"
            @click="redirectToOntology('mondo')"
            outlined
          >
            <img src="../assets/logo/mondo-logo.png" alt="Button Icon" class="h-full w-auto object-contain"/>
          </Button>
        </div>
      </template>
    </Card>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
  import HomeLayout from '../../src/layouts/home.vue';
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';

  import Button from 'primevue/button';
  import Card from 'primevue/card';
  import AutoComplete from 'primevue/autocomplete';
  import Floatlabel from 'primevue/floatlabel';
  import { FilterMatchMode, FilterService } from '@primevue/core/api';

  import {
    OntologyService
  } from "../composables";
  import {
    SearchTerm
  } from "../interfaces";

  const router = useRouter();
  const termOptions = ref<SearchTerm[]>([]);
  const filteredTermOptions = ref<SearchTerm[]>([]);
  const searchTerm = ref('');

  function search(event: { query: string; }) {
    setTimeout(() => {
      const query = event.query.trim().toLowerCase();
      if (!query.length) {
        filteredTermOptions.value = [...termOptions.value];
      } else {
        filteredTermOptions.value = FilterService.filter(termOptions.value, ['name'], query, FilterMatchMode.CONTAINS);

        // sort them putting terms starting with the query before those only containing the query
        filteredTermOptions.value.sort((a, b) => {
          const startsWithQueryA = a.name.toLowerCase().startsWith(query) ? -1 : 0;
          const startsWithQueryB = b.name.toLowerCase().startsWith(query) ? -1 : 0;
          
          if (startsWithQueryA !== startsWithQueryB) {
            return startsWithQueryA - startsWithQueryB;
          } else {
            return a.name.toLowerCase().indexOf(query) - b.name.toLowerCase().indexOf(query);
          }
        });
      }
    }, 250);
  }

  function handleItemClick(option: SearchTerm) {
    const ontologyLabel = getButtonLabel(option).toLocaleLowerCase();
    const code = option.code;

    console.log(`Redirecting to /ontologies/${ontologyLabel}/classes?code=${code}`);

    router.push({
      path: `/ontologies/${ontologyLabel}/classes`,
      query: { code: code }
    });
  }

const redirectToOntology = (ontology: string) => {
  const url = `/ontologies/${ontology}/classes`;
  router.push(url);
};

  /**
   * @param option 
   * @return source of option.code (option.code goes by format {source}:{id})
   */
  function getButtonLabel(option: SearchTerm) {
    const index = option.code.indexOf(':');
    if (index !== -1) {
      return option.code.substring(0, index);
    }
    return option.code;
  }

  function getButtonSeverity(option: SearchTerm) {
    return option.code.startsWith('DOID:')  
      ? 'info' 
      : option.code.startsWith('DOID:')
      ? 'contrast'
      : 'secondary';
  }

  onMounted(() => {
    OntologyService.getAllTerms().then((data) => {
        if (data && data.data && data.data.entries) {
          data.data.entries.forEach((entry: any) => {
            termOptions.value.push(entry);
          });
        }
      });
  });
</script>