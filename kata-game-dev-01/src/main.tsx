import React from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { QuadConfigProvider } from '@/contexts/QuadConfigContext'
import '@/index.css'

// Mount React application and provide persisted quad config via context
const mountApp = () => {
  const root = createRoot(document.getElementById('root')!)
  root.render(
    <React.StrictMode>
      <QuadConfigProvider>
        <App />
      </QuadConfigProvider>
    </React.StrictMode>
  )
}

mountApp()
