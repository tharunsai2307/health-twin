export type OrganId = 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver'
export type AnimationType = 'heartbeat' | 'breathing' | 'neural' | 'filtration' | 'vascular'

export interface OrganConfig {
  id: OrganId
  label: string
  emoji: string
  color: string
  emissive: string
  position: [number, number, number]
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  animationType: AnimationType
  description: string
  isPaired?: boolean
  leftPosition?: [number, number, number]
  rightPosition?: [number, number, number]
}

export interface OrganMetric {
  id: string
  test_name: string
  value: string
  unit: string | null
  reference_range: string | null
  test_date: string
  source_record_id: string | null
  source_title: string | null
}

export interface OrganRecord {
  id: string
  title: string
  record_type: string
  source: string | null
  record_date: string
  processing_status: string
}

export interface OrganEvent {
  id: string
  event_type: string
  title: string
  description: string | null
  event_date: string
  source: string | null
}

export interface OrganData {
  organ: OrganId
  metrics: OrganMetric[]
  records: OrganRecord[]
  events: OrganEvent[]
  last_updated: string
}

export type GenderModel = 'male' | 'female' | 'default'
