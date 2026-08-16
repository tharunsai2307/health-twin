import { useState, Suspense, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { DigitalTwinScene } from './DigitalTwinScene'
import { OrganDetailPanel } from './OrganDetailPanel'
import { TwinLoadingState } from './TwinLoadingState'
import { TwinErrorState } from './TwinErrorState'
import { useOrganData } from '../hooks/useOrganData'
import { ORGAN_CONFIGS, ORGAN_IDS } from '../organConfig'
import type { OrganId } from '../types'

interface DigitalTwinViewerProps {
  patientId?: string
  compact?: boolean
  className?: string
}

export function DigitalTwinViewer({ patientId, compact = false, className = '' }: DigitalTwinViewerProps) {
  const [selectedOrgan, setSelectedOrgan] = useState<OrganId | null>(null)
  const [sceneError, setSceneError] = useState<string | null>(null)

  const { data: organData, loading: organLoading, error: organError } = useOrganData(
    selectedOrgan,
    patientId
  )

  const handleSelect = useCallback((organ: OrganId) => setSelectedOrgan(organ), [])
  const handleBack = useCallback(() => setSelectedOrgan(null), [])

  const viewportMinH = compact ? 'min-h-[300px]' : 'min-h-[480px] lg:min-h-[580px]'

  return (
    <div className={['flex flex-col gap-4 lg:flex-row', className].join(' ')}>
      {/* 3D Viewport */}
      <div className={['relative flex-1 overflow-hidden rounded-2xl border border-white/12', viewportMinH].join(' ')}
           style={{ background: '#070d1f' }}>
        {sceneError ? (
          <TwinErrorState message={sceneError} onRetry={() => setSceneError(null)} />
        ) : (
          <Suspense fallback={<TwinLoadingState />}>
            <Canvas
              camera={{ position: [0, 0.18, 3.2], fov: 42, near: 0.1, far: 50 }}
              shadows
              dpr={[1, 2]}
              aria-label="Interactive 3D Digital Health Twin"
            >
              <DigitalTwinScene
                selectedOrgan={selectedOrgan}
                onOrganSelect={handleSelect}
              />
            </Canvas>
          </Suspense>
        )}

        {/* Selected organ badge */}
        {selectedOrgan && (
          <div className="pointer-events-none absolute left-3 top-3">
            <div className="flex items-center gap-2 rounded-xl bg-black/55 px-3 py-1.5 backdrop-blur-md">
              <span className="text-sm">{ORGAN_CONFIGS[selectedOrgan].emoji}</span>
              <span className="text-sm font-semibold text-white">
                {ORGAN_CONFIGS[selectedOrgan].label}
              </span>
              <span className="rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[9px] text-indigo-300">
                SELECTED
              </span>
            </div>
          </div>
        )}

        {/* Controls hint */}
        {!compact && (
          <div className="pointer-events-none absolute bottom-3 right-3">
            <p className="rounded-lg bg-black/45 px-2.5 py-1.5 text-[9px] text-white/35 backdrop-blur-sm">
              Drag to rotate &middot; Scroll to zoom &middot; Click organ to inspect
            </p>
          </div>
        )}
      </div>

      {/* Organ Detail Panel */}
      {selectedOrgan && (
        <div className="w-full lg:w-[285px] xl:w-[305px]">
          <OrganDetailPanel
            organ={selectedOrgan}
            data={organData}
            loading={organLoading}
            error={organError}
            onBack={handleBack}
          />
        </div>
      )}

      {/* Mobile organ selector buttons */}
      {!compact && (
        <div className="flex flex-wrap gap-2 lg:hidden">
          <p className="w-full text-xs font-medium text-navy-400">Select an organ:</p>
          {ORGAN_IDS.map((id) => {
            const cfg = ORGAN_CONFIGS[id]
            const isSelected = selectedOrgan === id
            return (
              <button
                key={id}
                onClick={() => isSelected ? handleBack() : handleSelect(id)}
                className={[
                  'flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                  isSelected
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                    : 'border-navy-200 bg-white text-navy-700 hover:border-indigo-300'
                ].join(' ')}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${cfg.label}`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
              </button>
            )
          })}
          {selectedOrgan && (
            <button
              onClick={handleBack}
              className="rounded-xl border border-navy-200 px-3 py-2 text-xs font-medium text-navy-500 hover:bg-navy-50"
            >
              Full Body
            </button>
          )}
        </div>
      )}
    </div>
  )
}
