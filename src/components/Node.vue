<template>
    <div class="flex w-full md:w-full p-4 overflow-y-auto">
      <Card class="w-full mx-auto lg:my-auto lg:h-fit sm:h-full shadow-lg" v-if="selectedNode">
        <template #title>
          {{ selectedNode.label }}
          <br>
          <div class="flex items-center space-x-4">
          <Button
            class="text-sm py-1 px-20 h-8"
            v-if="selectedNode.data.sample"
            @click="downloadCSV"
            label="Download Sample CSV"
            severity="info"
          />
          
          <FileUpload 
            v-if="selectedNode.data.sample"
            mode="basic" 
            name="demo[]" 
            customUpload
            accept=".csv" 
            :maxFileSize="1000000" 
            @uploader="onUpload"
            :auto="true" 
            chooseLabel="Standardize Terms"
            class="text-sm py-1 px-20 h-8" />
        </div>
        </template>
        <template #content>
          <div v-if="selectedNode.data">
            <ul>
              <li v-for="(value, key) in selectedNode.data" :key="key">
                <strong
                  v-if="key !== 'sample'"
                  v-tooltip.bottom="{
                    value: dataKeys[key as keyof DataKeys]?.description,
                    pt: {
                      arrow: {
                        style: {
                          borderBottomColor: '#7b1113', // Matches tooltip background color
                        },
                      },
                    },
                  }"
                >
                  {{ dataKeys[key as keyof DataKeys]?.displayName || key }}:
                </strong>
                <template v-if="isValidJsonString(value) && key !== 'sample'">
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
                <template v-else-if="key !== 'sample'">
                  {{ value }}
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
  import { DataKeys, Node, GraphNode, dataKeys } from "../interfaces";
  import Card from 'primevue/card';
  import Button from 'primevue/button';
  import FileUpload from "primevue/fileupload";
  import { useToast } from 'primevue/usetoast';
  import Toast from 'primevue/toast';

  import { OntologyService } from "../composables/services/ontologies";
  
  const toast = useToast();

  // Define props with the correct types
  const props = defineProps<{
    selectedNode: Node | GraphNode | undefined;
    dataKeys: Record<string, { displayName: string; description: string }>;
  }>();

  const downloadCSV = () => {
    try {
      const sampleData = JSON.parse(props.selectedNode.data.sample);
      const headers = Object.keys(sampleData);
      const csvRows = [];
  
      csvRows.push(headers.join(','));
  
      const maxRows = Math.max(...Object.values(sampleData).map(arr => (arr as any[]).length));
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
  
  const isValidJsonString = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  function convertToDataTableFormat(jsonData: any) {
    if (typeof jsonData === 'string') {
      jsonData = JSON.parse(jsonData);
    }
  
    const dataTableData = Object.keys(jsonData).map(key => {
      return {
        field: key,
        type: jsonData[key] // Adjust this as necessary to get the correct type
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
  