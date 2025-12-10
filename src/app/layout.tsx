import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SidebarComponent from '@/components/layout/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Docker Stack Generator',
  description: 'Generate Docker Compose and CLI commands with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
         
          <div className="flex flex-1">
            <SidebarComponent />
            <main className="">
              {children}
            </main>
          </div>
          
        </div>
      </body>
    </html>
  )
}
