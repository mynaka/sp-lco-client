import axios, { type AxiosResponse } from "axios";
import { SERVER_DOMAIN } from "../../constants/index";

interface LoginResponse {
    access_token: string;
    bearer_type: string;
}

export const AuthenticationService = {
    login: async (username: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
  
      return await axios.post(`${SERVER_DOMAIN}/api/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }
};