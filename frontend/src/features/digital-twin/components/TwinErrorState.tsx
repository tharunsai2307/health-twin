interface TwinErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function TwinErrorState({ message, onRetry }: TwinErrorStateProps) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl bg-[#070d1f]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
        <span className="text-2xl">\u26A0\uFE0F</span>
      </div>
      <div className="text-center">
        <p className="font-semibold text-white/80">Digital Twin Unavailable</p>
        <p className="mt-1 max-w-xs text-xs text-white/40">
          {message || 'Unable to load the 3D health model. Please check your connection.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm text-indigo-300 transition-colors hover:bg-indigo-500/20"
        >
          Retry
        </button>
      )}
    </div>
  )
}
