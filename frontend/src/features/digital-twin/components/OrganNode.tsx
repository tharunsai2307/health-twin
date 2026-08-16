import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ORGAN_CONFIGS } from '../organConfig'
import type { OrganId } from '../types'

interface SingleOrganMeshProps {
  organId: OrganId
  position: [number, number, number]
  selected: boolean
  dimmed: boolean
  hovered: boolean
  onHover: (v: boolean) => void
  onClick: () => void
  showLabel: boolean
  isMirrored?: boolean
}

function SingleOrganMesh({
  organId, position, selected, dimmed, hovered, onHover, onClick, showLabel, isMirrored = false
}: SingleOrganMeshProps) {
  const config = ORGAN_CONFIGS[organId]
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  // Load the real anatomical GLB model
  const { scene } = useGLTF(config.modelPath)

  // Clone scene so multiple instances (like dual kidneys) don't conflict
  const clonedScene = useMemo(() => {
    const clone = scene.clone()
    return clone
  }, [scene])

  const baseScale = selected ? 1.35 : hovered ? 1.12 : 1.0
  const color = useMemo(() => new THREE.Color(config.color), [config.color])
  const emissive = useMemo(() => new THREE.Color(config.emissive), [config.emissive])

  // Custom transparent holographic material override
  const customMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: selected ? 0.8 : hovered ? 0.48 : (dimmed ? 0.05 : 0.22),
      transparent: true,
      opacity: dimmed ? 0.04 : (selected ? 0.95 : 0.72),
      roughness: 0.25,
      metalness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: !dimmed,
    })
  }, [color, emissive, selected, hovered, dimmed])

  // Apply custom material to all meshes in the loaded GLB
  useMemo(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = customMaterial
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [clonedScene, customMaterial])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // Breathing or pulse scale logic
    let mult = 1.0
    let intensity = selected ? 0.8 : hovered ? 0.48 : (dimmed ? 0.05 : 0.22)

    if (selected) {
      switch (config.animationType) {
        case 'heartbeat': {
          const beatPhase = (t * 72 / 60) % 1.0
          if (beatPhase < 0.10) mult = 1 + (beatPhase / 0.10) * 0.22
          else if (beatPhase < 0.22) mult = 1.22 - ((beatPhase - 0.10) / 0.12) * 0.22
          intensity = 0.8 + (mult - 1) * 3
          break
        }
        case 'breathing': {
          const inhale = Math.sin(t * Math.PI * 15 / 30)
          mult = 1 + inhale * 0.06
          intensity = 0.5 + Math.abs(inhale) * 0.4
          break
        }
        case 'neural': {
          const pulse = 0.5 + 0.5 * Math.sin(t * 3.2)
          mult = 1 + pulse * 0.05
          intensity = 0.4 + pulse * 0.6
          break
        }
        case 'filtration': {
          const osc = 0.5 + 0.5 * Math.sin(t * 2.2)
          mult = 1 + osc * 0.04
          intensity = 0.5 + osc * 0.35
          break
        }
        case 'vascular': {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.5)
          mult = 1 + pulse * 0.04
          intensity = 0.5 + pulse * 0.35
          break
        }
      }
    } else {
      const idleBreath = 1 + Math.sin(t * 0.7 + organId.charCodeAt(0) * 0.4) * 0.015
      mult = idleBreath
    }

    // Apply scale to model group
    const baseScaleVec = Array.isArray(config.modelScale)
      ? config.modelScale
      : [config.modelScale, config.modelScale, config.modelScale]

    if (isMirrored) {
      groupRef.current.scale.set(
        -baseScaleVec[0] * baseScale * mult,
        baseScaleVec[1] * baseScale * mult,
        baseScaleVec[2] * baseScale * mult
      )
    } else {
      groupRef.current.scale.set(
        baseScaleVec[0] * baseScale * mult,
        baseScaleVec[1] * baseScale * mult,
        baseScaleVec[2] * baseScale * mult
      )
    }

    // Dynamically update emissive intensity
    customMaterial.emissiveIntensity = intensity

    if (ringRef.current && selected) {
      ringRef.current.rotation.z += 0.009
    }
  })

  // Group scale/rotation configuration
  const s = Array.isArray(config.modelScale)
    ? config.modelScale
    : [config.modelScale, config.modelScale, config.modelScale]

  const finalScale: [number, number, number] = isMirrored
    ? [-s[0] * baseScale, s[1] * baseScale, s[2] * baseScale]
    : [s[0] * baseScale, s[1] * baseScale, s[2] * baseScale]

  return (
    <group position={position}>
      {/* Interactive invisible clicking box */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => { onHover(false); document.body.style.cursor = 'auto' }}
        position={[0, 0, 0]}
        visible={false}
      >
        <sphereGeometry args={[0.13, 10, 10]} />
      </mesh>

      {/* Model offset and rotation container */}
      <group
        ref={groupRef}
        rotation={config.modelRotation}
        scale={finalScale}
      >
        <primitive
          object={clonedScene}
          position={config.modelOffset}
        />
      </group>

      {selected && (
        <>
          <mesh ref={ringRef}>
            <torusGeometry args={[0.145, 0.007, 8, 48]} />
            <meshBasicMaterial color={config.color} transparent opacity={0.7} />
          </mesh>
          <pointLight color={config.color} intensity={0.85} distance={0.75} />
        </>
      )}

      {showLabel && (
        <Html
          position={[0.145, 0.1, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className={[
            'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm transition-all',
            selected
              ? 'bg-white/22 text-white shadow-lg'
              : 'bg-black/45 text-white/65'
          ].join(' ')}>
            {config.emoji} {config.label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

interface OrganNodeProps {
  organId: OrganId
  selected: boolean
  dimmed: boolean
  onClick: () => void
}

export function OrganNode({ organId, selected, dimmed, onClick }: OrganNodeProps) {
  const config = ORGAN_CONFIGS[organId]
  const [hovered, setHovered] = useState(false)

  if (config.isPaired && config.leftPosition && config.rightPosition) {
    return (
      <>
        <SingleOrganMesh
          organId={organId}
          position={config.leftPosition}
          selected={selected}
          dimmed={dimmed}
          hovered={hovered}
          onHover={setHovered}
          onClick={onClick}
          showLabel={false}
        />
        <SingleOrganMesh
          organId={organId}
          position={config.rightPosition}
          selected={selected}
          dimmed={dimmed}
          hovered={hovered}
          onHover={setHovered}
          onClick={onClick}
          showLabel={!dimmed}
          isMirrored={true}
        />
      </>
    )
  }

  return (
    <SingleOrganMesh
      organId={organId}
      position={config.position}
      selected={selected}
      dimmed={dimmed}
      hovered={hovered}
      onHover={setHovered}
      onClick={onClick}
      showLabel={!dimmed}
    />
  )
}
