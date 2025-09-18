import { Suspense } from 'react'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your job posting templates and configurations
          </p>
        </div>
        
        <nav className="flex space-x-8 mb-8 border-b">
          <a
            href="/settings/application"
            className="pb-2 border-b-2 border-blue-600 text-blue-600 font-medium"
          >
            Application Forms
          </a>
          <a
            href="/settings/pipeline"
            className="pb-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
          >
            Pipeline Templates
          </a>
          <a
            href="/settings/branding"
            className="pb-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900"
          >
            Company Branding
          </a>
        </nav>

        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  )
}