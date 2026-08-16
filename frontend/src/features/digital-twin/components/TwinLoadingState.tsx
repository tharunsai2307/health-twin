export function TwinLoadingState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-6 rounded-2xl bg-[#070d1f]">
      <div className="relative">
        <div className="h-20 w-20 animate-ping rounded-full border-2 border-indigo-500/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-cyan-400/60" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 rounded-full bg-indigo-500/80" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/80">Initialising Digital Health Twin</p>
        <p className="mt-1 text-xs text-white/40">Loading 3D model and health context...</p>
      </div>
    </div>
  )
}
