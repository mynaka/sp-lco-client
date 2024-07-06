<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import Navbar from './components/Navbar.vue';

  const route = useRoute();
  const showNavbar = computed(() => (route.path === '/' || route.path === '/home'));
</script>

<template>
  <div id="app">
    <!-- Conditionally render the Navbar -->
    <Navbar v-if="!showNavbar" />
    <router-view />
  </div>
</template>
<style scoped>
</style>
