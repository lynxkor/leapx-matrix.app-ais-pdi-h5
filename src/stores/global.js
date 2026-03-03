import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    title: '' // 初始从localStorage读取
  }),
  actions: {
    setTitle(title) {
      this.title = title
    }
  }
})
