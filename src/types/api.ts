export interface ApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiMeta {
  pagination?: ApiPagination
  [key: string]: unknown
}

export interface ApiSuccessEnvelope<T, TMeta extends ApiMeta = ApiMeta> {
  success: true
  data: T
  meta?: TMeta
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: unknown
}

export interface ApiErrorEnvelope {
  success: false
  error: ApiErrorBody
}

export type ApiEnvelope<T, TMeta extends ApiMeta = ApiMeta> =
  | ApiSuccessEnvelope<T, TMeta>
  | ApiErrorEnvelope

export type ApiQueryValue = string | number | boolean | null | undefined

export type ApiQuery = Record<string, ApiQueryValue | readonly ApiQueryValue[]>
