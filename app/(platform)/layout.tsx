import { Toaster } from "@/components/ui/toaster"
import NextAuthSessionProvider from "@/lib/nextauth-provider"
import TanstackProvider from "@/lib/tanstack-provider"
import { ClerkProvider } from "@clerk/nextjs"

export default function PlatformLayout({
      <NextAuthSessionProvider>
        {children}
        <Toaster />
      </NextAuthSessionProvider>
  )
}
