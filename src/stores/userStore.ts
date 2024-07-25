import { defineStore } from 'pinia';
import { AuthenticationService } from '../composables';

interface UserState {
  username: string;
  token: string;
}

export const useUserStore = defineStore({
  id: 'user',
  state: (): UserState => ({
    username: '',
    token: ''
  }),
  actions: {
    async login(username: string, password: string) {
      try {
        const response = await AuthenticationService.login(username, password);
        const token = `${response.data.access_token}`;
        this.username = username;
        this.token = token;
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    logout() {
      this.username = '';
      this.token = '';
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUsername: (state) => state.username
  }
});