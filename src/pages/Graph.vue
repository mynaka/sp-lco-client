<template>
  <Graph :ontology="ontology"/>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useRoute } from 'vue-router';
  import Graph from '../components/Graph.vue';

  const route = useRoute();
  const ontology = ref((route.params.ontology as string).toUpperCase());
  console.log(ontology.value);
</script>