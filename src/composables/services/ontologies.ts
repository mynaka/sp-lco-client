import axios, { type AxiosResponse } from "axios";
import { SERVER_DOMAIN } from "../../constants/index";

export const OntologyService = {
    getAllTerms: async (): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/all`,);
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
        return await axios.get(`${SERVER_DOMAIN}/entry/database/${notation}/children`,);
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
};