import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FoodieGen',
  description: 'Tạo video marketing đồ ăn chuyên nghiệp với AI. Hỗ trợ 720p và 1080p với Veo 3.1 Fast.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
