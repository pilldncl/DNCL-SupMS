import './globals.css'

export const metadata = {
  title: 'DNCL Supply Internal Tool',
  description: 'Internal tool for managing and viewing Supabase data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

