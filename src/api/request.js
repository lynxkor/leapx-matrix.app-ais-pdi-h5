// utils/request.js
import axios from 'axios'
import { showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { outWebview } from '@/libs/utils/app'
import { applyAuthHeaders, waitForTokenChange } from '@/utils/authToken'

// 创建axios实例
const service = axios.create({
  baseURL: window.APP_AIS_H5_CONFIG?.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL, // 从环境变量读取基础URL
  timeout: 10000 // 超时时间
})

let authDialogVisible = false

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    return applyAuthHeaders(config, userStore.token)
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  async(error) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      const config = error.config

      if (config && !config.authRetry) {
        const latestToken = await waitForTokenChange(config.authToken)

        if (latestToken) {
          config.authRetry = true
          return service(applyAuthHeaders(config, latestToken))
        }
      }

      if (authDialogVisible) {
        return Promise.reject(error)
      }
      authDialogVisible = true
      showConfirmDialog({
        title: '提示',
        message: status === 401 ? '登录已过期，请点击确定返回' : '无权限访问，请点击确定返回'
      }).then(() => {
        // 确认按钮回调
        outWebview()
      }).finally(() => {
        authDialogVisible = false
      })
    }

    return Promise.reject(error)
  }
)

export function post(url, data, timeout = 10000) {
  return service({
    url,
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
    data,
    timeout
  })
}

export function get(url, params) {
  return service({
    url,
    method: 'get',
    params
  })
}

export function postJson(url, params) {
  const config = {
    url,
    headers: { 'Content-Type': 'application/json' },
    method: 'post'
  }
  // 设置transformRequest，避免对字符串进行双重JSON.stringify
  config.transformRequest = [(data, headers) => {
    if (typeof data === 'string') {
      // 如果已经是字符串，直接返回
      return data
    }
    // 如果是对象，转换为JSON字符串
    return JSON.stringify(data)
  }]
  // 设置data
  config.data = params
  return service(config)
}

export default service
