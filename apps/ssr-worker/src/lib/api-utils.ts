import type { ApiResponse, ApiError, ApiRequestContext } from '@opennext-shop/shared-types';

export function createSuccessResponse<T>(data: T, meta?: Omit<ApiResponse<T>['meta'], 'timestamp' | 'requestId'>): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

export function createErrorResponse(error: ApiError): ApiResponse<never> {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

export function getRequestContext(request: Request): ApiRequestContext {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date(),
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('cf-connecting-ip') || undefined,
    country: request.headers.get('cf-ipcountry') || undefined,
  };
}

export function parseQueryParams(url: URL): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};
  
  url.searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        params[key] = [existing, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return params;
}

export function validateMethod(request: Request, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
