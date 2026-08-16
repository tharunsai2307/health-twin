import type { OrganId, OrganConfig } from './types'

export interface AnatomicalOrganConfig extends OrganConfig {
  modelPath: string
  modelScale: [number, number, number] | number
  modelRotation: [number, number, number]
  modelOffset: [number, number, number]
}

export const ORGAN_CONFIGS: Record<OrganId, AnatomicalOrganConfig> = {
  heart: {
    id: 'heart',
    label: 'Heart',
    emoji: '❤️',
    color: '#ef4444',
    emissive: '#b91c1c',
    position: [0.019, 0.236, 0.038],
    cameraPosition: [0.4, 0.48, 2.0],
    cameraTarget: [0.02, 0.236, 0.04],
    animationType: 'heartbeat',
    description: 'Cardiac health and cardiovascular metrics',
    modelPath: '/models/heart.glb',
    modelScale: 1.0,
    modelRotation: [0, 0, 0],
    modelOffset: [-0.019, -0.476, -0.038], // Center it at group origin
  },
  brain: {
    id: 'brain',
    label: 'Brain',
    emoji: '🧠',
    color: '#d946ef',
    emissive: '#a21caf',
    position: [0.0, 0.82, 0.0],
    cameraPosition: [0.15, 1.12, 1.55],
    cameraTarget: [0, 0.82, 0],
    animationType: 'neural',
    description: 'Neurological health and cognitive status',
    modelPath: '/models/brain.glb',
    modelScale: 0.0012, // Convert mm to meters
    modelRotation: [-Math.PI / 2, 0, 0], // Orient STL vertical Z to Y
    modelOffset: [0.011, 0.0, -76.714], // Centering offset in mm before scale
  },
  lungs: {
    id: 'lungs',
    label: 'Lungs',
    emoji: '🫁',
    color: '#818cf8',
    emissive: '#4338ca',
    position: [-0.005, 0.239, -0.080],
    cameraPosition: [0, 0.52, 2.0],
    cameraTarget: [0, 0.24, 0],
    animationType: 'breathing',
    description: 'Respiratory health and pulmonary function',
    modelPath: '/models/lungs.glb',
    modelScale: 1.0,
    modelRotation: [0, 0, 0],
    modelOffset: [0.005, -0.479, 0.080],
  },
  kidneys: {
    id: 'kidneys',
    label: 'Kidneys',
    emoji: '🫘',
    color: '#fb923c',
    emissive: '#c2410c',
    position: [0.0, 0.063, -0.027], // Midpoint Kidney position
    cameraPosition: [0, 0.12, 2.1],
    cameraTarget: [0, 0.063, 0],
    animationType: 'filtration',
    description: 'Renal function and kidney health markers',
    isPaired: true,
    leftPosition: [0.072, 0.063, -0.027],
    rightPosition: [-0.072, 0.063, -0.027],
    modelPath: '/models/kidney.glb',
    modelScale: 1.0,
    modelRotation: [0, 0, 0],
    modelOffset: [-0.072, -0.303, 0.027],
  },
  liver: {
    id: 'liver',
    label: 'Liver',
    emoji: '🫕',
    color: '#a78bfa',
    emissive: '#7c3aed',
    position: [-0.038, 0.127, 0.011],
    cameraPosition: [0.5, 0.26, 1.85],
    cameraTarget: [-0.04, 0.13, 0],
    animationType: 'vascular',
    description: 'Hepatic function and liver enzyme status',
    modelPath: '/models/liver.glb',
    modelScale: 1.0,
    modelRotation: [0, 0, 0],
    modelOffset: [0.038, -0.367, -0.011],
  },
}

export const ORGAN_IDS: OrganId[] = ['heart', 'brain', 'lungs', 'kidneys', 'liver']
