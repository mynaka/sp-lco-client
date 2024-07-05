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
            class="h-10"
            :suggestions="filteredTermOptions" 
            @complete="search">
            <template #option="slotProps">
              <li @click="handleItemClick(slotProps.option)">
                <div class="flex items-center">
                  <div>{{ slotProps.option.name }} | </div>
                  <div>| {{ getSourceFromCode(slotProps.option.code) }}</div>
                </div>
              </li>
            </template>
          </AutoComplete>
          <label for="term">Search for a Term</label>
          </Floatlabel>
        </div>
        <div class="bg-white h-[20px]"></div>
        <div class="flex justify-center items-center">OR</div>
      </template>
    </Card>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
  import HomeLayout from '../../src/layouts/home.vue';
  import { ref, onMounted } from 'vue';
  //import Button from 'primevue/button';
  import Card from 'primevue/card';
  import AutoComplete from 'primevue/autocomplete';
  import Floatlabel from 'primevue/floatlabel';
  import {
    OntologyService
  } from "../composables";
  import {
    SearchTerm
  } from "../interfaces";


  const termOptions = ref<SearchTerm[]>([]);
  const filteredTermOptions = ref<SearchTerm[]>([]);
  const searchTerm = ref('');

  function search(event: { query: { trim: () => { (): any; new(): any; length: any; }; toLowerCase: () => string; }; }) {
    setTimeout(() => {
      if (!event.query.trim().length) {
        filteredTermOptions.value = [...termOptions.value];
      } else {
        filteredTermOptions.value = termOptions.value.filter((term) => {
          return term.name.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
    }, 250);
  }

  function handleItemClick(option: SearchTerm) {
    console.log(option.code);
  }

  function getSourceFromCode(code: string): string {
    const index = code.indexOf(':');
    if (index !== -1) {
      return code.substring(0, index);
    }
    return code;
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

<style scoped>
</style>
  