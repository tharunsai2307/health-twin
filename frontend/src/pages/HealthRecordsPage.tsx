import { useState, useEffect } from 'react'
import { Upload, Search, Filter } from 'lucide-react'
import { PageHeader, Button, Card } from '../components/ui/primitives'
import { DocumentCard } from '../components/ui/ContentCards'
import { Modal } from '../components/ui/Overlays'
import { RECORD_CATEGORIES } from '../data/mockData'
import { api } from '../lib/api'

const UPLOAD_STEPS = [
  'Uploading',
  'Reading document',
  'Extracting information',
  'Checking health context',
  'Ready for review',
]

export function HealthRecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [category, setCategory] = useState('All')
  const [previewDoc, setPreviewDoc] = useState<any | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStep, setUploadStep] = useState(-1)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)

  // Document confirmation states
  const [currentUploadId, setCurrentUploadId] = useState('')
  const [confirmTitle, setConfirmTitle] = useState('')
  const [confirmType, setConfirmType] = useState('PRESCRIPTION')
  const [confirmSource, setConfirmSource] = useState('')
  const [confirmDate, setConfirmDate] = useState('')
  
  // Extracted entities arrays for editing
  const [meds, setMeds] = useState<any[]>([])
  const [allergies, setAllergies] = useState<any[]>([])
  const [diagnoses, setDiagnoses] = useState<any[]>([])
  const [labs, setLabs] = useState<any[]>([])

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const data = await api.getRecords()
      setRecords(data)
    } catch (err) {
      console.error('Error fetching records:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const filtered = category === 'All'
    ? records
    : records.filter((r) => r.record_type === category || (category === 'Prescriptions' && r.record_type === 'PRESCRIPTION') || (category === 'Lab Reports' && r.record_type === 'LAB_REPORT') || (category === 'Hospital Records' && r.record_type === 'DISCHARGE_SUMMARY') || (category === 'Imaging' && r.record_type === 'IMAGING') || (category === 'Discharge Summaries' && r.record_type === 'DISCHARGE_SUMMARY'))

  const handleOpenUpload = () => {
    setShowUpload(true)
    setUploadStep(-1)
    setCurrentUploadId('')
  }

  const handleStartUpload = async (file: File) => {
    setUploadStep(0)
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step < UPLOAD_STEPS.length - 1) {
        setUploadStep(step)
      } else {
        clearInterval(interval)
      }
    }, 800)

    try {
      const res = await api.uploadRecord(file)
      clearInterval(interval)
      
      // Populate confirmation states with backend extracted values
      setCurrentUploadId(res.record_id)
      setConfirmTitle(res.title || file.name)
      setConfirmType(res.record_type || 'PRESCRIPTION')
      setConfirmSource(res.source || 'General practice')
      setConfirmDate(res.record_date || new Date().toISOString().split('T')[0])
      
      const ext = res.extracted_data || {}
      setMeds(ext.medications || [])
      setAllergies(ext.allergies || [])
      setDiagnoses(ext.diagnoses || [])
      setLabs(ext.lab_results || [])
      
      // Complete stepper
      setUploadStep(UPLOAD_STEPS.length - 1)
    } catch (err) {
      clearInterval(interval)
      alert('Failed to process document: ' + (err as Error).message)
      setUploadStep(-1)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleStartUpload(e.target.files[0])
    }
  }

  const handleConfirm = async () => {
    try {
      await api.confirmRecord(currentUploadId, {
        title: confirmTitle,
        record_type: confirmType,
        source: confirmSource,
        record_date: confirmDate,
        medications: meds,
        allergies: allergies,
        diagnoses: diagnoses,
        lab_results: labs
      })
      setShowUpload(false)
      setUploadStep(-1)
      fetchRecords()
    } catch (err) {
      alert('Error confirming record: ' + (err as Error).message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Health Records"
        subtitle="Your secure document vault for all medical records."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filter</Button>
            <Button size="sm" onClick={handleOpenUpload}><Upload className="h-4 w-4" /> Upload Record</Button>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-navy-100 bg-white px-4 py-2.5">
        <Search className="h-4 w-4 text-navy-400" />
        <input
          type="text"
          placeholder="Search records..."
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {RECORD_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-navy-900 text-white'
                : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && records.length === 0 ? (
        <div className="text-center py-12 text-navy-500">Loading your vault records...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-navy-500 border border-dashed border-navy-100 rounded-xl bg-white">No documents found matching this filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <DocumentCard 
              key={doc.id} 
              id={doc.id}
              name={doc.title}
              type={doc.record_type === 'PRESCRIPTION' ? 'Prescriptions' : doc.record_type === 'LAB_REPORT' ? 'Lab Reports' : doc.record_type === 'DISCHARGE_SUMMARY' ? 'Discharge Summaries' : 'Other'}
              date={doc.record_date}
              source={doc.source}
              status={doc.processing_status.toLowerCase()}
              onClick={() => setPreviewDoc(doc)} 
            />
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <Modal open={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title} size="lg">
        {previewDoc && (
          <div className="space-y-4">
            <div className="flex h-64 items-center justify-center rounded-xl bg-navy-50">
              {previewDoc.file_path ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <span className="text-4xl">📄</span>
                  <a 
                    href={`http://localhost:8000${previewDoc.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 text-indigo-600 hover:underline text-sm font-medium"
                  >
                    Open Document File
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl">📄</span>
                  <p className="mt-2 text-sm text-navy-500">No document file available.</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-navy-400">Type</p><p className="font-medium">{previewDoc.record_type}</p></div>
              <div><p className="text-navy-400">Source</p><p className="font-medium">{previewDoc.source}</p></div>
              <div><p className="text-navy-400">Date</p><p className="font-medium">{new Date(previewDoc.record_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <div><p className="text-navy-400">Status</p><p className="font-medium capitalize">{previewDoc.processing_status}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setUploadStep(-1) }} title="Upload Medical Record" size="lg">
        {uploadStep < 0 ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { 
              e.preventDefault(); 
              setDragOver(false); 
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleStartUpload(e.dataTransfer.files[0])
              }
            }}
            className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
              dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-navy-200 bg-navy-50/50'
            }`}
          >
            <Upload className="h-10 w-10 text-navy-400" />
            <h3 className="mt-4 text-lg font-semibold text-navy-900">Drop your medical record here</h3>
            <p className="mt-2 text-sm text-navy-500">Supported: PDF, JPG, PNG</p>
            <input 
              type="file" 
              id="file-upload-input" 
              className="hidden" 
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <Button className="mt-6" onClick={() => document.getElementById('file-upload-input')?.click()}>
              Browse Files
            </Button>
          </div>
        ) : uploadStep < UPLOAD_STEPS.length - 1 ? (
          <div className="space-y-6 py-8">
            {UPLOAD_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i <= uploadStep ? 'bg-indigo-600 text-white' : 'bg-navy-100 text-navy-400'
                }`}>
                  {i < uploadStep ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= uploadStep ? 'font-medium text-navy-900' : 'text-navy-400'}`}>{step}</span>
                {i === uploadStep && (
                  <div className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-navy-100">
                    <div className="h-full w-full animate-pulse bg-indigo-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <span className="text-2xl text-emerald-600 font-bold">✓</span>
              <p className="mt-2 font-semibold text-emerald-800">Ready for review</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-navy-900 border-b pb-2">Extracted Document Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-navy-400 font-medium">Document Title</label>
                  <input 
                    type="text" 
                    value={confirmTitle}
                    onChange={(e) => setConfirmTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-navy-400 font-medium">Record Type</label>
                  <select 
                    value={confirmType}
                    onChange={(e) => setConfirmType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  >
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="LAB_REPORT">Lab Report</option>
                    <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                    <option value="IMAGING">Imaging</option>
                    <option value="CONSULTATION">Consultation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-navy-400 font-medium">Source / Clinic</label>
                  <input 
                    type="text" 
                    value={confirmSource}
                    onChange={(e) => setConfirmSource(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-navy-400 font-medium">Date</label>
                  <input 
                    type="date" 
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Editable Medications Section */}
              {meds.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-navy-900 mb-2">💊 Extracted Medications</h4>
                  {meds.map((med, index) => (
                    <Card key={index} className="mb-2 p-3 bg-navy-50/50">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-navy-400">Name</label>
                          <input 
                            type="text" 
                            value={med.name}
                            onChange={(e) => {
                              const newMeds = [...meds];
                              newMeds[index].name = e.target.value;
                              setMeds(newMeds);
                            }}
                            className="mt-1 w-full rounded border border-navy-200 px-2 py-1 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-navy-400">Dosage</label>
                          <input 
                            type="text" 
                            value={med.dosage}
                            onChange={(e) => {
                              const newMeds = [...meds];
                              newMeds[index].dosage = e.target.value;
                              setMeds(newMeds);
                            }}
                            className="mt-1 w-full rounded border border-navy-200 px-2 py-1 bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-navy-400">Frequency</label>
                          <input 
                            type="text" 
                            value={med.frequency}
                            onChange={(e) => {
                              const newMeds = [...meds];
                              newMeds[index].frequency = e.target.value;
                              setMeds(newMeds);
                            }}
                            className="mt-1 w-full rounded border border-navy-200 px-2 py-1 bg-white"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Editable Lab Results Section */}
              {labs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-navy-900 mb-2">🧪 Extracted Lab Results</h4>
                  {labs.map((lab, index) => (
                    <Card key={index} className="mb-2 p-3 bg-navy-50/50">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="col-span-2">
                          <label className="text-navy-400">Test Name</label>
                          <input 
                            type="text" 
                            value={lab.test_name}
                            onChange={(e) => {
                              const newLabs = [...labs];
                              newLabs[index].test_name = e.target.value;
                              setLabs(newLabs);
                            }}
                            className="mt-1 w-full rounded border border-navy-200 px-2 py-1 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-navy-400">Value</label>
                          <input 
                            type="text" 
                            value={lab.value}
                            onChange={(e) => {
                              const newLabs = [...labs];
                              newLabs[index].value = e.target.value;
                              setLabs(newLabs);
                            }}
                            className="mt-1 w-full rounded border border-navy-200 px-2 py-1 bg-white"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <Button className="w-full mt-6" onClick={handleConfirm}>
              Confirm & Reconcile to Health Twin
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
