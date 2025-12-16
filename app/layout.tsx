import './globals.css'
import { Provider } from '@/components/ui/provider'
import { SystemNotification } from '@/components/SystemNotification'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'DNCL Supply Internal Tool',
  description: 'Internal tool for managing and viewing Supabase data',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Provider>
          <SystemNotification />
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </Provider>
      </body>
    </html>
  )
}

