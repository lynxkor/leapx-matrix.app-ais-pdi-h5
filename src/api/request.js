// utils/request.js
import axios from 'axios'
import { showConfirmDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { outWebview } from '@/libs/utils/app'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 从环境变量读取基础URL
  timeout: 10000 // 超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    // 从Pinia store获取token
    const token = userStore.token
    // 添加Authorization头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      config.headers['platform'] = 'leapx'
    }
    return config
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
  (error) => {
    const status = error.response?.status

    if (status === 401 || status === 403) {
      showConfirmDialog({
        title: '提示',
        message: status === 401 ? '登录已过期，请点击确定返回' : '无权限访问，请点击确定返回'
      }).then(() => {
        // 确认按钮回调
        outWebview()
      })
    }

    return Promise.reject(error)
  }
)

export function post(url, data) {
  return service({
    url,
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
    data
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
