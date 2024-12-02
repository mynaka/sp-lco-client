<template>
  <div class="flex w-full min-w-3/4 md:w-3/4 p-4 overflow-y-auto">
    <Card class="lg:w-full sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg"
      v-if="selectedNode!=null">
      <template #title>
        {{ selectedNode.label }}
        <div class="flex items-center space-x-2">
          <Button class="flex ml-2"
            v-if="selectedNode.data.sample"
            @click="downloadCSV"
            label="Download Sample CSV" 
            severity="info" 
            rounded/>
          <FileUpload 
          v-if="selectedNode.data.sample"
          mode="basic" 
          name="converter[]"
          customUpload
          accept=".csv" 
          :maxFileSize="1000000" 
          @uploader="onUpload"
          :auto="true" 
          chooseLabel="Browse"
          />
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
          <li v-for="(value, key) in selectedNode.data" :key="key">
            <strong v-if="key.toString() != 'sample'"
            v-tooltip.bottom="{
              value: dataKeys[key]?.description,
              pt: {
                arrow: {
                  style: {
                    borderBottomColor: '#7b1113' // Matches tooltip background color
                  }
                }
              }
            }"
            >
              {{ dataKeys[key]?.displayName || key }}
              <span class="info"></span>:
            </strong> 

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

            <template v-else-if="key.toString() !== 'sample'">
              <span v-html="value.replace(/\n/g, '<br>')"></span>
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
</template>
  
<script setup lang="ts">
import { NodeData, dataKeys } from "../interfaces";
import Card from 'primevue/card';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from "primevue/datatable";
import FileUpload from "primevue/fileupload";
import ScrollPanel from "primevue/scrollpanel";
import { useToast } from 'primevue/usetoast';

import { OntologyService } from "../composables/services/ontologies";

const toast = useToast();

// Define props with the correct types
const props = defineProps<{
  selectedNode: NodeData | undefined;
}>();

const downloadCSV = () => {
  try {
    const sampleData: Record<string, any[]> = JSON.parse(props.selectedNode?.data.sample);
    const headers = Object.keys(sampleData);
    const csvRows = [];

    csvRows.push(headers.join(','));

    const maxRows = Math.max(...Object.values(sampleData).map(arr => arr.length));

    for (let i = 0; i < maxRows; i++) {
      const row = headers.map(header => {
        return sampleData[header][i] !== undefined ? sampleData[header][i] : '';
      });
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');

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
    console.log('Response received:', response);
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
</script>
  