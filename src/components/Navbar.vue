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
                  label="Add Class"
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
      <div v-if="isUploadVisible">
        <Form 
          :initial-values="formInitialValues" 
          :resolver="resolver" 
          @submit="onSubmitEntry" 
          class="flex flex-col gap-4 w-full">
          <div class="flex flex-col gap-1 w-full">
            <Select
              v-model="entryType"
              name="entry_type"
              :options="classTypes" 
              optionLabel="name" 
              placeholder="Select a Class Type" 
              class="w-full" 
              fluid
            />
            <div v-if="entryType" class="w-full">
              <FloatLabel variant="on" class="mt-4 w-full">
                <InputText 
                  class="w-full" 
                  name="pref_label" 
                  type="text" 
                  id="pref_label" 
                  v-model="prefLabel" 
                />
                <label for="pref_label">Preferred Name</label>
              </FloatLabel>
              <FloatLabel variant="on" class="mt-4 w-full">
                <InputText 
                  class="w-full" 
                  name="id" 
                  type="text" 
                  id="id" 
                  v-model="identifier" 
                />
                <label for="id">Identifier/Notation</label>
              </FloatLabel>
              <div class="mt-4"><strong>Parents (Optional):</strong></div>
              <div class="flex items-center gap-2 flex-wrap">
              <div 
                v-if="selectedParents"
                v-for="(parent, index) in selectedParents" 
                :key="index" 
                class="flex items-center gap-1 border rounded px-2 py-1 bg-gray-100">
                <span class="truncate">{{ parent.name }}</span>
                <button 
                  class="text-red-500 hover:text-red-700 font-bold"
                  @click="removeSelectedParent(index)"
                >
                  ✕
                </button>
              </div>
            </div>
              <SearchBar
                @select-parent="handleSelectedNode"
                :floatMessage="addParentMsg"
                :func="component"
                />

                <div class="mt-8"><strong>Data:</strong></div>
                <div v-for="(item, index) in dataFields" :key="index" class="flex flex-col gap-2 mb-4 mt-2">
                  <!-- Key Input -->
                  <div class="flex items-center gap-2">
                    <InputText 
                      v-model="item.key" 
                      placeholder="Key" 
                      class="w-1/2"
                    />

                    <!-- Remove Button -->
                    <Button 
                      label="Remove Data" 
                      severity="danger"
                      @click="removeField(index)" 
                    />
                  </div>

                  <!-- Value TextArea -->
                  <TextArea 
                    v-model="item.value" 
                    placeholder="Value" 
                    class="w-full" 
                    rows="3"
                  />
                </div>

              <Button 
                label="Add Data" 
                severity="success"
                @click="addField" 
              />
            </div>
          </div>
          <Button type="submit" label="Submit" :loading="addEntryLoading" class="w-full" />
        </Form>

        <!-- <FileUpload 
        mode="basic" 
        name="demo[]" 
        customUpload
        accept="application/json, .obo" 
        :maxFileSize="1000000" 
        @uploader="onUpload"
        :auto="true" 
        chooseLabel="Browse" /> -->
      </div>
    </Dialog>
  </nav>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { OntologyService } from '../composables';
  import { Form } from '@primevue/forms';
  import { zodResolver } from '@primevue/forms/resolvers/zod';
  import { z } from 'zod';
  import SearchBar from './SearchBar.vue';

  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import InputText from 'primevue/inputtext';
  import FloatLabel from 'primevue/floatlabel';
  import Password from 'primevue/password';
  import Popover from 'primevue/popover';
  import Select from 'primevue/select';
  import TextArea from 'primevue/textarea';


  import { useUserStore } from '../stores/userStore';
import { SearchTerm } from '../interfaces';

  // PrimeVue Toast
  const toast = useToast();
  const component = ref("Nav");
  const addParentMsg = ref("Search for Parent Nodes")

  // Refs
  const loginToggle = ref<any>(null);
  const profileToggleRef = ref<any>(null);
  const addClassIsVisible = ref<boolean>(false);
  const isUploadVisible = ref<boolean>(true);

  const username = ref<string>('');
  const password = ref<string>('');
  const loading = ref<boolean>(false);
  const addEntryLoading = ref<boolean>(false);

  const entryType = ref();
  const prefLabel = ref<string>('');
  const identifier = ref<string>('');
  const selectedParents = ref<SearchTerm[]>([]);

  // Auth stores
  const userStore = useUserStore();
  const isAuth = computed(() => userStore.isAuthenticated);
  const userLogged = computed(() => userStore.getUsername);
  const token = computed(() => userStore.getToken);

  // Dropdown options
  const classTypes = ref([
    { name: 'Term', code: 'Term' },
    { name: 'Species', code: 'Species' },
    { name: 'Strain', code: 'Strain' },
    { name: 'Protein', code: 'Protein' },
  ]);

  // Form validation
  const formInitialValues = ref({
    entry_type: { name: '', code: '' }
  });

  const resolver = ref(zodResolver(
    z.object({
      entry_type: z.union([
        z.object({
          name: z.string().min(1, 'Entry type is required.')
        }),
        z.any().refine((_val) => false, { message: 'Entry type is required.' })
      ]),
      pref_label: z.string().min(1, { message: 'Preferred Label is required.' }),
      id: z.string().min(1, { message: 'Identifier is required.' })

    })
  ));

  // Form handlers
  const onSubmitEntry = async ({ valid }: { valid: boolean }) => {
    loading.value = true;
    if (valid) {
      const selectedParentsId = selectedParents.value.map(parent => parent.code);
      
      const formattedData = {
        data: {
          prefLabel: prefLabel.value,
          identifier: identifier.value,
          ...Object.fromEntries(
            dataFields.value.map((field) => {
              let parsedValue;

              try {
                parsedValue = JSON.parse(field.value);
              } catch (e) {
                parsedValue = field.value;
              }

              return [field.key, parsedValue];
            })
          ),
        },
        parents: selectedParentsId, 
        typeOfEntry: entryType.value.name
      };
      await OntologyService.createEntry(formattedData, token.value).then((_data) => {
        addClassIsVisible.value = false;
        entryType.value = null;
        prefLabel.value = '';
        identifier.value = '';
        selectedParents.value = [];
        dataFields.value = { key: '', value: '' };

        toast.add({
          severity: 'success',
          summary: 'Form is submitted.',
          detail: 'Your form was successfully submitted.',
          life: 3000
        });
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields.',
        life: 3000
      });
    }
    loading.value = false;
  };

  // Button handlers
  const toggle = (event: any) => {
    loginToggle.value.toggle(event);
  };

  const profileToggle = (event: any) => {
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

  const handleSelectedNode = (node: SearchTerm) => {
    selectedParents.value.push(node);
    console.log(selectedParents.value);
  }
  const removeSelectedParent = (index: number) => {
    selectedParents.value.splice(index, 1);
  };
  const dataFields = ref([
    { key: '', value: '' }
  ]);

function addField() {
  dataFields.value.push({ key: '', value: '' });
}

function removeField(index: number) {
  dataFields.value.splice(index, 1);
}
</script>


<style scoped>
.login-button {
  background-color: rgb(133, 0, 55) !important;
  border: 2px solid rgb(167, 69, 110) !important;
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
</style>
