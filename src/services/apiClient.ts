import type {
  ApiErrorEnvelope,
  ApiQuery,
  ApiQueryValue,
  ApiSuccessEnvelope,
} from '../types/api'

const ACCESS_TOKEN_KEY = 'stocksense.accessToken'
const DEFAULT_API_BASE_URL = '/api/v1'

export const API_UNAUTHORIZED_EVENT = 'stocksense:unauthorized'

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  query?: ApiQuery
}

function normalizeBaseUrl(value: string | undefined) {
  const baseUrl = value?.trim() || DEFAULT_API_BASE_URL
  return baseUrl.replace(/\/+$/, '')
}

function isErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<ApiErrorEnvelope>
  return candidate.success === false
    && typeof candidate.error?.code === 'string'
    && typeof candidate.error.message === 'string'
}

function isSuccessEnvelope<T>(value: unknown): value is ApiSuccessEnvelope<T> {
  return Boolean(value && typeof value === 'object' && (value as { success?: unknown }).success === true && 'data' in value)
}

function appendQueryValue(params: URLSearchParams, key: string, value: ApiQueryValue) {
  if (value === null || value === undefined) return
  params.append(key, String(value))
}

export function serializeQuery(query?: ApiQuery) {
  if (!query) return ''

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => appendQueryValue(params, key, item))
      return
    }
    appendQueryValue(params, key, value as ApiQueryValue)
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function getAccessToken() {
  try {
    return window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(accessToken: string) {
  try {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function clearAccessToken() {
  try {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // The in-memory auth state is still cleared by the provider.
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

class ApiClient {
  private readonly baseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiSuccessEnvelope<T>> {
    const { body, headers: suppliedHeaders, query, ...requestOptions } = options
    const headers = new Headers(suppliedHeaders)
    const accessToken = getAccessToken()

    headers.set('Accept', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    if (body !== undefined) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
      response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, '')}${serializeQuery(query)}`, {
        ...requestOptions,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (error) {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Unable to reach StockSense. Check your connection and try again.',
        error,
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      const apiError = isErrorEnvelope(payload)
        ? new ApiError(response.status, payload.error.code, payload.error.message, payload.error.details)
        : new ApiError(response.status, 'HTTP_ERROR', `Request failed with status ${response.status}`)

      if (response.status === 401 && accessToken) {
        clearAccessToken()
        window.dispatchEvent(new CustomEvent(API_UNAUTHORIZED_EVENT, { detail: apiError }))
      }

      throw apiError
    }

    if (!isSuccessEnvelope<T>(payload)) {
      throw new ApiError(response.status, 'INVALID_RESPONSE', 'The server returned an invalid response.')
    }

    return payload
  }

  get<T>(path: string, query?: ApiQuery, options?: Omit<ApiRequestOptions, 'body' | 'method' | 'query'>) {
    return this.request<T>(path, { ...options, method: 'GET', query })
  }

  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return this.request<T>(path, { ...options, method: 'POST', body })
  }

  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return this.request<T>(path, { ...options, method: 'PATCH', body })
  }

  delete<T>(path: string, options?: Omit<ApiRequestOptions, 'body' | 'method'>) {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()
