<template>
  <div class="flex w-full min-w-3/4 md:w-3/4 p-4 overflow-y-auto">
    <Card class="lg:w-full sm:w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg"
      v-if="selectedNode!=null">
      <template #title>
        {{ selectedNode.label }}
        <Button class="ml-2"
          v-if="selectedNode.data.sample"
          @click="downloadCSV"
          label="Download Sample CSV" 
          severity="info" 
          rounded/>
      </template>
      <template #content>
        <div v-if="selectedNode && selectedNode.data">
        <ul>
          <li v-for="(value, key) in selectedNode.data" :key="key">
            <strong v-if="key != 'sample'"
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
              <table border="1" class="table-auto w-full text-left">
                <thead>
                  <tr>
                    <th class="px-4 py-2"
                    v-tooltip.bottom="{
                    value: dataKeys['feat_type'].description,
                    pt: {
                      arrow: {
                        style: {
                          borderBottomColor: '#7b1113' // Matches tooltip background color
                        }
                      }
                    }
                  }">{{ dataKeys['feat_type'].displayName }}<span class="info"></span>:</th>
                    <th class="px-4 py-2"
                    v-tooltip.bottom="{
                    value: dataKeys['feat_pos'].description,
                    pt: {
                      arrow: {
                        style: {
                          borderBottomColor: '#7b1113' // Matches tooltip background color
                        }
                      }
                    }
                    }">{{ dataKeys['feat_pos'].displayName }}<span class="info"></span>:</th>
                    <th class="px-4 py-2"
                      v-tooltip.bottom="{
                      value: dataKeys['feat_desc'].description,
                      pt: {
                        arrow: {
                          style: {
                            borderBottomColor: '#7b1113' // Matches tooltip background color
                          }
                        }
                      }
                      }">{{ dataKeys['feat_desc'].displayName }}<span class="info"></span>:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(feature, index) in isValidJsonString(value).parsed" :key="index">
                    <td class="border px-4 py-2">{{ feature.type }}</td>
                    <td class="border px-4 py-2">{{ feature.positions }}</td>
                    <td class="border px-4 py-2">{{ feature.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </template>

            <template v-else-if="isValidJsonString(value).isValid && key != 'sample'">
              <table border="1" class="table-auto w-full text-left">
                <thead>
                  <tr>
                    <th class="px-4 py-2">Field</th>
                    <th class="px-4 py-2">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in convertToDataTableFormat(value)" :key="item.field">
                    <td class="border px-4 py-2">{{ item.field }}</td>
                    <td class="border px-4 py-2">{{ item.type }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
            
            <template v-else-if="Array.isArray(value) && key !== 'sample'">
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

            <template v-else-if="key !== 'sample'">
              <span v-html="value.replace(/\n/g, '<br>')"></span>
            </template>
          </li>
        </ul>
      </div>
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
import FileUpload from "primevue/fileupload";
import { useToast } from 'primevue/usetoast';

import { OntologyService } from "../composables/services/ontologies";

const toast = useToast();

// Define props with the correct types
const props = defineProps<{
  selectedNode: NodeData | undefined;
}>();

console.log(props.selectedNode);
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


const isValidJsonString = (str: string) => {
  try {
    const parsed = JSON.parse(str);
    return { isValid: true, isArray: Array.isArray(parsed), parsed };
  } catch (e) {
    return { isValid: false, isArray: false };
  }
};

const isValidLink = (value: string): boolean => {
  const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return regex.test(value);
}

function convertToDataTableFormat(jsonData: string) {
  let parsedJSONData:Record<string, any> = JSON.parse(jsonData);;
  parsedJSONData = JSON.parse(jsonData);

  const dataTableData = Object.keys(parsedJSONData).map(key => {
    return {
      field: key,
      type: parsedJSONData[key]
    };
  });

  return dataTableData;
}

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
  