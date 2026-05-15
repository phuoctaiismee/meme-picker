const translations = {
  en: {
    shelfTitle: "MEME SHELF",
    searchPlaceholder: "Search or describe (AI)...",
    allMemes: "ALL MEMES",
    searchResults: "SEARCH RESULTS",
    aiSuggestions: "AI SUGGESTIONS",
    noMemesFound: "No memes found",
    trySearchingElse: "Try searching for something else or check your tags.",
    somethingWentWrong: "Something went wrong",
    tryAgain: "Try Again",
    focusFirst: "Focus a comment box first!",
    uploading: "Uploading...",
    success: "Success!",
    uploadFailed: "Upload failed",
    droppedSuccess: "Meme Uploaded!",
    droppedFailed: "Drop failed. Try clicking!",
    clearSearch: "Clear search",
    noUploadBox: "Could not find upload box nearby.",
    allTag: "All"
  },
  vi: {
    shelfTitle: "KỆ MEME",
    searchPlaceholder: "Tìm kiếm hoặc mô tả (AI)...",
    allMemes: "TẤT CẢ MEME",
    searchResults: "KẾT QUẢ TÌM KIẾM",
    aiSuggestions: "GỢI Ý AI",
    noMemesFound: "Không tìm thấy meme nào",
    trySearchingElse: "Thử tìm kiếm nội dung khác hoặc kiểm tra lại các thẻ.",
    somethingWentWrong: "Đã có lỗi xảy ra",
    tryAgain: "Thử lại",
    focusFirst: "Hãy chọn ô bình luận trước!",
    uploading: "Đang tải lên...",
    success: "Thành công!",
    uploadFailed: "Tải lên thất bại",
    droppedSuccess: "Đã dán Meme!",
    droppedFailed: "Kéo thả thất bại. Hãy thử click!",
    clearSearch: "Xóa tìm kiếm",
    noUploadBox: "Không tìm thấy ô nạp ảnh gần đây.",
    allTag: "Tất cả"
  }
}

export type Language = "en" | "vi"
export type TranslationKey = keyof typeof translations.en

export const getLanguage = (): Language => {
  const lang = navigator.language.split("-")[0]
  return lang === "vi" ? "vi" : "en"
}

export const t = (key: TranslationKey): string => {
  const lang = getLanguage()
  return translations[lang][key]
}
