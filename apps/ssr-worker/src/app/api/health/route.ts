import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(_request: NextRequest) {
  return Response.json({
    status: 'healthy',
    service: 'opennext-api',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
}
