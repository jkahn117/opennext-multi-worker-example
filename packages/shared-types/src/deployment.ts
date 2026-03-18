export interface WorkerVersion {
  id: string;
  workerName: string;
  versionId: string;
  createdAt: Date;
  deployedAt?: Date;
  status: 'pending' | 'deploying' | 'active' | 'rollback' | 'failed';
  trafficPercent: number;
}

export interface DeploymentSet {
  id: string;
  createdAt: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  workers: {
    middleware: WorkerVersion;
    api: WorkerVersion;
    ssr: WorkerVersion;
    ssg: WorkerVersion;
  };
  metadata?: {
    commitSha?: string;
    commitMessage?: string;
    deployedBy?: string;
  };
}

export interface DeploymentStatus {
  currentSet: DeploymentSet;
  previousSet?: DeploymentSet;
  isRollingBack: boolean;
}

export interface DeploymentStartRequest {
  commitSha?: string;
  commitMessage?: string;
  metadata?: Record<string, string>;
}

export interface DeploymentCompleteRequest {
  deploymentId: string;
  success: boolean;
  error?: string;
}

export interface RollbackRequest {
  toDeploymentId?: string;
  reason?: string;
}

export const WORKER_NAMES = {
  MIDDLEWARE: 'opennext-middleware',
  API: 'opennext-api',
  SSR: 'opennext-ssr',
  SSG: 'opennext-ssg',
  DEPLOYMENT: 'opennext-deployment'
} as const;

export type WorkerName = typeof WORKER_NAMES[keyof typeof WORKER_NAMES];

export interface VersionAffinityConfig {
  apiVersionId: string;
  ssrVersionId: string;
  ssgVersionId: string;
  middlewareVersionId: string;
}
