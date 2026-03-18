export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  timestamp: string;
  requestId: string;
}

export interface ApiRequestContext {
  requestId: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  country?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RouteHandler<T = unknown> {
  method: HttpMethod;
  path: string;
  handler: (request: Request, context: ApiRequestContext) => Promise<ApiResponse<T>>;
}
