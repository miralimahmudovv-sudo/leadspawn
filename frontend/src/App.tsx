import { motion } from 'framer-motion'
import { Toaster } from 'sonner'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { SearchForm } from '@/components/SearchForm'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { ResultsSection } from '@/components/results/ResultsSection'
import { useLeadSearch } from '@/hooks/useLeadSearch'

function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="bottom-right" richColors />
}

function AppContent() {
  const { state, search, retry } = useLeadSearch()
  const busy = state.status === 'searching' || state.status === 'revealing'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col"
    >
      <Header />
      <main className="flex-1">
        <Hero>
          <SearchForm busy={busy} onSearch={(params) => void search(params)} />
        </Hero>
        <ResultsSection state={state} onRetry={retry} />
      </main>
      <Footer />
    </motion.div>
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
