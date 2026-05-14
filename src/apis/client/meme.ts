import type { CmsMeme, Meme, PaginatedResult } from "../interfaces/meme"
import { apiRequest } from "./config"

const mapMeme = (meme: CmsMeme): Meme => ({
  id: meme.id,
  url: meme.media_url,
  title: meme.title ?? meme.media_key ?? "Untitled meme",
  media_type: meme.media_type,
  ocr_content: meme.ocr_content
})

export const meme = {
  async getAll(): Promise<Meme[]> {
    const data = await apiRequest<PaginatedResult<CmsMeme>>(
      {
        method: "GET",
        params: {
          page: 1,
          pageSize: 100,
          status: "active",
          sortBy: "created_at",
          sortOrder: "desc"
        },
        url: "/api/memes"
      },
      "Failed to load memes."
    )

    return data.data.map(mapMeme)
  }
}
