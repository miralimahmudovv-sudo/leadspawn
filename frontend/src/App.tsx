import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Toaster } from 'sonner'

import { Background } from '@/components/Background'
import { CustomCursor } from '@/components/CustomCursor'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { SearchForm } from '@/components/SearchForm'
import { SplashScreen } from '@/components/SplashScreen'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { ResultsSection } from '@/components/results/ResultsSection'
import { useLeadSearch } from '@/hooks/useLeadSearch'

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="bottom-right" richColors />
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function AppContent() {
  const { state, search, retry } = useLeadSearch()
  const [splashVisible, setSplashVisible] = useState(() => !prefersReducedMotion())
  const busy = state.status === 'searching' || state.status === 'revealing'

  return (
    <>
      <AnimatePresence>
        {splashVisible && <SplashScreen onDone={() => setSplashVisible(false)} />}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex min-h-screen flex-col"
      >
        <Background />
        <CustomCursor />
        <Header showBrand={!splashVisible} />
        <main className="flex-1">
          <Hero>
            <SearchForm busy={busy} onSearch={(params) => void search(params)} />
          </Hero>
          <ResultsSection state={state} onRetry={retry} />
        </main>
        <Footer />
      </motion.div>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedToaster />
      <AppContent />
    </ThemeProvider>
  )
}
