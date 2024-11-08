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
        Liver Cancer Ontology Lookup Service
      </div>
    </template>
    <template #content>
      <div class="flex justify-center items-center">
        <Floatlabel class="mt-8 mx-auto">
        <AutoComplete 
          v-model="searchTerm" 
          optionLabel="name"
          inputId="term"
          class="h-10"
          :suggestions="filteredTermOptions" 
          @complete="search">
          <template #option="slotProps">
            <li @click="handleItemClick(slotProps.option)">
              <div class="flex items-center justify-between w-full">
                <div class="flex-1 truncate">
                  {{ slotProps.option.name.length > 30 ? slotProps.option.name.slice(0, 30) + '...' : slotProps.option.name }}
                </div>
                <div>
                  <Button class="h-6 ml-2" 
                    :label="getButtonLabel(slotProps.option)" 
                    :severity="getButtonSeverity(slotProps.option)" 
                    :style="{ 'pointer-events': 'none' }"
                    rounded/>
                </div>
              </div>
            </li>
          </template>
        </AutoComplete>
        <label for="term">Search for a Term</label>
        </Floatlabel>
      </div>
      <div class="bg-white h-[20px]"></div>
    </template>
  </Card>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';

  import Button from 'primevue/button';
  import Card from 'primevue/card';
  import AutoComplete from 'primevue/autocomplete';
  import Floatlabel from 'primevue/floatlabel';


  import {
    OntologyService
  } from "../composables";
  import {
    SearchTerm
  } from "../interfaces";
  import Navbar from '../components/Navbar.vue';

  const router = useRouter();
  const filteredTermOptions = ref<SearchTerm[]>([]);
  const searchTerm = ref('');

  function search(event: { query: string; }) {
    setTimeout(async () => {
        try {
            const response = await OntologyService.getSearchTerms(event.query);
            filteredTermOptions.value = response.data.entries;
        } catch (error) {
            console.error("Error fetching search terms:", error);
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
    return option.code.startsWith('ICD10CM:')  
      ? 'info' 
      : option.code.startsWith('MPO:')
      ? 'contrast'
      : 'secondary';
  }
</script>