export interface MemeTag {
  id: string
  name: string
  slug: string
  category: string | null
}

export interface CmsMeme {
  id: string
  media_key: string
  title: string | null
  media_url: string
  storage_provider: string | null
  media_type: string | null
  ocr_content: string | null
  access_tier: string | null
  is_active: boolean | null
  created_at: string
  tags: MemeTag[]
}

export interface Meme {
  id: string
  url: string
  title: string
  media_type?: string | null
  ocr_content?: string | null
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}
