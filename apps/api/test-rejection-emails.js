#!/usr/bin/env node

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'
const INTERNAL_TOKEN = process.env.INTERNAL_API_SECRET || 'your-internal-secret'

async function testRejectionEmailSystem() {
  console.log('🚀 Testing Rejection Email System')
  console.log('==================================')
  
  try {
    console.log('\n1. Testing with dry run first...')
    
    const dryRunResponse = await fetch(`${API_BASE_URL}/api/v1/internal/cron/send-rejection-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Internal ${INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        job_type: 'rejection_emails',
        dry_run: true,
      }),
    })

    if (!dryRunResponse.ok) {
      const errorText = await dryRunResponse.text()
      throw new Error(`Dry run failed: ${dryRunResponse.status} - ${errorText}`)
    }

    const dryRunResult = await dryRunResponse.json()
    console.log('✅ Dry run successful!')
    console.log(`   - Emails to process: ${dryRunResult.data.processed}`)
    console.log(`   - Would send: ${dryRunResult.data.sent}`)
    console.log(`   - Processing time: ${dryRunResult.metadata.processingTimeMs}ms`)

    if (dryRunResult.data.processed === 0) {
      console.log('\n❌ No pending rejection emails found.')
      console.log('   To test this system:')
      console.log('   1. Run the SQL migration in Supabase')
      console.log('   2. Create test data using schedule_rejection_email() function')
      console.log('   3. Run this script again')
      return
    }

    console.log('\n2. Scheduling actual email send in 30 seconds...')
    console.log('   (This gives you time to cancel with Ctrl+C if needed)')
    
    let countdown = 30
    const countdownInterval = setInterval(() => {
      process.stdout.write(`\r   Sending emails in ${countdown}s... `)
      countdown--
      
      if (countdown < 0) {
        clearInterval(countdownInterval)
        process.stdout.write('\r   Sending emails now!        \n')
        sendActualEmails()
      }
    }, 1000)

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.message.includes('ECONNREFUSED')) {
      console.error('   Make sure your API server is running on', API_BASE_URL)
    }
    if (error.message.includes('401') || error.message.includes('MISSING_INTERNAL_TOKEN')) {
      console.error('   Check your INTERNAL_API_SECRET environment variable')
    }
    process.exit(1)
  }
}

async function sendActualEmails() {
  try {
    console.log('\n3. Sending actual rejection emails...')
    
    const response = await fetch(`${API_BASE_URL}/api/v1/internal/cron/send-rejection-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Internal ${INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        job_type: 'rejection_emails',
        dry_run: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Email sending failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Email processing completed!')
    console.log(`   - Emails processed: ${result.data.processed}`)
    console.log(`   - Successfully sent: ${result.data.sent}`)
    console.log(`   - Failed: ${result.data.failed}`)
    console.log(`   - Batches: ${result.data.batch_count}`)
    console.log(`   - Processing time: ${result.metadata.processingTimeMs}ms`)
    
    if (result.data.failed > 0) {
      console.log('\n⚠️  Some emails failed to send. Check your logs for details.')
    }
    
    if (result.data.sent > 0) {
      console.log('\n📧 Check your email service (Resend) dashboard to confirm delivery.')
    }

  } catch (error) {
    console.error('❌ Email sending failed:', error.message)
  }
}

async function createTestData() {
  console.log('\n🔧 Creating test rejection email data...')
  
  const testQuery = `
    -- Create a test scheduled rejection email (due now)
    INSERT INTO scheduled_rejection_emails (
      application_id,
      recipient_email,
      scheduled_for
    ) VALUES (
      gen_random_uuid(),
      'test@example.com',
      NOW() - INTERVAL '1 minute'
    ) RETURNING id;
  `
  
  console.log('Run this SQL in your Supabase SQL editor to create test data:')
  console.log('```sql')
  console.log(testQuery.trim())
  console.log('```')
}

function showUsage() {
  console.log('\n📋 Usage:')
  console.log('  node test-rejection-emails.js           # Test with existing data')
  console.log('  node test-rejection-emails.js --help    # Show this help')
  console.log('  node test-rejection-emails.js --create  # Show SQL to create test data')
  console.log('\n🔧 Environment Variables:')
  console.log('  API_BASE_URL         # API server URL (default: http://localhost:3001)')
  console.log('  INTERNAL_API_SECRET  # Internal API token')
}

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  showUsage()
  process.exit(0)
}

if (args.includes('--create')) {
  createTestData()
  process.exit(0)
}

console.log('Environment:')
console.log(`  API_BASE_URL: ${API_BASE_URL}`)
console.log(`  INTERNAL_TOKEN: ${INTERNAL_TOKEN ? '***' + INTERNAL_TOKEN.slice(-4) : '❌ NOT SET'}`)

if (!INTERNAL_TOKEN || INTERNAL_TOKEN === 'your-internal-secret') {
  console.error('\n❌ INTERNAL_API_SECRET environment variable not set!')
  console.error('   Set it with: export INTERNAL_API_SECRET=your-actual-secret')
  process.exit(1)
}

testRejectionEmailSystem()