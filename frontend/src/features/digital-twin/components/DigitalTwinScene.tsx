import { Suspense } from 'react'
import { HumanBodyMesh } from './HumanBodyMesh'
import { OrganNode } from './OrganNode'
import { CameraController } from './CameraController'
import { ORGAN_IDS } from '../organConfig'
import type { OrganId } from '../types'

interface DigitalTwinSceneProps {
  selectedOrgan: OrganId | null
  onOrganSelect: (organ: OrganId) => void
}

export function DigitalTwinScene({ selectedOrgan, onOrganSelect }: DigitalTwinSceneProps) {
  return (
    <>
      <color attach="background" args={['#070d1f']} />
      <fog attach="fog" args={['#070d1f', 5.5, 14]} />

      {/* Clinical lighting */}
      <ambientLight intensity={0.38} color="#c4d4f4" />
      <directionalLight position={[3, 4, 3]} intensity={1.05} color="#ffffff" castShadow />
      <directionalLight position={[-2, 1, -3]} intensity={0.28} color="#6ea0f8" />
      <pointLight position={[0, -1.5, 1]} intensity={0.22} color="#3b5bdb" distance={4.5} />

      <Suspense fallback={null}>
        <HumanBodyMesh selectedOrgan={selectedOrgan} />
      </Suspense>

      {ORGAN_IDS.map((id) => (
        <OrganNode
          key={id}
          organId={id}
          selected={selectedOrgan === id}
          dimmed={selectedOrgan !== null && selectedOrgan !== id}
          onClick={() => onOrganSelect(id)}
        />
      ))}

      <CameraController selectedOrgan={selectedOrgan} />
    </>
  )
}
