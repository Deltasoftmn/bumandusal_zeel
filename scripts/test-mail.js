/**
 * Test script: sends a sample loan application email to check mail style.
 * Recipient: bilguunz045@gmail.com (via X-Test-Recipient header).
 *
 * Usage:
 *   node scripts/test-mail.js
 *   API_URL=https://your-app.vercel.app node scripts/test-mail.js
 *
 * For local API (vercel dev):
 *   API_URL=http://localhost:3000 node scripts/test-mail.js
 */

const API_URL = process.env.API_URL || 'https://bumandusal-zeel.vercel.app'
const TEST_RECIPIENT = 'bilguunz045@gmail.com'

const samplePayload = {
  surname: 'Туршилт',
  name: 'Тест',
  phone: '99112233',
  loanType: 'business',
  loanTypeLabel: 'Бизнесийн зээл',
  branch: 'central',
  branchLabel: 'Төв салбар',
  comment: 'Энэ бол имэйл загварыг шалгах туршилтын мэдээлэл.',
}

async function run() {
  const url = `${API_URL.replace(/\/$/, '')}/api/send-zeel`
  console.log('Sending test email...')
  console.log('  API:', url)
  console.log('  To:', TEST_RECIPIENT)
  console.log('')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Recipient': TEST_RECIPIENT,
    },
    body: JSON.stringify(samplePayload),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('Failed:', res.status, data.error || data)
    process.exit(1)
  }

  console.log('Success. Check inbox:', TEST_RECIPIENT)
  if (data.id) console.log('  Resend id:', data.id)
}

run()
