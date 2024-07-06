import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import router from './router';
import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';

import 'primeicons/primeicons.css';

const app = createApp(App).use(router);
app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            prefix: 'p',
            darkModeSelector: 'false',
            cssLayer: {
            }
        }
    }
});
app.mount('#app');
