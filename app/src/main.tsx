import { createRoot } from 'react-dom/client'
import { Component, type ReactNode } from 'react'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message + '\n' + (error.stack || '') }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React Error Boundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 700, margin: '40px auto', background: '#fff', borderRadius: 10, border: '1px solid #E5E4E0' }}>
          <h2 style={{ color: '#B91C1C', marginBottom: 16 }}>Application Error</h2>
          <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12, overflowX: 'auto', maxHeight: 400 }}>{this.state.error}</pre>
          <p style={{ color: '#737373', marginTop: 16, fontSize: 13 }}>Try refreshing the page. If the problem persists, contact support.</p>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
