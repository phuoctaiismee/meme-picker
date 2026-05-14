import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query"
import cssText from "data-text:~/style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"

import { appClient } from "./apis/client"
import { OverlayLayout } from "./components/layout/overlay-layout"
import { MemeGrid } from "./features/meme-picker/components/meme-grid"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
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

const MemeOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    data: memes = [],
    error,
    isFetching,
    isPending
  } = useQuery({
    enabled: isOpen,
    queryFn: () => appClient.meme.getAll(),
    queryKey: ["memes", "all"]
  })

  useEffect(() => {
    const handleMessage = (
      request: { name?: string },
      _sender: chrome.runtime.MessageSender,
      _sendResponse: (response?: unknown) => void
    ) => {
      if (request.name === "TOGGLE_OVERLAY") {
        setIsOpen((prev) => !prev)
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "m") {
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (error) {
      console.error("Failed to load memes:", error)
    }
  }, [error])

  return (
    <OverlayLayout
      isOpen={isOpen}
      onClose={() => setIsOpen((prev) => !prev)}
      title={chrome.i18n.getMessage("headerTitle")}
      footerHint={chrome.i18n.getMessage("toggleHint")}>
      <MemeGrid
        memes={memes}
        error={error ? chrome.i18n.getMessage("memeLoadError") : null}
        isLoading={isOpen && isPending && isFetching}
      />
    </OverlayLayout>
  )
}

const MemeOverlayWithQuery = () => (
  <QueryClientProvider client={queryClient}>
    <MemeOverlay />
  </QueryClientProvider>
)

export default MemeOverlayWithQuery
