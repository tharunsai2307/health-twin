import { PageHeader, Card } from '../components/ui/primitives'
import { DEMO_PATIENT } from '../data/mockData'

const settingsCategories = [
  {
    title: 'Profile',
    description: 'Personal information and health profile settings',
    items: ['Display name', 'Date of birth', 'Blood group', 'Emergency contact'],
  },
  {
    title: 'Privacy',
    description: 'Control how your data is stored and shared',
    items: ['Data retention', 'Anonymous analytics', 'Export my data'],
  },
  {
    title: 'Security',
    description: 'Account security and authentication',
    items: ['Change password', 'Two-factor authentication', 'Active sessions'],
  },
  {
    title: 'Consent',
    description: 'Default consent preferences for new providers',
    items: ['Auto-approve lab uploads', 'AI analysis consent', 'Emergency access rules'],
  },
  {
    title: 'Notifications',
    description: 'Alerts and communication preferences',
    items: ['Safety alerts', 'Lab results ready', 'Consent requests', 'AI insights'],
  },
  {
    title: 'AI Preferences',
    description: 'Configure AI analysis behavior',
    items: ['Insight sensitivity', 'Medication conflict checks', 'Lab trend monitoring'],
  },
]

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCategories.map((cat) => (
          <Card key={cat.title} hover className="cursor-pointer">
            <h3 className="font-semibold text-navy-900">{cat.title}</h3>
            <p className="mt-1 text-sm text-navy-500">{cat.description}</p>
            <ul className="mt-4 space-y-1.5">
              {cat.items.map((item) => (
                <li key={item} className="text-xs text-navy-400">• {item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your personal health profile information." />

      <Card className="max-w-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
            {DEMO_PATIENT.avatar}
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900">{DEMO_PATIENT.name}</h2>
            <p className="text-sm text-navy-500">{DEMO_PATIENT.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-navy-400">Age</p><p className="font-medium">{DEMO_PATIENT.age} years</p></div>
          <div><p className="text-navy-400">Blood Group</p><p className="font-medium">{DEMO_PATIENT.bloodGroup}</p></div>
          <div><p className="text-navy-400">Emergency Contact</p><p className="font-medium">{DEMO_PATIENT.emergencyContact.name}</p></div>
          <div><p className="text-navy-400">Phone</p><p className="font-medium">{DEMO_PATIENT.emergencyContact.phone}</p></div>
        </div>
      </Card>
    </div>
  )
}
