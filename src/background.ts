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

interface ImageRequestPayload {
  url: string
}

interface ImageResponsePayload {
  dataUrl: string
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

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(String(reader.result)))
    reader.addEventListener("error", () => reject(reader.error))
    reader.readAsDataURL(blob)
  })

const requestImage = async (
  payload: ImageRequestPayload
): Promise<ImageResponsePayload> => {
  const response = await fetch(payload.url)

  if (!response.ok) {
    throw new Error("Failed to load meme image.")
  }

  return {
    dataUrl: await blobToDataUrl(await response.blob())
  }
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.name === "IMAGE_REQUEST") {
    requestImage(request.payload)
      .then((data) => sendResponse({ data, ok: true }))
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to load meme image."

        sendResponse({ error: message, ok: false })
      })

    return true
  }

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
