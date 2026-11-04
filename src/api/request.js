// utils/request.js
import axios from 'axios'
import { showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { outWebview } from '@/libs/utils/app'
import { applyAuthHeaders } from '@/utils/authToken'

const leapx = window.APP_AIS_H5_CONFIG.VITE_LEAPX_URL
const ais = window.APP_AIS_H5_CONFIG.VITE_API_BASE_URL

// 路由到 ais 后端的 URL 前缀列表，新增前缀只需在此添加一行
const AIS_PREFIXES = [
  '/vehstock/',
  '/maintain/',
  '/claimreturn/',
  '/datacenter/',
  '/sp/',
  '/data/',
  '/vr/',
  '/vw/',
  '/datareport/',
  '/file/'
]

function resolveBaseURL(url, sign) {
  if (sign) return leapx
  const target = url.startsWith('/') ? url : '/' + url
  return AIS_PREFIXES.some((p) => target.startsWith(p)) ? ais : leapx
}

// 创建axios实例
const service = axios.create({
  timeout: 10000 // 超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const configWithAuth = applyAuthHeaders(config, userStore.token)
    configWithAuth.headers['X-CROSS-NODE-ID'] = localStorage.getItem('lxpToken')
    configWithAuth.headers.Accepte = 'application/vnd.leapx.v2+json'
    return configWithAuth
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code === 610) {
      // 登录token过期
      showConfirmDialog({
        title: '提示',
        message: '登录已过期，请点击确定返回'
      }).then(() => {
        outWebview()
      })
      return Promise.reject(res)
    } else if (/^20[0-9]+$/.test(res.code)) {
      // 正常返回
      return res
    } else if (res.code === 600) {
      // 无数据
      return Promise.reject(res)
    } else {
      if (response.config.responseType === 'blob' && !res.code) {
        // 如果是文件流 直接返回
        return Promise.resolve({ data: res })
      }
      showToast(res.msg || '请求失败')
      return Promise.reject(res)
    }
  },
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      showConfirmDialog({
        title: '提示',
        message: '登录已过期，请点击确定返回'
      }).then(() => {
        outWebview()
      })
    } else if (status === 403 || status === 405) {
      showToast(data?.msg || '无权限访问')
    } else if (status === 400 || status === 500 || status === 710) {
      showToast(data?.msg || '服务器错误，请稍后再试')
    } else {
      showToast('服务器错误，请稍后再试')
    }

    return Promise.reject(error)
  }
)

export function post(url, data, sign) {
  return service({
    url,
    baseURL: resolveBaseURL(url, sign),
    headers: { 'Content-Type': 'application/json' },
    method: 'post',
    data
  })
}

export function postText(url, data, sign) {
  return service({
    url,
    baseURL: resolveBaseURL(url, sign),
    headers: { 'Content-Type': 'text/plain' },
    method: 'post',
    data
  })
}

export function get(url, params, sign) {
  return service({
    url,
    baseURL: resolveBaseURL(url, sign),
    method: 'get',
    params
  })
}

export function postJson(url, params, sign) {
  const config = {
    url,
    baseURL: resolveBaseURL(url, sign),
    headers: { 'Content-Type': 'application/json' },
    method: 'post'
  }
  // 设置transformRequest，避免对字符串进行双重JSON.stringify
  config.transformRequest = [
    (data) => {
      if (typeof data === 'string') {
        return data
      }
      return JSON.stringify(data)
    }
  ]
  config.data = params
  return service(config)
}

export default service
