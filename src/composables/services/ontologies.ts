import axios, { type AxiosResponse } from "axios";
import { SERVER_DOMAIN } from "../../constants/index";

export const OntologyService = {
    getAllTerms: async (): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/all`,);
    },

    getTermsDatabaseTree: async (db: string): Promise<AxiosResponse<any, any>> => {
        return await axios.get(`${SERVER_DOMAIN}/entry/database/${db}`,);
    },
};