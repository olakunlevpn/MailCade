export interface MailpitAPIConfig {
  baseURL: string
  timeout?: number
}

export interface APIError {
  message: string
  code?: string
  status?: number
}

export interface MailpitResponse<T> {
  data: T
  error?: APIError
}
