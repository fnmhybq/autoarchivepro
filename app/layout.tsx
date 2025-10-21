import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '文件自动分类系统',
  description: '基于文件名的智能文件分类归档工具',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google Analytics */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-PV02XVCEF1`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PV02XVCEF1', {
                page_title: '文件自动分类系统',
                page_location: window.location.href,
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
