const TOKEN_KEY = 'lxpToken'

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || ''

export const normalizeBearerToken = (token) => {
  const trimmedToken = `${token || ''}`.trim()

  if (!trimmedToken) {
    return ''
  }

  return trimmedToken.replace(/^Bearer\s+/i, '')
}

export const getAuthorizationToken = (storeToken) => {
  const latestToken = getStoredToken() || storeToken

  return normalizeBearerToken(latestToken)
}

export const waitForTokenChange = async(previousToken, options = {}) => {
  const { maxWait = 3000, interval = 100 } = options
  const normalizedPreviousToken = normalizeBearerToken(previousToken)
  const start = Date.now()

  while (Date.now() - start < maxWait) {
    const latestToken = normalizeBearerToken(getStoredToken())

    if (latestToken && latestToken !== normalizedPreviousToken) {
      return latestToken
    }

    await new Promise(resolve => setTimeout(resolve, interval))
  }

  return ''
}

export const applyAuthHeaders = (config, storeToken) => {
  const token = getAuthorizationToken(storeToken)

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
    config.headers.platform = 'leapx'
  }

  config.authToken = token

  return config
}
