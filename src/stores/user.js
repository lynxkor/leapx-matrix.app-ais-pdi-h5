import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('lxpToken') || null, // 初始从localStorage读取
  })
})
