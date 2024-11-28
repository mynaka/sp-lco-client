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
      <div>
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

            <div class="mt-8"><strong>Data (Optional):</strong></div>
            <div v-for="(item, index) in dataFields" :key="index" class="flex flex-col gap-2 mb-4 mt-2">
              <!-- Key Input -->
              <div class="flex items-center gap-2">
                <InputText
                  v-model="item.key" 
                  placeholder="Key" 
                  class="w-1/2"
                  :disabled="disableRemoveButton(index)"
                />              
                <!-- Dropdown for Type -->
                <Select
                  v-model="item.type" 
                  :options="availableOptions[index]" 
                  placeholder="Select Type" 
                  class="w-1/4"
                  :disabled="disableRemoveButton(index)"
                />

                <!-- Remove Button -->
                <Button 
                  label="Remove Data"
                  class="other-button"
                  @click="removeField(index)" 
                  :disabled="disableRemoveButton(index)" 
                  type="button"
                />
              </div>

              <!-- TEXT -->
              <TextArea 
                v-if="item.type=='Text'"
                v-model="item.value" 
                placeholder="Value" 
                class="w-full" 
                rows="3"
              />
              
              <!-- LIST -->
              <div v-else-if="item.type=='List'" class="flex flex-col gap-2 mb-4 mt-4">
                <div 
                  v-if="item.value"
                  class="flex flex-wrap gap-2 mb-2"
                >
                  <div 
                    v-for="(itemContent, index) in item.value" 
                    :key="index" 
                    class="flex items-center gap-2 mb-2"
                  >
                    <div class="flex-grow flex items-center gap-1 border rounded px-2 py-1 bg-gray-100">
                      <span class="truncate">{{ itemContent }}</span>
                    </div>
                    <button 
                      type="button"
                      class="text-red-500 hover:text-red-700 font-bold"
                      @click="removeItemFromDataList(item.value, index)"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <!-- ADD TO LIST -->
                <div class="flex flex-row gap-2 mt-2">
                  <FloatLabel variant="on" class="flex-grow">
                    <InputText 
                      class="w-full" 
                      type="text" 
                      id="id" 
                      v-model="listText" 
                    />
                    <label for="id">Add Item on the List</label>
                  </FloatLabel>

                  <Button
                    class="w-auto"
                    label="Add to List" 
                    @click="addToDataList(item.value, listText)" 
                    type="button"
                  />
                </div>
              </div>

              <!-- TABLE FORMAT -->
              <div  v-else-if="item.type=='Table Format'">
                <DataTable :value="item.value" editMode="cell" @cell-edit-complete="onCellEditComplete"
                  :pt="{
                      table: { style: 'min-width: 50rem' },
                      column: {
                          bodycell: ({ state }: any) => ({
                              class: [{ '!py-0': state['d_editing'] }]
                          })
                      }
                  }"
                >
                  <Column v-for="col of tableFormatCols" :key="col.field" :field="col.field" :header="col.header" style="width: 25%">
                    <template #body="{ data, field }">
                        {{ data[field] }}
                    </template>
                    <template #editor="{ data, field }">
                      <InputText v-model="data[field]" :disabled="disableRemoveButton(index)" autofocus fluid />
                    </template>
                  </Column>
                </DataTable>
                <div class="mt-4 flex justify-end gap-2">
                  <Button label="Add Row" 
                  @click="addTableRow(item.value, 'format')" 
                  v-if="!disableRemoveButton(index)"/>
                </div>
              </div>

              <!-- SAMPLE DATA -->
              <div  v-else-if="item.type=='Sample Data'">
                <DataTable :value="item.value" editMode="cell" @cell-edit-complete="onCellEditComplete"
                  :pt="{
                      table: { style: 'min-width: 50rem' },
                      column: {
                          bodycell: ({ state }: any) => ({
                              class: [{ '!py-0': state['d_editing'] }]
                          })
                      }
                  }"
                >
                  <Column v-for="col of sampleTableCols" :key="col.field" :field="col.field" :header="col.header" style="width: 25%">
                    <template #body="{ data, field }">
                        {{ data[field] }}
                    </template>
                    <template #editor="{ data, field }">
                      <InputText v-model="data[field]" :disabled="disableRemoveButton(index)" autofocus fluid />
                    </template>
                  </Column>
                </DataTable>
                <div class="mt-4 flex justify-end gap-2">
                  <Button label="Add Row" 
                  @click="addTableRow(item.value, 'sample')" 
                  v-if="!disableRemoveButton(index)"/>
                </div>
              </div>

              <!-- PROTEIN SEQUENCE -->
              <div  v-else-if="item.type=='Protein Sequence'">
                <DataTable :value="item.value" editMode="cell" @cell-edit-complete="onCellEditComplete"
                  :pt="{
                      table: { style: 'min-width: 50rem' },
                      column: {
                          bodycell: ({ state }: any) => ({
                              class: [{ '!py-0': state['d_editing'] }]
                          })
                      }
                  }"
                >
                  <Column v-for="col of tableProteinSequenceCols" :key="col.field" :field="col.field" :header="col.header" style="width: 25%">
                    <template #body="{ data, field }">
                        {{ data[field] }}
                    </template>
                    <template #editor="{ data, field }">
                      <InputText v-model="data[field]" autofocus fluid />
                    </template>
                  </Column>
                </DataTable>
              </div>

              <!-- FEATURES -->
              <div  v-else-if="item.type=='Site Features'">
                <DataTable :value="item.value" editMode="cell" @cell-edit-complete="onCellEditComplete"
                  :pt="{
                      table: { style: 'min-width: 50rem' },
                      column: {
                          bodycell: ({ state }: any) => ({
                              class: [{ '!py-0': state['d_editing'] }]
                          })
                      }
                  }"
                >
                  <Column v-for="col of featureCols" :key="col.field" :field="col.field" :header="col.header" style="width: 25%">
                    <template #body="{ data, field }">
                        {{ data[field] }}
                    </template>
                    <template #editor="{ data, field }">
                      <InputText v-model="data[field]" autofocus fluid />
                    </template>
                  </Column>
                </DataTable>
                <div class="mt-4 flex justify-end gap-2">
                  <Button label="Add Row" 
                  @click="addTableRow(item.value, 'features')" 
                  v-if="!disableRemoveButton(index)"/>
                </div>
              </div>

              <div class="col-span-3 bg-gray-400 h-[2px]"></div>
            </div>
              <Button 
                label="Add Data"
                class="user-button"
                severity="success"
                @click="addField"
                type="button"
              />
            </div>
          </div>
          <Button type="submit" label="Submit" :loading="addEntryLoading" class="w-full user-button" />
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
  import { computed, Ref, ref, watch } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { OntologyService } from '../composables';
  import { Form } from '@primevue/forms';
  import { zodResolver } from '@primevue/forms/resolvers/zod';
  import { z } from 'zod';
  import SearchBar from './SearchBar.vue';

  import Button from 'primevue/button';
  import Column from 'primevue/column'
  import Dialog from 'primevue/dialog';
  import DataTable from 'primevue/datatable';
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
  const addEntryLoading = ref<boolean>(false);

  /**
   * Reactive variable for available Select options in the Data section
   */
  const firstTableFormatIndex = ref<number | null>(null);
  const availableOptions = computed(() => {
    const options = ['Text', 'List', 'Table Format', 'Protein Sequence', 'Sample Data', 'Site Features'];
    
    return dataFields.value.map((field, index) => {
      if (field.type === 'Table Format' && firstTableFormatIndex.value === null) {
        firstTableFormatIndex.value = index;
      }
      
      // Remove table format if already in form
      const disabledOptions = 
        (firstTableFormatIndex.value == index || firstTableFormatIndex.value == null) ? options.filter(option => option !== 'Sample Data')
        : options.filter(option => option !== 'Table Format');

      return disabledOptions;
    });
  });


  const entryType = ref();
  const prefLabel = ref<string>('');
  const identifier = ref<string>('');
  const selectedParents = ref<SearchTerm[]>([]);
  const listText = ref<string>('');

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

  interface ColumnType {
    field: string;
    header: string;
  }
  /**
   * columns of the Table Type input for Data
   */
  const tableFormatCols = ref<ColumnType[]>([
    { field: "field", header: "Field" },
    { field: "type", header: "Data Type" },
    { field: "desc", header: "Description (Optional)" }
  ]);
  const tableProteinSequenceCols = ref<ColumnType[]>([
    { field: "field", header: "Field" },
    { field: "value", header: "Value" },
  ]);
  const featureCols = ref<ColumnType[]>([
  { field: "type", header: "Type" },
  { field: "position", header: "Position/s" },
  { field: "desc", header: "Additional Information)" }
  ]);
  const sampleTableCols = computed<ColumnType[]>(() => {
    const sampleField = dataFields.value.find(field => field.type === 'Table Format');

    if (sampleField) {
      return sampleField.value.map((fieldValue: any) => ({
        field: fieldValue.field,
        header: fieldValue.field,
      }));
    }

    // Return an empty array if no 'sample' key is found.
    return [];
  });

  // Form validation
  const formInitialValues = ref({
    entry_type: { name: '', code: '' }
  });

  const resolver = ref(
    zodResolver(
      z.object({
        entry_type: z.union([
          z.object({
            name: z.string().min(1, "Entry type is required."),
          }),
          z.any().refine((_val) => false, { message: "Entry type is required." }),
        ]),
        pref_label: z.string().min(1, { message: "Preferred Label is required." }),
        id: z.string().min(1, { message: "Identifier is required." })
      })
    )
  );

  // Form handlers
  const onSubmitEntry = async ({ valid }: { valid: boolean }) => {
    addEntryLoading.value = true;

    if(dataFields.value.map(f => f.key).some((key, i, arr) => arr.indexOf(key) !== i)) {
      toast.add({
        severity: 'error',
        summary: 'Duplicate Data',
        detail: 'Data entry keys must be unique',
        life: 3000
      });
    } else if (
      dataFields.value.some(f => 
        f.key === '' || 
        f.type === '' || 
        (Array.isArray(f.value) && f.value.length === 0) || 
        (typeof f.value === 'string' && f.value === '')
    )){
      toast.add({
        severity: 'error',
        summary: 'Missing or Invalid Data',
        detail: 'All Data fields must be valid',
        life: 3000
      });
    } else if (valid) {
      const selectedParentsId = selectedParents.value.map(parent => parent.code);
      const formattedData = {
        data: {
          prefLabel: prefLabel.value,
          identifier: identifier.value,
          ...Object.fromEntries(
            dataFields.value.map((field) => {
              let formattedValue;

              try {
                const parsedValue = JSON.parse(field.value);
                formattedValue = JSON.stringify(parsedValue);
              } catch (e) {
                formattedValue = JSON.stringify(field.value);
              }

              return [field.key, formattedValue];
            })
          ),
        },
        parents: selectedParentsId,
        typeOfEntry: entryType.value.name,
      };
      await OntologyService.createEntry(formattedData, token.value).then((_data) => {
        addClassIsVisible.value = false;
        entryType.value = null;
        prefLabel.value = '';
        identifier.value = '';
        selectedParents.value = [];
        dataFields.value = [];

        toast.add({
          severity: 'success',
          summary: 'Form is submitted.',
          detail: 'Your form was successfully submitted.',
          life: 3000
        });
      })
      .catch((error) => {
        toast.add({
          severity: 'error',
          summary: 'Submission Failed',
          detail: error.response?.data?.detail || 'An unexpected error occurred.',
          life: 3000
        });
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields.',
        life: 3000
      });
    }
    addEntryLoading.value = false;
  };

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

  const handleSelectedNode = (node: SearchTerm) => {
    selectedParents.value.push(node);
  }
  const removeSelectedParent = (index: number) => {
    selectedParents.value.splice(index, 1);
  };
  const dataFields = ref<any[]>([]);

  function addField() {
    dataFields.value.push({ key: '', type: '', value: '' });
  }

  function removeField(index: number) {
    dataFields.value.splice(index, 1);
  }

  const addToDataList = (item: string[], text: string) => {
    if (item && text) {
      item.push(text);
    }
  };

  const removeItemFromDataList = (itemList: string[], index: number) => {
    itemList.splice(index, 1);
  }

  // DataTable
  const onCellEditComplete = (event: { data: any; newValue: any; field: any; }) => {
    let { data, newValue, field } = event;

    data[field] = newValue;
  };

  const addTableRow = (item: any, table: string) => {
    console.log("E")
    if (!item || Array.isArray(item)) {
      if (table == 'format') {
        const newRow = tableFormatCols.value.reduce((obj, col) => {
          obj[col.field] = "Click to Edit Value";
          return obj;
        }, {} as Record<string, any>);
        item.push(newRow);
      } else if (table == 'sample') {
        const newRow = sampleTableCols.value.reduce((obj, col) => {
          obj[col.field] = "Click to Edit Value";
          return obj;
        }, {} as Record<string, any>);
        item.push(newRow);
      } else if (table == 'features') {
        const newRow = featureCols.value.reduce((obj, col) => {
          obj[col.field] = "Click to Edit Value";
          return obj;
        }, {} as Record<string, any>);
        item.push(newRow);
      }
    }
  };

  watch(
    () => dataFields.value.map(item => item.type),
    (newValues, oldValues) => {
      newValues.forEach((newType, index) => {
        if (newType !== oldValues[index]) {
          if (oldValues[index] == 'Table Format') firstTableFormatIndex.value = null;
          if (newType == 'Table Format') {
            dataFields.value[index].value = [{
              field: "Click to Edit Value",
              type: "Click to Edit Value",
              desc: ""
            }];
            dataFields.value[index].key = 'format';
          } else if (newType == 'Text') {
            dataFields.value[index].value = "";
            dataFields.value[index].key = '';
          } else if (newType == 'List') {
            dataFields.value[index].value = [];
            dataFields.value[index].key = '';
          } else if (newType == 'Protein Sequence') {
            dataFields.value[index].value = [
              {
                field: "length",
                value: "Enter length of sequence"
              }, {
                field: "mass(Da)",
                value: "Enter mass in Daltons"
              }, {
                field: "sequence",
                value: "Enter protein sequence"
              }
            ];
            dataFields.value[index].key = 'sequence';
          } else if (newType == 'Sample Data') {
            const sampleData = sampleTableCols.value.map(col => ({
              [col.field]: "Click to Edit Value",
            }));
            const processedSampleData = Object.assign({}, ...sampleData);
            dataFields.value[index].value = [processedSampleData];
          } else if (newType == "Site Features") {
            dataFields.value[index].value = [{
              type: "Click to Edit Value",
              position: "Click to Edit Value",
              desc: ""
            }];
          }

        }
      });
    }
  );
  const disableRemoveButton = (index: number) => {
    const hasSampleTable = dataFields.value.some(item => item.type === 'Sample Data');
    
    return hasSampleTable && dataFields.value[index].type === 'Table Format';
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
