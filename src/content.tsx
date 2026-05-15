import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query"
import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig, PlasmoGetShadowHostId } from "plasmo"
import { useEffect, useState, useMemo } from "react"

import { appClient } from "./apis/client"
import type { Meme } from "./apis/interfaces/meme"
import { MemeGrid } from "./features/meme-picker/components/meme-grid"
import { SearchIcon, XIcon } from "./features/meme-picker/components/icons"
import { t } from "./lib/i18n"

/** 
 * Version: 2.9.0 - Speed Boost & Offline Cache
 * Feature: chrome.storage.local caching (SWR)
 * Feature: Multi-language support (EN/VI)
 * Feature: Click-outside to close
 * Feature: Clearable search input
 */

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getShadowHostId: PlasmoGetShadowHostId = () => "mp-shelf-root"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const queryClient = new QueryClient()

// --- HELPERS ---

const getCompatibleUrl = (meme: Meme) => {
  let url = meme.url
  if (url.includes("cloudinary.com")) {
    url = url.replace(/\/f_[^,/]+/, "").replace(/,f_[^,/]+/, "")
    if (!url.includes("/f_gif")) {
      url = url.replace(/\/upload\/(v\d+\/)?/, "/upload/f_gif/$1")
    }
    url = url.replace(/\.(jpg|jpeg|png|webp)($|\?)/i, ".gif$1")
  }
  return url
}

const fetchMemeFile = async (meme: Meme): Promise<File> => {
  const url = getCompatibleUrl(meme)
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { name: "IMAGE_REQUEST", payload: { url } },
      async (res) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
        if (!res?.ok || !res.data?.dataUrl) return reject(new Error("Fetch failed"))
        const blobRes = await fetch(res.data.dataUrl)
        const blob = await blobRes.blob()
        const isGif = blob.type === "image/gif" || url.toLowerCase().includes(".gif")
        resolve(new File([blob], `meme.${isGif ? "gif" : "png"}`, { type: isGif ? "image/gif" : "image/png" }))
      }
    )
  })
}

let lastFocusedElement: HTMLElement | null = null
document.addEventListener('focusin', (e) => {
  if (e.target instanceof HTMLElement) lastFocusedElement = e.target
})

let currentDragFile: File | null = null

const performManualUpload = (target: HTMLElement, file: File) => {
  let curr: HTMLElement | null = target
  let input: HTMLInputElement | null = null
  for (let i = 0; i < 15 && curr; i++) {
    input = curr.querySelector('input[type="file"][accept*="image"]')
    if (input) break
    const presentation = curr.closest('[role="presentation"]')
    if (presentation) {
      input = presentation.querySelector('input[type="file"][accept*="image"]')
      if (input) break
    }
    curr = curr.parentElement
  }
  if (input) {
    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  }
  return false
}

document.addEventListener("dragover", (e) => { if (currentDragFile) e.preventDefault() }, true)
document.addEventListener("drop", (e) => {
  if (currentDragFile) {
    e.preventDefault(); e.stopPropagation()
    const target = e.target as HTMLElement
    const success = performManualUpload(target, currentDragFile)
    currentDragFile = null
    window.dispatchEvent(new CustomEvent("mp-drop-success", { detail: { success } }))
  }
}, true)

// --- MAIN COMPONENT ---

const MemeShelf = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [prefetchedFiles, setPrefetchedFiles] = useState<Record<string, File>>({})
  
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // OFFLINE CACHE LOGIC (SWR)
  const { data: allData, isLoading: isAllLoading, isError: isAllError, refetch: refetchAll } = useQuery({
    queryKey: ["all-memes"],
    queryFn: async () => {
      const memes = await appClient.meme.getAll()
      chrome.storage.local.set({ "mp_cache_memes": memes, "mp_cache_time": Date.now() })
      return { memes }
    }
  })

  // Prime the cache from local storage on mount
  useEffect(() => {
    chrome.storage.local.get(["mp_cache_memes"], (result) => {
      if (result.mp_cache_memes) {
        queryClient.setQueryData(["all-memes"], { memes: result.mp_cache_memes })
      }
    })
  }, [])

  const { data: suggestData, isFetching: isSuggestFetching, isError: isSuggestError, refetch: refetchSuggest } = useQuery({
    queryFn: async () => ({ memes: await appClient.suggest.get(debouncedSearch, 12) }),
    queryKey: ["suggest-memes", debouncedSearch],
    enabled: debouncedSearch.length >= 2
  })

  const allTags = useMemo(() => {
    if (!allData?.memes) return []
    const tagMap = new Map<string, string>()
    allData.memes.forEach(m => {
      m.tags?.forEach(t => tagMap.set(t.slug, t.name))
    })
    return Array.from(tagMap.entries()).map(([slug, name]) => ({ slug, name }))
  }, [allData?.memes])

  const filteredAllMemes = useMemo(() => {
    const list = allData?.memes || []
    if (!debouncedSearch && !selectedTag) return list

    const q = debouncedSearch.toLowerCase().trim()
    return list.filter(m => {
      const matchesSearch = !q || 
                            m.title.toLowerCase().includes(q) || 
                            (m.ocr_content && m.ocr_content.toLowerCase().includes(q))
      const matchesTag = !selectedTag || m.tags?.some(t => t.slug === selectedTag)
      return matchesSearch && matchesTag
    })
  }, [allData?.memes, debouncedSearch, selectedTag])

  // CLICK OUTSIDE TO CLOSE
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const path = e.composedPath()
      const shelfRoot = document.getElementById("mp-shelf-root")?.shadowRoot?.querySelector(".mp-shelf")
      
      if (shelfRoot && !path.includes(shelfRoot)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    const handleDropNotify = (e: any) => {
      if (e.detail.success) { setToast(t("droppedSuccess")); setIsOpen(false) }
      else { setToast(t("droppedFailed")) }
    }
    window.addEventListener("mp-drop-success", handleDropNotify)
    return () => window.removeEventListener("mp-drop-success", handleDropNotify)
  }, [])

  const handleMouseEnter = async (meme: Meme) => {
    if (prefetchedFiles[meme.id]) return
    try {
      const file = await fetchMemeFile(meme)
      setPrefetchedFiles(prev => ({ ...prev, [meme.id]: file }))
    } catch (e) { console.warn("Prefetch fail", e) }
  }

  const handleDragStart = (e: React.DragEvent, meme: Meme) => {
    const file = prefetchedFiles[meme.id]
    if (file) currentDragFile = file
    e.dataTransfer.setData("text/plain", "meme-drag")
    e.dataTransfer.effectAllowed = "copy"
    setTimeout(() => setIsOpen(false), 500)
  }

  const handleMemeClick = async (meme: Meme) => {
    if (!lastFocusedElement) {
      setToast(t("focusFirst"))
      return
    }

    setToast(t("uploading"))
    try {
      const file = prefetchedFiles[meme.id] || await fetchMemeFile(meme)
      const success = performManualUpload(lastFocusedElement, file)
      
      if (success) {
        setToast(t("success"))
        setIsOpen(false)
      } else {
        setToast(t("noUploadBox"))
      }
    } catch (e) {
      setToast(t("uploadFailed"))
      console.error("Upload error:", e)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <div className="mp-marker" onClick={() => setIsOpen(true)} />

      <div className={`mp-shelf ${isOpen ? "open" : ""}`}>
        <header className="mp-header">
          <div className="mp-header-top">
            <h2>{t("shelfTitle")}</h2>
            <button className="mp-close" onClick={() => setIsOpen(false)}>
              <XIcon size={18} />
            </button>
          </div>

          <div className="mp-search-container">
            <SearchIcon className="mp-search-icon" size={16} />
            <input 
              type="text" 
              className="mp-search-input" 
              placeholder={t("searchPlaceholder")} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="mp-search-clear" 
                onClick={() => setSearchQuery("")}
                title={t("clearSearch")}
              >
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div className="mp-tags-container">
            <div 
              className={`mp-tag ${!selectedTag ? "active" : ""}`}
              onClick={() => setSelectedTag(null)}
            >
              {t("allTag")}
            </div>
            {allTags.map(tag => (
              <div 
                key={tag.slug} 
                className={`mp-tag ${selectedTag === tag.slug ? "active" : ""}`}
                onClick={() => setSelectedTag(tag.slug)}
              >
                {tag.name}
              </div>
            ))}
          </div>
        </header>

        <div className="mp-content">
          {/* AI SUGGESTIONS SECTION */}
          {debouncedSearch.length >= 2 && (
            <div className="mp-section">
              <div className="mp-section-header">
                {t("aiSuggestions")} {isSuggestFetching && "..."}
              </div>
              <MemeGrid 
                memes={suggestData?.memes || []} 
                isLoading={isSuggestFetching}
                error={isSuggestError ? t("somethingWentWrong") : null}
                onRetry={refetchSuggest}
                onSelect={handleMemeClick}
                renderItem={(meme, OriginalItem) => (
                  <div 
                    key={`suggest-${meme.id}`}
                    draggable 
                    onDragStart={(e) => handleDragStart(e, meme)}
                    onMouseEnter={() => handleMouseEnter(meme)}
                    className="mp-meme-item"
                  >
                    {OriginalItem}
                  </div>
                )}
              />
            </div>
          )}

          {/* ALL MEMES SECTION */}
          <div className="mp-section">
            <div className="mp-section-header">
              {debouncedSearch ? t("searchResults") : t("allMemes")}
            </div>
            <MemeGrid 
              memes={filteredAllMemes} 
              isLoading={isAllLoading}
              error={isAllError ? t("somethingWentWrong") : null}
              onRetry={refetchAll}
              onSelect={handleMemeClick}
              renderItem={(meme, OriginalItem) => (
                <div 
                  key={`all-${meme.id}`}
                  draggable 
                  onDragStart={(e) => handleDragStart(e, meme)}
                  onMouseEnter={() => handleMouseEnter(meme)}
                  className="mp-meme-item"
                >
                  {OriginalItem}
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {toast && <div className="mp-toast">{toast}</div>}
    </>
  )
}

export default () => (
  <QueryClientProvider client={queryClient}>
    <MemeShelf />
  </QueryClientProvider>
)
