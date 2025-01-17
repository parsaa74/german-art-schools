export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative data-container p-8 border border-primary/20 backdrop-blur-sm">
        {/* Glitch text container */}
        <div className="text-center space-y-6 relative z-10">
          <div className="space-y-2">
            <p className="text-accent/60 font-mono text-sm tracking-wider">
              [SYSTEM_ERROR_LOG]
            </p>
            <h1 
              data-text="404::DATA_NOT_FOUND" 
              className="text-6xl font-mono tracking-wider"
            >
              404::DATA_NOT_FOUND
            </h1>
          </div>
          
          <div className="space-y-4 text-light/60">
            <p className="font-mono text-sm">
              {'<error_code: 0x404>'}<br/>
              {'<timestamp: ' + new Date().toISOString() + '>'}<br/>
              {'<location: /undefined_data_stream>'}<br/>
            </p>
            <p className="text-xs opacity-50 max-w-md mx-auto">
              The requested data stream could not be located in the current matrix. 
              Please verify your quantum coordinates and try again.
            </p>
          </div>

          <div className="mt-12">
            <a 
              href="/" 
              className="interactive-element inline-block px-8 py-3 text-primary hover:text-accent
                       transition-all duration-300 font-mono tracking-wide text-sm"
            >
              {'> RETURN_TO_MAIN_DATA_STREAM'}
            </a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </div>
    </div>
  )
} 