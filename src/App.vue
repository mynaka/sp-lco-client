<script setup lang="ts">
  import { defineComponent } from 'vue';
  import Navbar from './components/Navbar.vue';
  
</script>

<template>
  <div>
      <Navbar />
      <router-view />
  </div>
</template>

<style scoped>
</style>
