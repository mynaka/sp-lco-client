<template>
  <div class="flex w-full min-w-3/4 md:w-3/4 p-4 overflow-y-auto">
    <Card class="lg:w-full sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg"
      v-if="selectedNode!=null">
      <template #title>
        {{ selectedNode.label }}
        <div class="flex items-center space-x-2">
          <Button class="text-sm px-3 py-1" 
            v-if="selectedNode.data.sample"
            @click="downloadCSV"
            label="Download Sample CSV" 
            severity="info" 
            rounded />

          <FileUpload 
            v-if="selectedNode.data.sample"
            mode="basic" 
            name="converter[]"
            customUpload
            accept=".csv" 
            :maxFileSize="1000000" 
            @uploader="onUpload"
            :auto="true" 
            chooseLabel="Upload File" />

          <Button class="other-button text-sm px-3 py-1" 
            v-if="isLoggedIn"
            @click="editClassIsVisible=true"
            label="Edit Entry" 
            rounded />
        </div>
      </template>
      <template #content>
        <ScrollPanel class="w-auto h-auto max-h-[80vh]"
          :dt="{
            bar: {
              background: 'black'
            }
          }">
        <div v-if="selectedNode && selectedNode.data">
        <ul>
          <li v-for="(value, key) in selectedNode.data" :key="key" class="mt-4">
            <strong v-if="key.toString() != 'sample'"
            v-tooltip.bottom="{
              value: dataKeys[key]?.description,
              pt: {
                arrow: {
                  style: {
                    borderBottomColor: '#7b1113'
                  }
                }
              }
            }"
            >
              {{ dataKeys[key]?.displayName || key }}
              <span class="info"></span>:
            </strong> 

            <!-- Array of JSON -->
            <template v-if="isValidJsonString(value).isArray">
              <!-- TABLE -->
              <DataTable :value="isValidJsonString(value).row">
                <Column
                  v-for="col in getJSONArrayCols(value).columns"
                  :key="col.field"  
                  :field="col.field"
                  :header="col.header"
                />
              </DataTable>
            </template>

            <!--JSON-->
            <template v-else-if="isValidJsonString(value).isValid && key.toString() != 'sample'">
              <DataTable :value="value">
                <Column
                  v-for="col in getJSONArrayCols(value).columns"
                  :key="col.field"
                  :field="col.field"
                  :header="col.header"
                />
              </DataTable>
            </template>
            
            <!-- Array of Strings -->
            <template v-else-if="Array.isArray(value) && key.toString() !== 'sample'">
              <div v-for="(item, index) in value" :key="index">
                <template v-if="isValidLink(item)">

                  <a :href="item" target="_blank" class="text-blue-600 hover:underline">
                    &nbsp;&nbsp;&nbsp;&nbsp;{{ item }}
                  </a>
                </template>
                <template v-else>

                  &nbsp;&nbsp;&nbsp;&nbsp;{{ item }}
                </template>
              </div>
            </template>

            <!--String or Numbers-->
            <template v-else-if="key.toString() !== 'sample'">
              <template v-if="isValidLink(value)">
                <a :href="value" target="_blank" class="text-blue-600 hover:underline">
                  &nbsp;&nbsp;&nbsp;&nbsp;{{ value }}
                </a>
              </template>
              <span v-else v-html="value.replace(/\n/g, '<br>')"></span>
            </template>
          </li>
        </ul>
      </div>
    </ScrollPanel>
      </template>
    </Card>
    <Card class="mx-auto my-auto h-fit shadow-lg" v-else>
      <template #title class="justify-center items-center">
        SELECT A TERM TO VIEW
      </template>
    </Card>
  </div>
  <!-- DIALOG -->
  <Dialog class="flex w-1/2" v-model:visible="editClassIsVisible" modal header="Update Class">
    <EntryEditor
      :entryType="propsData.entryType"
      :prefLabel="propsData.prefLabel"
      :identifier="propsData.identifier"
      :selectedParents="propsData.selectedParents"
      :dataFields="propsData.dataFields"
      :leaf="selectedNode?.leaf"
      :nodeType="selectedNode?.nodeType"
      :operation="'update'"
      @submit-entry="submissionChanges"
    />
  </Dialog>
</template>
  
<script setup lang="ts">
import { NodeData, SearchTerm, dataKeys } from "../interfaces";
import Card from 'primevue/card';
import Button from 'primevue/button';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import DataTable from "primevue/datatable";
import FileUpload from "primevue/fileupload";
import ScrollPanel from "primevue/scrollpanel";
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '../stores/userStore';

import { OntologyService } from "../composables/services/ontologies";
import { computed, Ref, ref } from "vue";
import EntryEditor from "./EntryEditor.vue";

const emit = defineEmits(['update-entry']);
const toast = useToast();
const userStore = useUserStore();
const isLoggedIn = ref(userStore.isAuthenticated);
const editClassIsVisible: Ref<boolean> = ref(false);

// Define props with the correct types
const props = defineProps<{
  selectedNode: NodeData | undefined;
}>();

const downloadCSV = () => {
  try {
    console.log(props.selectedNode?.data.sample);
    const rawSampleData: Record<string, string> = props.selectedNode?.data.sample;

    // Parse the nested JSON strings into objects
    const parsedData = Object.values(rawSampleData).map((value) => JSON.parse(value));

    // Extract headers from the first parsed object
    const headers = Object.keys(parsedData[0]);
    const csvRows = [];

    // Add headers to CSV rows
    csvRows.push(headers.join(','));

    // Add rows for each parsed object
    parsedData.forEach((row) => {
      const csvRow = headers.map((header) => (row[header] !== undefined ? row[header] : ''));
      csvRows.push(csvRow.join(','));
    });

    // Convert rows to CSV string
    const csvString = csvRows.join('\n');

    // Create and download the CSV file
    const csvBlob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const csvUrl = URL.createObjectURL(csvBlob);
    const a = document.createElement('a');
    a.setAttribute('href', csvUrl);
    a.setAttribute('target', '_blank');
    a.setAttribute('download', 'sample_data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error parsing or converting to CSV:', error);
  }
};

/**
 * Check if strArray can be converted to a JSON array. If yes, return parsed array
 * 
 * @param strArray 
 */
const isValidJsonString = (strArray: any) => {
  // If strArray is not an array, return an error result
  if (!Array.isArray(strArray)) {
    return {
        isValid: false,
        isArray: false,
      }
  }
  try {
    const parsedArray = strArray.map((str: string) => JSON.parse(str));
    const isArray = Array.isArray(parsedArray) && parsedArray.every(item => typeof item === "object");

    return {
      isValid: true,
      isArray: isArray,
      row: parsedArray
    };
  } catch (error) {
    return {
      isValid: false,
      isArray: false,
    };
  }
};

const isValidLink = (value: string): boolean => {
  const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return regex.test(value);
}

/**
 * Get Columns for data that needs to be displayed in DataTable
 * 
 * @param array Array of DataTable JSON
 */
const getJSONArrayCols = (array: string[]) => {
  try {
    // Parse each string in the array into a JSON object
    const parsedArray = array.map((item: string) => JSON.parse(item));

    // Extract column definitions from the keys of the first object
    const columns =
      parsedArray.length > 0
        ? Object.keys(parsedArray[0]).map((key) => ({
            field: key,
            header: key.charAt(0).toUpperCase() + key.slice(1),
          }))
        : [];

    return { data: parsedArray, columns };
  } catch (error) {
    console.error("Error parsing JSON array:", error);
    return { data: [], columns: [] }; // Return empty data and columns in case of error
  }
};

const onUpload = async (event: any): Promise<any> => {
  const file = event.files[0];
  const formData = new FormData();
  formData.append('file', file);
  toast.add({ 
    severity: 'info', 
    summary: 'File Processing...', 
    detail: 'Your file is being processed.', 
    life: 3000 
  });
  OntologyService.getStandardizedCSV(formData)
  .then(response => {
    toast.add({ 
      severity: 'success', 
      summary: 'Processing Complete', 
      detail: 'Your file will now download shortly.', 
      life: 3000 
    });

    const blob = new Blob([response.data], { type: 'text/csv' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${file.name.replace('.csv', '')}_standardized.csv`;
    link.click();
  })
  .catch(error => {
    console.error('Error during file processing:', error);
  });
};

const propsData = computed(() => {
  const selectedNode = props.selectedNode;

  const getType = (value: any) => {
    if (typeof value === 'string') return 'Text';
    if (Array.isArray(value)) {
      // Case when the array consists of strings, not JSON objects
      if (value.every((item: any) => typeof item === 'string' && !item.startsWith('{'))) {
        return 'List';
      }

      // Case when the array consists of JSON strings
      try {
        const parsedItem = JSON.parse(value[0]);  // Try to parse the first item
        if (parsedItem.type && parsedItem.position) {
          return 'Site Features';
        } else if (parsedItem.field && parsedItem.value) {
          return 'Protein Sequence';
        } else if (parsedItem.field && parsedItem.type) {
          return 'Table Format';
        }
      } catch (e) {
        return 'Sample Data';
      }
    }

    return 'Sample Data'; // Default type for other data types
  };

  const dataFields = Object.entries(selectedNode!.data || {})
  .filter(([key]) => key !== 'prefLabel' && key !== 'identifier' && key !== 'type')
  .map(([key, value]) => {
    const type = getType(value);

    if (Array.isArray(value) && value.every((item: string) => item.startsWith('{'))) {
      const parsedValue = value.map((item: string) => JSON.parse(item));
      return {
        key,
        value: parsedValue,
        type,
      };
    }

    return {
      key,
      value,
      type,
    };
  })
  .flat();

  return {
    entryType: { name: selectedNode!.nodeType, code: selectedNode!.nodeType },
    prefLabel: selectedNode!.label,
    identifier: selectedNode!.key,
    selectedParents: selectedNode!.parents?.map((parent: SearchTerm) => ({
      name: parent.name,
      code: parent.code,
    })) || [],
    dataFields,
    altLabel: selectedNode!.altLabel,
    refs: selectedNode!.refs,
    type: selectedNode!.type,
  };
});

const submissionChanges = (node: NodeData) => {
  editClassIsVisible.value = false;
  emit('update-entry', node);
}
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
