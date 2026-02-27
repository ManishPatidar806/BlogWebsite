export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-ink-50 dark:bg-ink-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo animation */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center animate-pulse-soft">
            <span className="text-white font-bold text-3xl">I</span>
          </div>
          {/* Spinner ring */}
          <div className="absolute inset-0 -m-2">
            <div className="w-20 h-20 border-4 border-accent-200 dark:border-accent-800 border-t-accent-500 rounded-full animate-spin" />
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-ink-600 dark:text-ink-400 text-sm font-medium">
            Loading...
          </p>
        </div>
      </div>
    </div>
  )
}
