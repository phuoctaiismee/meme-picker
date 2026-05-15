import type { CmsMeme, Meme } from "../interfaces/meme"
import { apiRequest } from "./config"

const mapMeme = (meme: CmsMeme): Meme => ({
  id: meme.id,
  url: meme.media_url,
  title: meme.title ?? meme.media_key ?? "Untitled meme",
  media_type: meme.media_type,
  ocr_content: meme.ocr_content,
  tags: meme.tags
})

export const suggest = {
  async get(context: string, limit?: number): Promise<Meme[]> {
    const data = await apiRequest<CmsMeme[]>(
      {
        data: {
          context,
          limit
        },
        method: "POST",
        url: "/api/suggest"
      },
      "Failed to suggest memes."
    )

    return data.map(mapMeme)
  }
}
