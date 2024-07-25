<template>
  <nav class="shadow bg-white">
    <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
      <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img src="../assets/logo/uplb-official-logo.png" class="h-8 md:h-10 lg:h-12" alt="UPLB Logo" />
        <span class="self-center text-l md:text-xl lg:text-2xl font-semibold whitespace-nowrap">Liver Cancer Ontologies</span>
      </a>
      <div class="hidden w-full md:block md:w-auto" id="navbar-solid-bg">
        <ul
          class="flex flex-col font-medium mt-4 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700"
        >
          <div class="card flex" v-if="!isAuth">
            <Button
              label="Login"
              class="h-8 text-white login-button"
              @click="toggle"
            />
            <Popover ref="loginToggle">
              <div class="flex flex-col gap-4">
                <FloatLabel class="mt-4 w-full">
                  <InputText id="username" v-model="username" />
                  <label for="username">Username</label>
                </FloatLabel>
                <FloatLabel class="mt-4">
                  <Password 
                    v-model="password"  
                    class="mb-4 w-full"
                    :feedback="false"
                    toggleMask
                  />
                  <label for="password">Password</label>
                </FloatLabel class="mt-4">
                <Button
                  label="Submit"
                  class="mt-2 h-8 text-white login-button"
                  :loading="loading"
                  @click="handleSubmit"
                />
                </div>
            </Popover>
          </div>
          <div v-else>
            <Button
              :label="userLogged"
              class="h-8 text-white"
              @click="profileToggle"
            />
            <Popover ref="profileToggleRef">
              <div class="bg-white rounded-lg shadow-md p-2">
                <!-- ADD CLASS -->
                <Button
                  class="w-full px-2 py-2 hover:bg-gray-200 text-sm"
                  label="Add Class"
                  severity="secondary"
                  text
                />
                <!-- LOGOUT -->
                <Button
                  class="w-full px-2 py-2 hover:bg-gray-200 text-sm"
                  label="Log out"
                  text
                  severity="secondary"
                  @click="logout"
                />
              </div>
            </Popover>
          </div>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Password from 'primevue/password';
import Popover from 'primevue/popover';
import Toast from 'primevue/toast';
import { useUserStore } from '../stores/userStore';

export default defineComponent({
  name: 'Navbar',
  components: {
    Button,
    FloatLabel,
    InputText,
    Password,
    Popover,
    Toast
  },
  setup() {
    const loginToggle = ref<any>(null);
    const username = ref<string>('');
    const password = ref<string>('');
    const userStore = useUserStore();
    const profileToggleRef = ref<any>(null);

    const isAuth = computed(() => userStore.isAuthenticated);
    const userLogged = ref();
    const token = ref();
    const loading = ref(false);

    const toggle = (event: any) => {
      loginToggle.value.toggle(event);
    }

    const profileToggle = (event: any) => {
      profileToggleRef.value.toggle(event);
    }

    const handleSubmit = async () => {
      loading.value = true;
      const login = await userStore.login(username.value, password.value);
      if (login != "fail"){
        console.log('Login successful');
        token.value = userStore.token;
        userLogged.value = userStore.getUsername;
      }
      loading.value = false;
    };

    const logout = async () => {
      // Implement your logout logic here
      console.log('Logging out...');
      // Example:
      userStore.logout();
    };

    return {
      loginToggle,
      username,
      password,
      isAuth,
      userLogged,
      toggle,
      handleSubmit,
      loading,
      logout,
      profileToggle,
      profileToggleRef
    };
  }
});
</script>

<style scoped>
.login-button {
  background-color: maroon !important;
  border: 2px solid maroon !important;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.login-button:hover {
  background-color: white !important;
  color: maroon !important;
  border-color: maroon !important;
}
</style>