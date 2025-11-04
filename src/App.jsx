/**
 * App Component
 * Main application component that renders the Pages and Toaster components
 * Last updated: 2025-11-04
 */

import './App.css'
import Pages from '@/pages/index.jsx'
import { Toaster } from '@/components/ui/toaster'

function App() {
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App
