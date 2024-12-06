import axios, { type AxiosResponse } from "axios";
import { SERVER_DOMAIN } from "../../constants/index";

export const OntologyService = {
    getAllTerms: async (): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/all`,);
    },

    /**
     * Search database for most relevant classes related to searchQuery
     * @param searchQuery string containing search query
     * @returns list of most relevant Classes (MAX 5)
     */
    getSearchTerms: async (searchQuery: string): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/search/"${searchQuery}"`,);
    },

    /**
     * Get all root nodes from a specified ontology
     * @param db string containing the ontology that is being requested
     * @returns root nodes (nodes without a parent) of the ontology
     */
    getRootDatabaseTree: async (db: string): Promise<AxiosResponse<any, any>> => {
        console.log(`${SERVER_DOMAIN}/entry/database/${db}`);
        return await axios.get(`${SERVER_DOMAIN}/entry/database/${db}`,);
    },

    /**
     * Get all children of a specified node identified by notation
     * @param notation string containing the notation of the parent node
     * @returns children of the parent node
     */
    getNodeChildren: async (notation: string): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/database/${notation}/children`);
    },

    getAncestors: async (notation:string): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/database/${notation}/ancestors`);
    },

    getJSONFromFileInput: async (
        form_data: FormData,
    ): Promise<AxiosResponse<any, any>> => {
        return await axios.post(
            `${SERVER_DOMAIN}/entry/file`,
            form_data,
            {
            headers: {
                "content-type": "multipart/form-data",
            },
            },
        );
    },

    getStandardizedCSV: async (
        form_data: FormData,
    ): Promise<AxiosResponse<any, any>> => {
        try {
            return axios.post(`${SERVER_DOMAIN}/entry/uploadfile`, form_data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    createEntry: async (
        jsonData: object,
        token: string
    ): Promise<AxiosResponse<any, any>> => {
        try {
            return axios.post(`${SERVER_DOMAIN}/entry/create`, jsonData, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    updateEntry: async (
        jsonData: object,
        token: string
    ): Promise<AxiosResponse<any, any>> => {
        try {
            console.log(jsonData);
            return axios.put(`${SERVER_DOMAIN}/entry/update`, jsonData, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }
};