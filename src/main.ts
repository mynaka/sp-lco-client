import { createApp } from 'vue'
import { createPinia } from 'pinia';
import './index.css'
import App from './App.vue'
import router from './router';
import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';

const app = createApp(App).use(router);
const pinia = createPinia();
app.use(pinia);
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            prefix: 'p',
            darkModeSelector: 'false',
        }
    }
});
app.mount('#app');
