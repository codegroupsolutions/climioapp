import { NextResponse } from 'next/server'

export async function GET() {
  const start = Date.now()

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - start,
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  })
}
