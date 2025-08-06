'use client'

import { useEffect, useState } from 'react'
import { getAllJobs } from '../../lib/api'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState('')
  const [apiResult, setApiResult] = useState('')

  useEffect(() => {
    // Debug environment variables
    const envInfo = `
Environment Variables:
- NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
- NEXT_PUBLIC_USE_TEST_ENDPOINTS: ${process.env.NEXT_PUBLIC_USE_TEST_ENDPOINTS || 'undefined'}  
- NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'undefined'}
- NEXT_PUBLIC_API_KEY: ${process.env.NEXT_PUBLIC_API_KEY ? '[SET]' : 'undefined'}

Window Location: ${typeof window !== 'undefined' ? window.location.href : 'server-side'}
`
    setDebugInfo(envInfo)

    // Test API call
    const testApi = async () => {
      try {
        console.log('Making API call to getAllJobs...')
        const result = await getAllJobs(1, 5)
        setApiResult(`SUCCESS: Found ${result.data.length} jobs`)
        console.log('API Success:', result)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        setApiResult(`ERROR: ${errorMsg}`)
        console.error('API Error:', error)
      }
    }

    testApi()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
          <pre className="whitespace-pre-wrap text-sm">{debugInfo}</pre>
        </div>
        
        <div className="bg-card p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">API Test Result</h2>
          <pre className="whitespace-pre-wrap text-sm">{apiResult}</pre>
        </div>
      </div>
    </div>
  )
}