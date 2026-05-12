import type { PlasmoCSConfig } from "plasmo"
import { useState, useEffect } from "react"
import cssText from "data-text:~/style.css"
import { OverlayTemplate } from "./components/templates/OverlayTemplate"
import { MemeGrid } from "./components/organisms/MemeGrid"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const MEMES = [
  { id: 1, url: "https://images.unsplash.com/photo-1531928351158-2f7360b94b51?w=400&h=400&fit=crop", title: "Funny Cat" },
  { id: 2, url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop", title: "Surprised Dog" },
  { id: 3, url: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=400&h=400&fit=crop", title: "Cool Panda" },
  { id: 4, url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop", title: "Happy Pug" },
]

const MemeOverlay = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleMessage = (request) => {
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

  return (
    <OverlayTemplate
      isOpen={isOpen}
      onClose={() => setIsOpen((prev) => !prev)}
      title={chrome.i18n.getMessage("headerTitle")}
      footerHint={chrome.i18n.getMessage("toggleHint")}
    >
      <MemeGrid memes={MEMES} />
    </OverlayTemplate>
  )
}

export default MemeOverlay
