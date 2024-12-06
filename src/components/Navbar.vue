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
              <form class="flex flex-col gap-4">
                <FloatLabel class="mt-4 w-full">
                  <InputText id="username" v-model="username" autocomplete="username" />
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
                </FloatLabel>
                <Button
                  label="Login"
                  class="mt-2 h-8 text-white login-button"
                  :loading="loading"
                  @click="handleLogin"
                />
              </form>
            </Popover>
          </div>
          <div v-else>
            <Button
              :label="userLogged"
              class="h-8 text-white user-button"
              @click="profileToggle"
            />
            <Popover ref="profileToggleRef">
              <div class="bg-white rounded-lg shadow-md p-2">
                <!-- ADD CLASS -->
                <Button
                  class="w-full px-2 py-2 hover:bg-gray-200 text-sm"
                  label="Add Entry"
                  severity="secondary"
                  text
                  @click="addClassIsVisible=true"
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
    <!-- DIALOG -->
    <Dialog class="flex w-1/2" v-model:visible="addClassIsVisible" modal header="Add Class">
      <EntryEditor
        :operation="'create'"
      />
    </Dialog>
  </nav>
</template>

<script setup lang="ts">
  import { computed, Ref, ref } from 'vue';
  import { useToast } from 'primevue/usetoast';

  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import FloatLabel from 'primevue/floatlabel';
  import Password from 'primevue/password';
  import Popover from 'primevue/popover';


  import { useUserStore } from '../stores/userStore';
  import EntryEditor from './EntryEditor.vue'

  const toast = useToast();

  // Navbar Profile Reactive Refs
  /**
   * A reactive reference that controls the \<Login\> Popover state if no user is logged in.
   * @type {Ref\<any\>}
   */
  const loginToggle: Ref<any> = ref(null);
  /**
   * A reactive reference that controls the \<Profile\> Popover state if a user is logged in.
   * @type {Ref\<any\>}
   */
  const profileToggleRef: Ref<any> = ref(null);
  /**
   * A reactive reference that controls the \<Add Class\> Card visibility state.
   * @type {Ref\<boolean\>}
   */
  const addClassIsVisible: Ref<boolean> = ref(false);

  const username = ref<string>('');
  const password = ref<string>('');
  const loading = ref<boolean>(false);

  // Auth stores
  const userStore = useUserStore();
  const isAuth = computed(() => userStore.isAuthenticated);
  const userLogged = computed(() => userStore.getUsername);

  // Button handlers
  const toggle = (event: any) => {
    loginToggle.value.toggle(event);
  };

  const profileToggle = (event: MouseEvent) => {
    profileToggleRef.value.toggle(event);
  };

  // Login/logout actions
  const handleLogin = async () => {
    loading.value = true;
    const login = await userStore.login(username.value, password.value);
    if (login !== "fail") {
      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'You have successfully logged in.',
        life: 3000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: 'Invalid username or password.',
        life: 3000
      });
    }
    loading.value = false;
  };

  const logout = () => {
    userStore.logout();
  };
</script>


<style scoped>
.login-button {
  background-color: rgb(133, 0, 55) !important;
  border: 2px solid rgb(133, 0, 55) !important;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.login-button:hover {
  background-color: white !important;
  color: rgb(133, 0, 55) !important;
  border-color: rgb(133, 0, 55) !important;
}

.user-button {
  background-color: rgb(13, 96, 59) !important;
  border: 2px solid rgb(13, 96, 59) !important;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.user-button:hover {
  background-color: white !important;
  color: rgb(13, 96, 59) !important;
  border-color: rgb(13, 96, 59) !important;
}

.other-button {
  background-color: rgb(255, 173, 13) !important;
  border: 2px solid rgb(255, 173, 13) !important;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}

.other-button:hover {
  background-color: white !important;
  color: rgb(255, 173, 13) !important;
  border-color: rgb(255, 173, 13) !important;
}
</style>
