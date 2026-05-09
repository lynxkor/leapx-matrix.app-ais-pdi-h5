import { defineStore } from 'pinia'
import { getStoredToken, normalizeBearerToken } from '@/utils/authToken'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: normalizeBearerToken(getStoredToken()) || null // 初始从localStorage读取
  }),

  actions: {
    setToken(token) {
      const normalizedToken = normalizeBearerToken(token)
      this.token = normalizedToken || null
      if (normalizedToken) {
        localStorage.setItem('lxpToken', normalizedToken)
      } else {
        localStorage.removeItem('lxpToken')
      }
    },

    syncTokenFromStorage() {
      const token = normalizeBearerToken(getStoredToken())
      this.token = token || null
      return this.token
    }
  }
})
