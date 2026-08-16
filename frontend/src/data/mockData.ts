export const DEMO_PATIENT = {
  id: 'demo-001',
  name: 'Alex Johnson',
  firstName: 'Alex',
  age: 34,
  bloodGroup: 'O+',
  email: 'alex.johnson@demo.healthtwin',
  avatar: 'AJ',
  emergencyContact: {
    name: 'Sarah Johnson',
    relation: 'Spouse',
    phone: '+91 98765 43210',
  },
}

export const STAT_CARDS = [
  { id: 'twin', label: 'Digital Twin', value: 'Active', icon: '🧬', color: 'indigo' },
  { id: 'meds', label: 'Medications', value: '5 Active', icon: '💊', color: 'cyan' },
  { id: 'alerts', label: 'Safety Alerts', value: '2', icon: '⚠️', color: 'amber' },
  { id: 'reports', label: 'Recent Reports', value: '4', icon: '🧪', color: 'navy' },
]

export const MEDICATIONS = [
  {
    id: 'm1',
    name: 'Metformin',
    dosage: '500 mg',
    frequency: 'Twice daily',
    startDate: '2025-03-15',
    doctor: 'Dr. Arun Mehta',
    status: 'active' as const,
  },
  {
    id: 'm2',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily',
    startDate: '2024-11-02',
    doctor: 'Dr. Priya Sharma',
    status: 'active' as const,
  },
  {
    id: 'm3',
    name: 'Atorvastatin',
    dosage: '20 mg',
    frequency: 'Once daily at bedtime',
    startDate: '2025-01-20',
    doctor: 'Dr. Arun Mehta',
    status: 'active' as const,
  },
  {
    id: 'm4',
    name: 'Aspirin',
    dosage: '81 mg',
    frequency: 'Once daily',
    startDate: '2023-06-10',
    doctor: 'Dr. Priya Sharma',
    status: 'active' as const,
  },
  {
    id: 'm5',
    name: 'Omeprazole',
    dosage: '20 mg',
    frequency: 'Once daily before breakfast',
    startDate: '2025-07-01',
    doctor: 'Dr. Arun Mehta',
    status: 'active' as const,
  },
]

export const MEDICATION_HISTORY = [
  { id: 'mh1', name: 'Ibuprofen', change: 'Stopped', date: '2025-02-14', reason: 'Switched to alternative' },
  { id: 'mh2', name: 'Metformin', change: 'Changed', date: '2025-03-15', reason: 'Dosage increased to 500mg' },
  { id: 'mh3', name: 'Amoxicillin', change: 'Stopped', date: '2024-09-22', reason: 'Course completed' },
]

export const ALLERGIES = [
  { id: 'a1', allergen: 'Penicillin', reaction: 'Skin rash, hives', severity: 'high' as const },
  { id: 'a2', allergen: 'Sulfa drugs', reaction: 'Nausea, dizziness', severity: 'medium' as const },
]

export const CONDITIONS = [
  { id: 'c1', name: 'Type 2 Diabetes', status: 'active' as const, firstRecorded: '2023-04-12', lastUpdated: '2026-08-05' },
  { id: 'c2', name: 'Hypertension', status: 'active' as const, firstRecorded: '2022-08-30', lastUpdated: '2026-07-20' },
  { id: 'c3', name: 'Hyperlipidemia', status: 'monitoring' as const, firstRecorded: '2024-01-15', lastUpdated: '2026-06-12' },
]

export const TIMELINE_EVENTS = [
  {
    id: 't1',
    date: '2026-08-12',
    type: 'prescription',
    title: 'Prescription Added',
    description: 'Metformin dosage review — continued at 500mg twice daily.',
    source: 'City Hospital',
    status: 'verified',
    icon: '💊',
    year: 2026,
  },
  {
    id: 't2',
    date: '2026-08-05',
    type: 'lab',
    title: 'Lab Report',
    description: 'HbA1c result: 7.4% — flagged for trend review.',
    source: 'Apollo Diagnostics',
    status: 'needs_review',
    icon: '🧪',
    year: 2026,
  },
  {
    id: 't3',
    date: '2026-07-20',
    type: 'consultation',
    title: 'Doctor Consultation',
    description: 'Routine follow-up for hypertension management.',
    source: 'Dr. Arun Mehta',
    status: 'verified',
    icon: '🩺',
    year: 2026,
  },
  {
    id: 't4',
    date: '2025-03-15',
    type: 'medication',
    title: 'Medication Started',
    description: 'Metformin 500mg prescribed for diabetes management.',
    source: 'Dr. Arun Mehta',
    status: 'verified',
    icon: '💊',
    year: 2025,
  },
  {
    id: 't5',
    date: '2024-01-15',
    type: 'diagnosis',
    title: 'Diagnosis Recorded',
    description: 'Hyperlipidemia identified during annual health screening.',
    source: 'City Hospital',
    status: 'verified',
    icon: '📋',
    year: 2024,
  },
  {
    id: 't6',
    date: '2023-04-12',
    type: 'diagnosis',
    title: 'Diagnosis Recorded',
    description: 'Type 2 Diabetes Mellitus confirmed via fasting glucose test.',
    source: 'Apollo Diagnostics',
    status: 'verified',
    icon: '📋',
    year: 2023,
  },
]

export const AI_INSIGHTS = [
  {
    id: 'ai1',
    priority: 'high' as const,
    title: 'Potential Medication Conflict',
    detected: 'New prescription may interact with existing Metformin regimen and allergy history.',
    why: 'The proposed Amoxicillin-Clavulanate contains penicillin derivatives. Patient has documented Penicillin allergy (high severity). Additionally, concurrent NSAID use may affect renal function given current Metformin therapy.',
    records: ['Prescription — 12 Aug 2026', 'Allergy History', 'Medication History 2025–2026'],
    date: '2026-08-12',
    evidence: {
      items: [
        { label: 'Existing medication', detail: 'Metformin 500mg — Active since Mar 2025' },
        { label: 'New prescription', detail: 'Amoxicillin-Clavulanate 625mg — Proposed 12 Aug 2026' },
        { label: 'Allergy history', detail: 'Penicillin — Skin rash, hives (High severity)' },
        { label: 'Recent laboratory result', detail: 'HbA1c 7.4% — 05 Aug 2026' },
      ],
      sources: [
        { name: 'Prescription', date: '12 Aug 2026' },
        { name: 'Lab Report', date: '05 Aug 2026' },
        { name: 'Medication History', date: '2025–2026' },
      ],
    },
  },
  {
    id: 'ai2',
    priority: 'review' as const,
    title: 'Abnormal Lab Trend',
    detected: 'HbA1c has increased from 6.1% to 7.4% over 24 months.',
    why: 'Three consecutive readings show an upward trend. Current value exceeds the typical monitoring threshold for managed Type 2 Diabetes.',
    records: ['Lab Report — 05 Aug 2026', 'Lab Report — Jan 2025', 'Lab Report — Mar 2024'],
    date: '2026-08-05',
    evidence: {
      items: [
        { label: '2024 reading', detail: 'HbA1c 6.1% — Within target range' },
        { label: '2025 reading', detail: 'HbA1c 6.7% — Slight increase noted' },
        { label: '2026 reading', detail: 'HbA1c 7.4% — Above previous baseline' },
        { label: 'Trend analysis', detail: 'Consistent upward trajectory over 24 months' },
      ],
      sources: [
        { name: 'Lab Report', date: '05 Aug 2026' },
        { name: 'Lab Report', date: '15 Jan 2025' },
        { name: 'Lab Report', date: '12 Mar 2024' },
      ],
    },
  },
  {
    id: 'ai3',
    priority: 'info' as const,
    title: 'Medication History Updated',
    detected: 'Omeprazole added to active medication list.',
    why: 'New prescription detected in uploaded hospital record and reconciled with existing profile.',
    records: ['Prescription — 01 Jul 2026', 'Health Record Upload'],
    date: '2026-07-02',
    evidence: {
      items: [
        { label: 'New medication', detail: 'Omeprazole 20mg — Once daily' },
        { label: 'Prescriber', detail: 'Dr. Arun Mehta' },
        { label: 'Source document', detail: 'City Hospital Discharge Summary' },
      ],
      sources: [{ name: 'Prescription', date: '01 Jul 2026' }],
    },
  },
]

export const LAB_TRENDS = [
  {
    id: 'hba1c',
    name: 'HbA1c',
    unit: '%',
    current: 7.4,
    date: '2026-08-05',
    trend: 'increasing' as const,
    data: [
      { date: 'Mar 2024', value: 6.1 },
      { date: 'Jan 2025', value: 6.7 },
      { date: 'Aug 2026', value: 7.4 },
    ],
  },
  {
    id: 'bp',
    name: 'Blood Pressure',
    unit: 'mmHg',
    current: '128/82',
    date: '2026-07-20',
    trend: 'stable' as const,
    data: [
      { date: 'Jan 2025', value: 130 },
      { date: 'Apr 2025', value: 126 },
      { date: 'Jul 2026', value: 128 },
    ],
  },
  {
    id: 'hb',
    name: 'Hemoglobin',
    unit: 'g/dL',
    current: 13.8,
    date: '2026-08-05',
    trend: 'stable' as const,
    data: [
      { date: 'Mar 2024', value: 14.2 },
      { date: 'Jan 2025', value: 13.9 },
      { date: 'Aug 2026', value: 13.8 },
    ],
  },
  {
    id: 'chol',
    name: 'Cholesterol',
    unit: 'mg/dL',
    current: 198,
    date: '2026-06-12',
    trend: 'decreasing' as const,
    data: [
      { date: 'Jan 2024', value: 245 },
      { date: 'Aug 2025', value: 210 },
      { date: 'Jun 2026', value: 198 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight',
    unit: 'kg',
    current: 78.5,
    date: '2026-07-20',
    trend: 'stable' as const,
    data: [
      { date: 'Jan 2025', value: 80.2 },
      { date: 'Apr 2025', value: 79.1 },
      { date: 'Jul 2026', value: 78.5 },
    ],
  },
]

export const HEALTH_RECORDS = [
  { id: 'r1', name: 'Prescription — Metformin Review', type: 'Prescriptions', date: '2026-08-12', source: 'City Hospital', status: 'processed' as const },
  { id: 'r2', name: 'HbA1c Lab Report', type: 'Lab Reports', date: '2026-08-05', source: 'Apollo Diagnostics', status: 'processed' as const },
  { id: 'r3', name: 'Chest X-Ray Report', type: 'Imaging', date: '2026-06-18', source: 'City Hospital', status: 'processed' as const },
  { id: 'r4', name: 'Discharge Summary', type: 'Discharge Summaries', date: '2026-07-01', source: 'City Hospital', status: 'processed' as const },
  { id: 'r5', name: 'Annual Health Checkup', type: 'Hospital Records', date: '2026-06-12', source: 'Apollo Diagnostics', status: 'processed' as const },
  { id: 'r6', name: 'ECG Report', type: 'Imaging', date: '2026-05-22', source: 'City Hospital', status: 'processing' as const },
  { id: 'r7', name: 'Prescription — Lisinopril', type: 'Prescriptions', date: '2024-11-02', source: 'Dr. Priya Sharma', status: 'processed' as const },
  { id: 'r8', name: 'Lipid Panel', type: 'Lab Reports', date: '2026-06-12', source: 'Apollo Diagnostics', status: 'processed' as const },
]

export const CONSENT_ENTRIES = [
  { id: 'cs1', who: 'Dr. Arun Mehta', data: 'Medical Records', permission: 'Clinical Access', expiry: '2027-08-12', status: 'active' as const },
  { id: 'cs2', who: 'City Hospital', data: 'Lab Reports', permission: 'Read & Upload', expiry: '2026-12-31', status: 'active' as const },
  { id: 'cs3', who: 'Sarah Johnson', data: 'Medical History', permission: 'Emergency Only', expiry: '—', status: 'restricted' as const },
  { id: 'cs4', who: 'HealthTwin AI', data: 'All Authorized Records', permission: 'Analysis', expiry: '—', status: 'active' as const },
  { id: 'cs5', who: 'Apollo Diagnostics', data: 'Lab Reports', permission: 'Upload Only', expiry: '2026-09-30', status: 'active' as const },
]

export const AUDIT_LOG = [
  { id: 'al1', timestamp: '2026-08-12T14:32:00', actor: 'Dr. Arun Mehta', action: 'Viewed Medication History', dataAccessed: 'Medications, Allergies' },
  { id: 'al2', timestamp: '2026-08-11T09:15:00', actor: 'City Hospital', action: 'Viewed Lab Reports', dataAccessed: 'Lab Reports (3 documents)' },
  { id: 'al3', timestamp: '2026-08-10T16:48:00', actor: 'HealthTwin AI', action: 'Processed Prescription', dataAccessed: 'Prescription, Allergy History' },
  { id: 'al4', timestamp: '2026-08-09T11:22:00', actor: 'Alex Johnson', action: 'Updated Consent Settings', dataAccessed: 'Consent & Sharing' },
  { id: 'al5', timestamp: '2026-08-08T08:05:00', actor: 'Apollo Diagnostics', action: 'Uploaded Lab Report', dataAccessed: 'Lab Reports' },
  { id: 'al6', timestamp: '2026-08-07T19:30:00', actor: 'Alex Johnson', action: 'Viewed Emergency Profile', dataAccessed: 'Emergency Profile' },
]

export const RECENT_ACTIVITY = [
  { id: 'ra1', title: 'Lab report processed', description: 'HbA1c results added to health profile', time: '2 days ago', icon: '🧪' },
  { id: 'ra2', title: 'Prescription updated', description: 'Metformin review completed by Dr. Arun', time: '3 days ago', icon: '💊' },
  { id: 'ra3', title: 'AI insight generated', description: 'Medication conflict flagged for review', time: '3 days ago', icon: '🧠' },
  { id: 'ra4', title: 'Record uploaded', description: 'Discharge summary from City Hospital', time: '1 week ago', icon: '📄' },
]

export const HEALTH_SIGNALS = [
  { id: 'hs1', label: 'Blood Glucose Control', status: 'needs_review' as const },
  { id: 'hs2', label: 'Blood Pressure', status: 'stable' as const },
  { id: 'hs3', label: 'Lipid Profile', status: 'trending' as const },
  { id: 'hs4', label: 'Medication Adherence', status: 'stable' as const },
]

export const RECENT_CHANGES = [
  { id: 'rc1', change: 'HbA1c increased to 7.4%', date: '2026-08-05', type: 'lab' },
  { id: 'rc2', change: 'Omeprazole added to medications', date: '2026-07-01', type: 'medication' },
  { id: 'rc3', change: 'Cholesterol decreased to 198 mg/dL', date: '2026-06-12', type: 'lab' },
]

export const EMERGENCY_INFO = {
  criticalAllergies: ['Penicillin (High — Skin rash, anaphylaxis risk)', 'Sulfa drugs (Medium — Nausea)'],
  criticalMedications: ['Metformin 500mg — Twice daily', 'Lisinopril 10mg — Once daily', 'Aspirin 81mg — Once daily'],
  majorConditions: ['Type 2 Diabetes', 'Hypertension', 'Hyperlipidemia'],
  bloodGroup: 'O+',
}

export const RECORD_CATEGORIES = [
  'All',
  'Prescriptions',
  'Lab Reports',
  'Hospital Records',
  'Imaging',
  'Discharge Summaries',
  'Other',
]

export const UPLOAD_EXTRACTED = {
  medication: 'Amoxicillin-Clavulanate',
  dosage: '625 mg',
  date: '12 Aug 2026',
  doctor: 'Dr. Arun Mehta',
}
