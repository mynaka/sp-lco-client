import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from '../pages/Home.vue';
import Ontology from '../pages/Ontology.vue';
import Graph from '../pages/Graph.vue';

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: Home },
  { path: '/ontologies/:ontology/classes', component: Ontology },
  { path: '/ontologies/:ontology/graph', component: Graph }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
