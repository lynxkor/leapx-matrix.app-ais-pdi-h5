import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue'

const isIOS = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform.toLowerCase()

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    /iphone|ipad|ipod/.test(platform) ||
    (platform === 'macintel' && navigator.maxTouchPoints > 1)
  )
}

const isIOSNativeWebView = () => isIOS() && Boolean(window.webkit?.messageHandlers)

const getEnvSafeAreaTop = () => {
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.visibility = 'hidden'
  tempDiv.style.paddingTop = 'env(safe-area-inset-top, 0px)'
  document.body.appendChild(tempDiv)

  const envValue = window.getComputedStyle(tempDiv).paddingTop
  document.body.removeChild(tempDiv)

  return envValue && envValue !== '0px' ? envValue : ''
}

const getFallbackSafeAreaTop = () => {
  if (!isIOSNativeWebView()) {
    return '0px'
  }

  if (window.visualViewport?.offsetTop) {
    return `${window.visualViewport.offsetTop}px`
  }

  const { height } = window.screen

  if (height >= 896) {
    return '48px'
  }

  if (height >= 812) {
    return '44px'
  }

  return '0px'
}

export const usePageSafeArea = ({ bodyClass = '' } = {}) => {
  const safeAreaTop = ref('0px')

  const enableSafeArea = () => {
    safeAreaTop.value = getEnvSafeAreaTop() || getFallbackSafeAreaTop()
    document.documentElement.style.setProperty('--page-safe-area-top', safeAreaTop.value)

    if (bodyClass) {
      document.body.classList.add(bodyClass)
    }
  }

  const disableSafeArea = () => {
    if (bodyClass) {
      document.body.classList.remove(bodyClass)
    }

    document.documentElement.style.removeProperty('--page-safe-area-top')
  }

  onMounted(enableSafeArea)
  onActivated(enableSafeArea)
  onDeactivated(disableSafeArea)
  onBeforeUnmount(disableSafeArea)

  const navBarOffsetTop = computed(() => 44 + Number.parseFloat(safeAreaTop.value || '0'))

  return {
    safeAreaTop,
    navBarOffsetTop
  }
}
