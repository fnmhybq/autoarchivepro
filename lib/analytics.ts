// Google Analytics 事件跟踪
export const GA_TRACKING_ID = 'G-PV02XVCEF1'

// 页面浏览跟踪
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// 自定义事件跟踪
export const event = ({ action, category, label, value }: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 文件上传事件
export const trackFileUpload = (fileCount: number) => {
  event({
    action: 'file_upload',
    category: 'engagement',
    label: `files_uploaded_${fileCount}`,
    value: fileCount,
  })
}

// 文件分类事件
export const trackFileClassification = (firstLevel: string, secondLevel: string) => {
  event({
    action: 'file_classification',
    category: 'engagement',
    label: `${firstLevel}_${secondLevel}`,
  })
}

// 文件下载事件
export const trackFileDownload = (fileCount: number) => {
  event({
    action: 'file_download',
    category: 'conversion',
    label: `files_downloaded_${fileCount}`,
    value: fileCount,
  })
}

// 错误跟踪
export const trackError = (error: string, context: string) => {
  event({
    action: 'error',
    category: 'error',
    label: `${context}: ${error}`,
  })
}

// 声明全局 gtag 函数
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
