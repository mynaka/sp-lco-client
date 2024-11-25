<template><div class="w-full">
    <Floatlabel class="flex flex-1 mt-8 mx-auto" 
        :class="searchComponent === 'Nav' ? 'w-full' : 'w-1/2'" 
        variant="on">
        <AutoComplete 
            class="flex flex-col w-full h-10"
            v-model="selectedTerm" 
            optionLabel="name"
            inputId="term"
            :suggestions="filteredTermOptions" 
            @complete="search">
            <template #option="slotProps">
            <li @click="handleItemClick(slotProps.option)">
                <div class="flex items-center justify-between w-full">
                <div class="flex-1 truncate">
                    {{ 
                    searchComponent === 'Nav' && slotProps.option.name.length > 120 
                    ? slotProps.option.name.slice(0, 120) + '...' 
                    : searchComponent === 'Home' && slotProps.option.name.length > 30 
                    ? slotProps.option.name.slice(0, 30) + '...' 
                    : slotProps.option.name 
                    }}
                </div>
                <div>
                    <Button class="h-6 ml-2" 
                    :label="getButtonLabel(slotProps.option)" 
                    :severity="getButtonSeverity(slotProps.option)" 
                    :style="{ 'pointer-events': 'none' }"
                    rounded/>
                </div>
                </div>
            </li>
            </template>
        </AutoComplete>
        <label for="term">{{ floatMessage }}</label>
    </Floatlabel>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import AutoComplete from 'primevue/autocomplete';
    import Button from 'primevue/button';
    import Floatlabel from 'primevue/floatlabel';
    import { useRouter } from 'vue-router';
    import {
        OntologyService
    } from "../composables";
    import {
        SearchTerm
    } from "../interfaces";
    const filteredTermOptions = ref<SearchTerm[]>([]);
    const selectedTerm = ref<SearchTerm>();
    const router = useRouter();
    
    const props = defineProps<{
        floatMessage: string;
        func: string;
    }>();
    const emit = defineEmits(['select-parent']); // Define emit event
    const floatMessage = ref<string>(props.floatMessage);
    const searchComponent = ref<string>(props.func);

    function search(event: { query: string; }) {
        setTimeout(async () => {
            try {
                const response = await OntologyService.getSearchTerms(event.query);
                filteredTermOptions.value = response.data.entries;
            } catch (error) {
                console.error("Error fetching search terms:", error);
            }
        }, 250);
    }

    function handleItemClick(option: SearchTerm) {
        if (searchComponent.value == 'Nav') emit('select-parent', option);
        else {
            const ontologyLabel = getButtonLabel(option).toLocaleLowerCase();
            const code = option.code;

            console.log(`Redirecting to /ontologies/${ontologyLabel}/classes?code=${code}`);

            router.push({
            path: `/ontologies/${ontologyLabel}/classes`,
            query: { code: code }
            });
        }
    }

    /**
     * @param option 
     * @return source of option.code (option.code goes by format {source}:{id})
     */
    function getButtonLabel(option: SearchTerm) {
        const index = option.code.indexOf(':');
        if (index !== -1) {
        return option.code.substring(0, index);
        }
        return option.code;
    }

    function getButtonSeverity(option: SearchTerm) {
        return option.code.startsWith('ICD10CM:')  
        ? 'info' 
        : option.code.startsWith('MPO:')
        ? 'contrast'
        : 'secondary';
    }
</script>