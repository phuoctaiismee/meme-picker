export {}

const DEFAULT_API_URL = "https://meme-picker-cms.vercel.app"
const API_URL =
  process.env.PLASMO_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_API_URL

interface ApiRequestPayload {
  data?: unknown
  method: "GET" | "POST"
  params?: Record<string, string | number | boolean | undefined>
  url: string
}

const buildApiUrl = (path: string, params?: ApiRequestPayload["params"]) => {
  const url = new URL(path, API_URL)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })

  return url
}

const requestApi = async (payload: ApiRequestPayload) => {
  const response = await fetch(buildApiUrl(payload.url, payload.params), {
    body: payload.data ? JSON.stringify(payload.data) : undefined,
    headers: {
      "Content-Type": "application/json"
    },
    method: payload.method
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Request failed.")
  }

  return data
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs
      .sendMessage(tab.id, {
        name: "TOGGLE_OVERLAY"
      })
      .catch((err) => {
        console.log("Content script not ready yet or restricted page:", err)
      })
  }
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.name !== "API_REQUEST") {
    return
  }

  requestApi(request.payload)
    .then((data) => sendResponse({ data, ok: true }))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Request failed."

      sendResponse({ error: message, ok: false })
    })

  return true
})
