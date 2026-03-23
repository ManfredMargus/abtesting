import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const raw = process.env.ADMIN_PASSWORD
  const trimmed = (raw ?? '').trim()
  return NextResponse.json({
    exists: raw !== undefined,
    rawLength: raw?.length ?? 0,
    trimmedLength: trimmed.length,
    firstChar: trimmed[0] ?? null,
    lastChar: trimmed[trimmed.length - 1] ?? null,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const password = body.password ?? ''
  const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()
  return NextResponse.json({
    passwordReceived: password,
    passwordLength: password.length,
    passwordTrimmedLength: password.trim().length,
    adminPasswordLength: adminPassword.length,
    match: password.trim() === adminPassword,
  })
}
