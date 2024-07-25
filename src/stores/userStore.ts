import { defineStore } from 'pinia';
import { AuthenticationService } from '../composables';

interface UserState {
  username: string;
  token: string;
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    username: localStorage.getItem('username') || '',
    token: localStorage.getItem('token') || ''
  }),
  actions: {
    async login(username: string, password: string) {
      try {
        const response = await AuthenticationService.login(username, password);
        const token = `${response.data.access_token}`;
        this.username = username;
        this.token = token;
        // Save to localStorage
        localStorage.setItem('username', username);
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('Login failed:', error);
        return "fail";
      }
    },
    logout() {
      this.username = '';
      this.token = '';
      // Remove from localStorage
      localStorage.removeItem('username');
      localStorage.removeItem('token');
    }
  },
  getters: {
    isAuthenticated: (state) => state.token != '',
    getUsername: (state) => state.username,
    getToken: (state) => state.token
  }
});