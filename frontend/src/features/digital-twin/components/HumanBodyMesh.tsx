import type { ReactNode } from 'react'
import * as THREE from 'three'
import type { OrganId } from '../types'

interface PartProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  opacity: number
  children: ReactNode
}

function Part({ position, rotation = [0, 0, 0], opacity, children }: PartProps) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      {children}
      <meshPhysicalMaterial
        color="#3b82f6"
        transparent
        opacity={opacity}
        roughness={0.85}
        metalness={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

interface HumanBodyMeshProps {
  selectedOrgan: OrganId | null
}

export function HumanBodyMesh({ selectedOrgan }: HumanBodyMeshProps) {
  const opacity = selectedOrgan ? 0.045 : 0.10

  return (
    <group name="human-body">
      {/* Head */}
      <Part position={[0, 0.82, 0]} opacity={opacity}>
        <sphereGeometry args={[0.18, 20, 16]} />
      </Part>
      {/* Neck */}
      <Part position={[0, 0.64, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.065, 0.09, 0.15, 14]} />
      </Part>
      {/* Upper torso */}
      <Part position={[0, 0.32, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.21, 0.195, 0.52, 18]} />
      </Part>
      {/* Abdomen */}
      <Part position={[0, 0.0, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.19, 0.165, 0.38, 18]} />
      </Part>
      {/* Pelvis */}
      <Part position={[0, -0.25, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.175, 0.145, 0.20, 16]} />
      </Part>
      {/* Left shoulder */}
      <Part position={[-0.24, 0.56, 0]} opacity={opacity}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </Part>
      {/* Right shoulder */}
      <Part position={[0.24, 0.56, 0]} opacity={opacity}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </Part>
      {/* Left upper arm */}
      <Part position={[-0.31, 0.28, 0]} rotation={[0, 0, 0.28]} opacity={opacity}>
        <cylinderGeometry args={[0.055, 0.05, 0.44, 10]} />
      </Part>
      {/* Right upper arm */}
      <Part position={[0.31, 0.28, 0]} rotation={[0, 0, -0.28]} opacity={opacity}>
        <cylinderGeometry args={[0.055, 0.05, 0.44, 10]} />
      </Part>
      {/* Left lower arm */}
      <Part position={[-0.40, 0.0, 0]} rotation={[0, 0, 0.42]} opacity={opacity}>
        <cylinderGeometry args={[0.045, 0.038, 0.40, 10]} />
      </Part>
      {/* Right lower arm */}
      <Part position={[0.40, 0.0, 0]} rotation={[0, 0, -0.42]} opacity={opacity}>
        <cylinderGeometry args={[0.045, 0.038, 0.40, 10]} />
      </Part>
      {/* Left upper leg */}
      <Part position={[-0.1, -0.54, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.095, 0.085, 0.48, 14]} />
      </Part>
      {/* Right upper leg */}
      <Part position={[0.1, -0.54, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.095, 0.085, 0.48, 14]} />
      </Part>
      {/* Left lower leg */}
      <Part position={[-0.1, -0.93, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.075, 0.062, 0.46, 12]} />
      </Part>
      {/* Right lower leg */}
      <Part position={[0.1, -0.93, 0]} opacity={opacity}>
        <cylinderGeometry args={[0.075, 0.062, 0.46, 12]} />
      </Part>
    </group>
  )
}
