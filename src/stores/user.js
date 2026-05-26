import { defineStore } from 'pinia'
import { getLoginInfo } from '@/libs/api/common'
import { getStoredToken, normalizeBearerToken } from '@/utils/authToken'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: normalizeBearerToken(getStoredToken()) || null,
    userInfo: null,
    userInfoLoading: false
  }),

  getters: {
    // 用户名称
    userName: (state) => state.userInfo?.userName || '',
    // 用户ID
    userId: (state) => state.userInfo?.userId || ''
  },

  actions: {
    // 设置token
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
    },

    // 获取用户登录信息
    async fetchUserInfo() {
      this.syncTokenFromStorage()
      // 如果没有token，不请求
      if (!this.token) {
        return null
      }

      // 如果正在加载中，等待加载完成
      if (this.userInfoLoading) {
        return this.userInfo
      }

      // 如果已有用户信息，直接返回（懒加载模式）
      if (this.userInfo) {
        return this.userInfo
      }

      this.userInfoLoading = true
      try {
        const data = await getLoginInfo()
        this.userInfo = data?.data || null
        return this.userInfo
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.userInfo = null
        return null
      } finally {
        this.userInfoLoading = false
      }
    },

    // 强制刷新用户信息（忽略缓存）
    async refreshUserInfo() {
      this.syncTokenFromStorage()
      if (!this.token) {
        return null
      }

      this.userInfoLoading = true
      try {
        const data = await getLoginInfo()
        this.userInfo = data?.data || null
        return this.userInfo
      } catch (error) {
        console.error('刷新用户信息失败:', error)
        return null
      } finally {
        this.userInfoLoading = false
      }
    },

    // 清除用户信息（退出登录时调用）
    clearUserInfo() {
      this.userInfo = null
      this.token = null
      localStorage.removeItem('lxpToken')
    }
  }
})
