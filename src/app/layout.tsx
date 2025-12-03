import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <footer className="w-full border-t border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-4 text-sm text-slate-600">
              <span className="mr-1">Made with</span>
              <span className="mx-1" aria-label="love" role="img">❤️</span>
              <span className="mr-1">by</span>
              <a
                href="https://github.com/nooblk-98/ComposeConfigStudio"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple-700 hover:text-purple-900"
              >
                nooblk
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
