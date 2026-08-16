import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { ORGAN_CONFIGS } from '../organConfig'
import type { OrganId } from '../types'

const DEFAULT_POS = new THREE.Vector3(0, 0.18, 3.2)
const DEFAULT_TARGET = new THREE.Vector3(0, 0.18, 0)

interface CameraControllerProps {
  selectedOrgan: OrganId | null
}

export function CameraController({ selectedOrgan }: CameraControllerProps) {
  const { camera } = useThree()
  const orbitRef = useRef<any>(null)
  const targetPos = useRef(DEFAULT_POS.clone())
  const targetLook = useRef(DEFAULT_TARGET.clone())
  const isAnimating = useRef(false)

  useEffect(() => {
    if (selectedOrgan) {
      const cfg = ORGAN_CONFIGS[selectedOrgan]
      targetPos.current.set(...cfg.cameraPosition)
      targetLook.current.set(...cfg.cameraTarget)
    } else {
      targetPos.current.copy(DEFAULT_POS)
      targetLook.current.copy(DEFAULT_TARGET)
    }
    isAnimating.current = true
  }, [selectedOrgan])

  useFrame(() => {
    if (!isAnimating.current) return
    const dist = camera.position.distanceTo(targetPos.current)
    if (dist > 0.005) {
      camera.position.lerp(targetPos.current, 0.055)
      if (orbitRef.current) {
        orbitRef.current.target.lerp(targetLook.current, 0.055)
        orbitRef.current.update()
      }
    } else {
      camera.position.copy(targetPos.current)
      if (orbitRef.current) {
        orbitRef.current.target.copy(targetLook.current)
        orbitRef.current.update()
      }
      isAnimating.current = false
    }
  })

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.4}
      maxDistance={6.5}
      enablePan={false}
      makeDefault
    />
  )
}
