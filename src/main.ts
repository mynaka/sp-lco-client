import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import router from './router';
import PrimeVue from 'primevue/config';
import Select from 'primevue/select';

const app = createApp(App).use(router);
app.use(PrimeVue);
app.component('Select', Select);
app.mount('#app');
