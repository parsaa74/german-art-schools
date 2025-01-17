import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ThreeJSErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ThreeJS Error:', error)
    console.error('Error Info:', errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center p-4">
            <h2 className="text-xl font-bold mb-2">3D Visualization Error</h2>
            <p className="text-sm opacity-80">
              There was an error loading the 3D visualization.
              Please refresh the page or try again later.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ThreeJSErrorBoundary 