import axios, { type AxiosError } from "axios"

const DEFAULT_API_URL = "https://meme-picker-cms.vercel.app"

const apiClient = axios.create({
  baseURL:
    process.env.PLASMO_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_API_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
})

interface ApiErrorBody {
  error?: string
  message?: string
}

interface ApiRequestOptions {
  data?: unknown
  method: "GET" | "POST"
  params?: Record<string, string | number | boolean | undefined>
  url: string
}

interface ApiRuntimeResponse<T> {
  data?: T
  error?: string
  ok: boolean
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>

    return (
      axiosError.response?.data?.error ??
      axiosError.response?.data?.message ??
      axiosError.message ??
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

const requestFromBackground = async <T>(
  options: ApiRequestOptions
): Promise<T> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        name: "API_REQUEST",
        payload: options
      },
      (response?: ApiRuntimeResponse<T>) => {
        const runtimeError = chrome.runtime.lastError

        if (runtimeError) {
          reject(new Error(runtimeError.message))
          return
        }

        if (!response?.ok) {
          reject(new Error(response?.error ?? "Request failed."))
          return
        }

        resolve(response.data as T)
      }
    )
  })
}

const requestDirect = async <T>(options: ApiRequestOptions): Promise<T> => {
  const response = await apiClient.request<T>({
    data: options.data,
    method: options.method,
    params: options.params,
    url: options.url
  })

  return response.data
}

const canUseBackgroundProxy = () =>
  typeof chrome !== "undefined" &&
  Boolean(chrome.runtime?.id) &&
  typeof chrome.runtime.sendMessage === "function"

export const apiRequest = async <T>(
  options: ApiRequestOptions,
  fallback: string
): Promise<T> => {
  try {
    if (canUseBackgroundProxy()) {
      return await requestFromBackground<T>(options)
    }

    return await requestDirect<T>(options)
  } catch (error) {
    throwApiError(error, fallback)
  }
}

export const throwApiError = (error: unknown, fallback: string): never => {
  throw new Error(getApiErrorMessage(error, fallback))
}
