import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from '../pages/Home.vue';
import Ontology from '../pages/Ontology.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Home },
  { path: '/ontologies/:ontology/classes', component: Ontology }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
