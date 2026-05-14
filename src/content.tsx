import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query"
import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useMemo, useState } from "react"

import { appClient } from "./apis/client"
import type { Meme } from "./apis/interfaces/meme"
import { Button } from "./components/ui/button"
import { MemeGrid } from "./features/meme-picker/components/meme-grid"

export const config: PlasmoCSConfig = {
  matches: ["https://*.facebook.com/*", "https://facebook.com/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

interface CommentTarget {
  box: HTMLElement
  context: string
  debugCandidates: string[]
}

interface MemeQueryResult {
  memes: Meme[]
  source: "all" | "suggest"
}

type PasteResult = "copied" | "pasted" | "url"

interface ImageRuntimeResponse {
  data?: {
    dataUrl: string
  }
  error?: string
  ok: boolean
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 30 * 60 * 1000,
      retry: 1,
      staleTime: 5 * 60 * 1000
    }
  }
})

const COMMENT_LABELS = [
  "comment",
  "write a comment",
  "b\u00ecnh lu\u1eadn",
  "vi\u1ebft b\u00ecnh lu\u1eadn"
]

const cleanText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .replace(
      /\b(Like|Comment|Share|Send|Th\u00edch|B\u00ecnh lu\u1eadn|Chia s\u1ebb)\b/gi,
      " "
    )
    .replace(/\bFacebook\b/gi, " ")
    .replace(/[a-zA-Z]\s(?=[a-zA-Z]\s){4,}/g, " ")
    .trim()

const shouldSkipTextNode = (node: Node) => {
  const parent = node.parentElement

  if (!parent) {
    return true
  }

  return Boolean(
    parent.closest(
      [
        '[contenteditable="true"]',
        '[role="button"]',
        '[role="textbox"]',
        "button",
        "input",
        "textarea",
        "script",
        "style"
      ].join(",")
    )
  )
}

const getVisibleText = (root: Element) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (shouldSkipTextNode(node)) {
        return NodeFilter.FILTER_REJECT
      }

      const text = cleanText(node.textContent ?? "")
      return text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    }
  })

  const chunks: string[] = []
  let node = walker.nextNode()

  while (node) {
    chunks.push(node.textContent ?? "")
    node = walker.nextNode()
  }

  return cleanText(chunks.join(" "))
}

const trimContext = (text: string) => {
  const context = cleanText(text)

  if (context.length <= 500) {
    return context
  }

  return `${context.slice(0, 497).trim()}...`
}

const isFacebookCommentBox = (element: Element): element is HTMLElement => {
  const label = (
    element.getAttribute("aria-label") ??
    element.getAttribute("data-placeholder") ??
    ""
  ).toLowerCase()

  return (
    element instanceof HTMLElement &&
    element.getAttribute("contenteditable") === "true" &&
    element.getAttribute("role") === "textbox" &&
    COMMENT_LABELS.some((keyword) => label.includes(keyword))
  )
}

const getCandidateText = (element: Element) =>
  trimContext(getVisibleText(element))

const findPostCandidates = (box: HTMLElement) => {
  const candidates = new Set<Element>()
  const boxRect = box.getBoundingClientRect()

  let current: Element | null = box
  for (let depth = 0; current && depth < 10; depth += 1) {
    candidates.add(current)
    current = current.parentElement
  }

  document
    .querySelectorAll(
      '[role="article"], [aria-posinset], [data-pagelet^="FeedUnit"]'
    )
    .forEach((element) => {
      const rect = element.getBoundingClientRect()

      if (
        rect.width > 240 &&
        rect.height > 80 &&
        rect.top < boxRect.bottom &&
        rect.bottom > boxRect.top - 1400
      ) {
        candidates.add(element)
      }
    })
  ;[40, 120, 240, 420, 700].forEach((offset) => {
    const elements = document.elementsFromPoint(
      Math.max(0, boxRect.left + 24),
      Math.max(0, boxRect.top - offset)
    )

    elements.forEach((element) => {
      candidates.add(element)

      const article = element.closest('[role="article"]')
      if (article) {
        candidates.add(article)
      }
    })
  })

  return Array.from(candidates)
}

const findPostContext = (box: HTMLElement) => {
  const boxRect = box.getBoundingClientRect()

  const candidates = findPostCandidates(box)
    .map((element) => {
      const rect = element.getBoundingClientRect()
      const text = getCandidateText(element)
      const distance = Math.abs(rect.bottom - boxRect.top)

      return {
        distance,
        score: text.length - Math.min(distance / 10, 120),
        text
      }
    })
    .filter((candidate) => candidate.text.length >= 12)
    .sort((a, b) => b.score - a.score)

  return {
    debugCandidates: candidates.slice(0, 5).map((candidate) => candidate.text),
    text: candidates[0]?.text ?? ""
  }
}

const extractPostContext = (box: HTMLElement) => {
  return findPostContext(box)
}

const findButtonHost = (box: HTMLElement) =>
  box.closest('[role="presentation"]')?.parentElement ??
  box.parentElement?.parentElement ??
  box.parentElement

const focusCommentBox = (box: HTMLElement) => {
  box.focus()

  const range = document.createRange()
  range.selectNodeContents(box)
  range.collapse(false)

  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

const insertCommentText = (box: HTMLElement, text: string) => {
  focusCommentBox(box)

  if (!document.execCommand("insertText", false, text)) {
    box.textContent = `${box.textContent ?? ""}${text}`
    box.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }))
  }
}

const blobFromDataUrl = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  return response.blob()
}

const fetchMemeBlob = async (meme: Meme): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        name: "IMAGE_REQUEST",
        payload: {
          url: meme.url
        }
      },
      async (response?: ImageRuntimeResponse) => {
        const runtimeError = chrome.runtime.lastError

        if (runtimeError) {
          reject(new Error(runtimeError.message))
          return
        }

        if (!response?.ok || !response.data?.dataUrl) {
          reject(new Error(response?.error ?? "Failed to load meme image."))
          return
        }

        resolve(await blobFromDataUrl(response.data.dataUrl))
      }
    )
  })
}

const convertBlobToPng = async (blob: Blob): Promise<Blob> => {
  if (blob.type === "image/png") {
    return blob
  }

  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const context = canvas.getContext("2d")
  if (!context) {
    bitmap.close()
    throw new Error("Could not prepare meme image.")
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        resolve(pngBlob)
        return
      }

      reject(new Error("Could not convert meme image."))
    }, "image/png")
  })
}

const copyMemeImage = async (blob: Blob) => {
  if (
    typeof ClipboardItem === "undefined" ||
    typeof navigator.clipboard?.write !== "function"
  ) {
    return false
  }

  const pngBlob = await convertBlobToPng(blob)

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlob
    })
  ])

  return true
}

const pasteCopiedImage = (box: HTMLElement) => {
  focusCommentBox(box)

  try {
    return document.execCommand("paste")
  } catch {
    return false
  }
}

const pasteMemeIntoComment = async (
  box: HTMLElement,
  meme: Meme
): Promise<PasteResult> => {
  try {
    const blob = await fetchMemeBlob(meme)
    const copied = await copyMemeImage(blob)

    if (copied) {
      return pasteCopiedImage(box) ? "pasted" : "copied"
    }
  } catch (error) {
    console.warn("Could not paste meme image, falling back to URL:", error)
  }

  focusCommentBox(box)
  return "url"
}

const MemePicker = () => {
  const [target, setTarget] = useState<CommentTarget | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [pasteStatus, setPasteStatus] = useState<string | null>(null)
  const context = useMemo(() => target?.context.trim() ?? "", [target])
  const { data, error, isFetching, isPending } = useQuery<MemeQueryResult>({
    enabled: Boolean(target),
    queryFn: async () => {
      return {
        memes: await appClient.meme.getAll(),
        source: "all"
      }
    },
    queryKey: ["facebook", "meme-suggestions", context]
  })
  const memes = data?.memes ?? []

  useEffect(() => {
    const attachedBoxes = new WeakSet<HTMLElement>()

    const attachButton = (box: HTMLElement) => {
      if (attachedBoxes.has(box)) {
        return
      }

      const host = findButtonHost(box)
      if (!host) {
        return
      }

      attachedBoxes.add(box)

      const button = document.createElement("button")
      button.type = "button"
      button.textContent = "Meme"
      button.className = "mp-inline-button"
      button.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()

        const extractedContext = extractPostContext(box)

        setTarget({
          box,
          context: extractedContext.text,
          debugCandidates: extractedContext.debugCandidates
        })
      })

      host.appendChild(button)
    }

    const scanCommentBoxes = () => {
      document
        .querySelectorAll('[contenteditable="true"][role="textbox"]')
        .forEach((element) => {
          if (isFacebookCommentBox(element)) {
            attachButton(element)
          }
        })
    }

    scanCommentBoxes()

    const observer = new MutationObserver(scanCommentBoxes)
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (error) {
      console.error("Failed to suggest memes:", error)
    }
  }, [error])

  const handleSelectMeme = async (meme: Meme) => {
    if (!target) {
      return
    }

    const result = await pasteMemeIntoComment(target.box, meme)
    setTarget(null)

    if (result === "copied") {
      setPasteStatus("Meme copied. Press Ctrl+V in the comment box.")
    } else if (result === "url") {
      setPasteStatus("Could not copy the image. Please try another meme.")
    } else {
      setPasteStatus(null)
    }
  }

  useEffect(() => {
    if (!pasteStatus) {
      return
    }

    const timeout = window.setTimeout(() => setPasteStatus(null), 4000)
    return () => window.clearTimeout(timeout)
  }, [pasteStatus])

  if (!target) {
    return pasteStatus ? <div className="mp-toast">{pasteStatus}</div> : null
  }

  return (
    <div className="mp-picker">
      <div className="mp-backdrop" onClick={() => setTarget(null)} />
      <section className="mp-panel">
        <header className="mp-header">
          <div>
            <h2>Meme Picker</h2>
            <p>
              {data?.source === "suggest" ? "Suggested memes" : "All memes"}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setTarget(null)}>
            Close
          </Button>
        </header>

        <div className="mp-context">
          <div className="mp-context-title">
            <span>Post context</span>
            <button type="button" onClick={() => setShowDebug((prev) => !prev)}>
              Debug
            </button>
          </div>
          <p>{context || "No post text detected."}</p>
        </div>

        {showDebug && (
          <div className="mp-debug-context">
            <span>Debug candidates - suggest API paused</span>
            {target.debugCandidates.length > 0 ? (
              target.debugCandidates.map((candidate, index) => (
                <p key={`${index}-${candidate.slice(0, 12)}`}>
                  {index + 1}. {candidate}
                </p>
              ))
            ) : (
              <p>No candidates detected.</p>
            )}
          </div>
        )}

        <div className="mp-list">
          <MemeGrid
            memes={memes}
            error={error ? chrome.i18n.getMessage("memeLoadError") : null}
            isLoading={isPending || isFetching}
            onSelect={handleSelectMeme}
          />
        </div>
      </section>
      {pasteStatus && <div className="mp-toast">{pasteStatus}</div>}
    </div>
  )
}

const MemePickerWithQuery = () => (
  <QueryClientProvider client={queryClient}>
    <MemePicker />
  </QueryClientProvider>
)

export default MemePickerWithQuery
