export interface MachineTypeSpec {
  name: string
  series: string
  family: string
  vCpus: number | 'shared'
  memoryGb: number
  sharedCore?: boolean
  cpuType?: string
  localSsd?: boolean
  networkBandwidth?: string  // e.g. "Up to 32 Gbps"
  gpuSupport?: boolean
  soleTenantSupport?: boolean
  nestedVirtualization?: boolean
  coremarkScore?: number
}

// Series-level default specs — applied to all instances of that series unless overridden
export const SERIES_SPECS: Record<string, Partial<MachineTypeSpec>> = {
  F1:  { cpuType: 'Intel (various)', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  G1:  { cpuType: 'Intel (various)', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  E2:  { cpuType: 'Intel/AMD (auto-selected)', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  N1:  { cpuType: 'Intel Skylake or later', localSsd: true, gpuSupport: true, soleTenantSupport: true, nestedVirtualization: true },
  N2:  { cpuType: 'Intel Cascade Lake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  N2D: { cpuType: 'AMD EPYC Rome/Milan', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  N4:  { cpuType: 'Intel Emerald Rapids', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  T2D: { cpuType: 'AMD EPYC Milan', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  T2A: { cpuType: 'ARM Ampere Altra', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  C2:  { cpuType: 'Intel Cascade Lake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  C2D: { cpuType: 'AMD EPYC Milan', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  C3:  { cpuType: 'Intel Sapphire Rapids', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  M1:  { cpuType: 'Intel Skylake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
  M2:  { cpuType: 'Intel Cascade Lake', localSsd: false, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
  M3:  { cpuType: 'Intel Ice Lake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
}

// Predefined GCP machine type specifications
// vCPUs and memory sourced from https://cloud.google.com/compute/docs/machine-resource
export const MACHINE_TYPES: MachineTypeSpec[] = [
  // --- f1-micro / g1-small (shared-core, special pricing via dedicated SKUs) ---
  { name: 'f1-micro',   series: 'F1',  family: 'Shared core', vCpus: 'shared', memoryGb: 0.6,  sharedCore: true },
  { name: 'g1-small',   series: 'G1',  family: 'Shared core', vCpus: 'shared', memoryGb: 1.7,  sharedCore: true },

  // --- E2 General Purpose ---
  // e2-micro/small/medium are burstable shared-core; Linux SUD unavailable, Windows = license only
  { name: 'e2-micro',      series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 1,  sharedCore: true },
  { name: 'e2-small',      series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 2,  sharedCore: true },
  { name: 'e2-medium',     series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 4,  sharedCore: true },
  { name: 'e2-standard-2', series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 8 },
  { name: 'e2-standard-4', series: 'E2', family: 'General purpose', vCpus: 4,  memoryGb: 16 },
  { name: 'e2-standard-8', series: 'E2', family: 'General purpose', vCpus: 8,  memoryGb: 32 },
  { name: 'e2-standard-16',series: 'E2', family: 'General purpose', vCpus: 16, memoryGb: 64 },
  { name: 'e2-standard-32',series: 'E2', family: 'General purpose', vCpus: 32, memoryGb: 128 },
  { name: 'e2-highcpu-2',  series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 2 },
  { name: 'e2-highcpu-4',  series: 'E2', family: 'General purpose', vCpus: 4,  memoryGb: 4 },
  { name: 'e2-highcpu-8',  series: 'E2', family: 'General purpose', vCpus: 8,  memoryGb: 8 },
  { name: 'e2-highcpu-16', series: 'E2', family: 'General purpose', vCpus: 16, memoryGb: 16 },
  { name: 'e2-highcpu-32', series: 'E2', family: 'General purpose', vCpus: 32, memoryGb: 32 },
  { name: 'e2-highmem-2',  series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 16 },
  { name: 'e2-highmem-4',  series: 'E2', family: 'General purpose', vCpus: 4,  memoryGb: 32 },
  { name: 'e2-highmem-8',  series: 'E2', family: 'General purpose', vCpus: 8,  memoryGb: 64 },
  { name: 'e2-highmem-16', series: 'E2', family: 'General purpose', vCpus: 16, memoryGb: 128 },

  // --- N1 General Purpose ---
  { name: 'n1-standard-1',  series: 'N1', family: 'General purpose', vCpus: 1,  memoryGb: 3.75 },
  { name: 'n1-standard-2',  series: 'N1', family: 'General purpose', vCpus: 2,  memoryGb: 7.5 },
  { name: 'n1-standard-4',  series: 'N1', family: 'General purpose', vCpus: 4,  memoryGb: 15 },
  { name: 'n1-standard-8',  series: 'N1', family: 'General purpose', vCpus: 8,  memoryGb: 30 },
  { name: 'n1-standard-16', series: 'N1', family: 'General purpose', vCpus: 16, memoryGb: 60 },
  { name: 'n1-standard-32', series: 'N1', family: 'General purpose', vCpus: 32, memoryGb: 120 },
  { name: 'n1-standard-64', series: 'N1', family: 'General purpose', vCpus: 64, memoryGb: 240 },
  { name: 'n1-standard-96', series: 'N1', family: 'General purpose', vCpus: 96, memoryGb: 360 },
  { name: 'n1-highmem-2',   series: 'N1', family: 'General purpose', vCpus: 2,  memoryGb: 13 },
  { name: 'n1-highmem-4',   series: 'N1', family: 'General purpose', vCpus: 4,  memoryGb: 26 },
  { name: 'n1-highmem-8',   series: 'N1', family: 'General purpose', vCpus: 8,  memoryGb: 52 },
  { name: 'n1-highmem-16',  series: 'N1', family: 'General purpose', vCpus: 16, memoryGb: 104 },
  { name: 'n1-highmem-32',  series: 'N1', family: 'General purpose', vCpus: 32, memoryGb: 208 },
  { name: 'n1-highmem-64',  series: 'N1', family: 'General purpose', vCpus: 64, memoryGb: 416 },
  { name: 'n1-highmem-96',  series: 'N1', family: 'General purpose', vCpus: 96, memoryGb: 624 },
  { name: 'n1-highcpu-2',   series: 'N1', family: 'General purpose', vCpus: 2,  memoryGb: 1.8 },
  { name: 'n1-highcpu-4',   series: 'N1', family: 'General purpose', vCpus: 4,  memoryGb: 3.6 },
  { name: 'n1-highcpu-8',   series: 'N1', family: 'General purpose', vCpus: 8,  memoryGb: 7.2 },
  { name: 'n1-highcpu-16',  series: 'N1', family: 'General purpose', vCpus: 16, memoryGb: 14.4 },
  { name: 'n1-highcpu-32',  series: 'N1', family: 'General purpose', vCpus: 32, memoryGb: 28.8 },
  { name: 'n1-highcpu-64',  series: 'N1', family: 'General purpose', vCpus: 64, memoryGb: 57.6 },
  { name: 'n1-highcpu-96',  series: 'N1', family: 'General purpose', vCpus: 96, memoryGb: 86.4 },

  // --- N2 General Purpose ---
  { name: 'n2-standard-2',  series: 'N2', family: 'General purpose', vCpus: 2,  memoryGb: 8 },
  { name: 'n2-standard-4',  series: 'N2', family: 'General purpose', vCpus: 4,  memoryGb: 16 },
  { name: 'n2-standard-8',  series: 'N2', family: 'General purpose', vCpus: 8,  memoryGb: 32 },
  { name: 'n2-standard-16', series: 'N2', family: 'General purpose', vCpus: 16, memoryGb: 64 },
  { name: 'n2-standard-32', series: 'N2', family: 'General purpose', vCpus: 32, memoryGb: 128 },
  { name: 'n2-standard-48', series: 'N2', family: 'General purpose', vCpus: 48, memoryGb: 192 },
  { name: 'n2-standard-64', series: 'N2', family: 'General purpose', vCpus: 64, memoryGb: 256 },
  { name: 'n2-standard-80', series: 'N2', family: 'General purpose', vCpus: 80, memoryGb: 320 },
  { name: 'n2-standard-96', series: 'N2', family: 'General purpose', vCpus: 96, memoryGb: 384 },
  { name: 'n2-standard-128',series: 'N2', family: 'General purpose', vCpus: 128,memoryGb: 512 },
  { name: 'n2-highmem-2',   series: 'N2', family: 'General purpose', vCpus: 2,  memoryGb: 16 },
  { name: 'n2-highmem-4',   series: 'N2', family: 'General purpose', vCpus: 4,  memoryGb: 32 },
  { name: 'n2-highmem-8',   series: 'N2', family: 'General purpose', vCpus: 8,  memoryGb: 64 },
  { name: 'n2-highmem-16',  series: 'N2', family: 'General purpose', vCpus: 16, memoryGb: 128 },
  { name: 'n2-highmem-32',  series: 'N2', family: 'General purpose', vCpus: 32, memoryGb: 256 },
  { name: 'n2-highmem-48',  series: 'N2', family: 'General purpose', vCpus: 48, memoryGb: 384 },
  { name: 'n2-highmem-64',  series: 'N2', family: 'General purpose', vCpus: 64, memoryGb: 512 },
  { name: 'n2-highmem-80',  series: 'N2', family: 'General purpose', vCpus: 80, memoryGb: 640 },
  { name: 'n2-highmem-96',  series: 'N2', family: 'General purpose', vCpus: 96, memoryGb: 768 },
  { name: 'n2-highmem-128', series: 'N2', family: 'General purpose', vCpus: 128,memoryGb: 864 },
  { name: 'n2-highcpu-2',   series: 'N2', family: 'General purpose', vCpus: 2,  memoryGb: 2 },
  { name: 'n2-highcpu-4',   series: 'N2', family: 'General purpose', vCpus: 4,  memoryGb: 4 },
  { name: 'n2-highcpu-8',   series: 'N2', family: 'General purpose', vCpus: 8,  memoryGb: 8 },
  { name: 'n2-highcpu-16',  series: 'N2', family: 'General purpose', vCpus: 16, memoryGb: 16 },
  { name: 'n2-highcpu-32',  series: 'N2', family: 'General purpose', vCpus: 32, memoryGb: 32 },
  { name: 'n2-highcpu-48',  series: 'N2', family: 'General purpose', vCpus: 48, memoryGb: 48 },
  { name: 'n2-highcpu-64',  series: 'N2', family: 'General purpose', vCpus: 64, memoryGb: 64 },
  { name: 'n2-highcpu-80',  series: 'N2', family: 'General purpose', vCpus: 80, memoryGb: 80 },
  { name: 'n2-highcpu-96',  series: 'N2', family: 'General purpose', vCpus: 96, memoryGb: 96 },

  // --- N2D (AMD) ---
  { name: 'n2d-standard-2',  series: 'N2D', family: 'General purpose', vCpus: 2,   memoryGb: 8 },
  { name: 'n2d-standard-4',  series: 'N2D', family: 'General purpose', vCpus: 4,   memoryGb: 16 },
  { name: 'n2d-standard-8',  series: 'N2D', family: 'General purpose', vCpus: 8,   memoryGb: 32 },
  { name: 'n2d-standard-16', series: 'N2D', family: 'General purpose', vCpus: 16,  memoryGb: 64 },
  { name: 'n2d-standard-32', series: 'N2D', family: 'General purpose', vCpus: 32,  memoryGb: 128 },
  { name: 'n2d-standard-48', series: 'N2D', family: 'General purpose', vCpus: 48,  memoryGb: 192 },
  { name: 'n2d-standard-64', series: 'N2D', family: 'General purpose', vCpus: 64,  memoryGb: 256 },
  { name: 'n2d-standard-80', series: 'N2D', family: 'General purpose', vCpus: 80,  memoryGb: 320 },
  { name: 'n2d-standard-96', series: 'N2D', family: 'General purpose', vCpus: 96,  memoryGb: 384 },
  { name: 'n2d-standard-128',series: 'N2D', family: 'General purpose', vCpus: 128, memoryGb: 512 },
  { name: 'n2d-standard-224',series: 'N2D', family: 'General purpose', vCpus: 224, memoryGb: 896 },
  { name: 'n2d-highmem-2',   series: 'N2D', family: 'General purpose', vCpus: 2,   memoryGb: 16 },
  { name: 'n2d-highmem-4',   series: 'N2D', family: 'General purpose', vCpus: 4,   memoryGb: 32 },
  { name: 'n2d-highmem-8',   series: 'N2D', family: 'General purpose', vCpus: 8,   memoryGb: 64 },
  { name: 'n2d-highmem-16',  series: 'N2D', family: 'General purpose', vCpus: 16,  memoryGb: 128 },
  { name: 'n2d-highmem-32',  series: 'N2D', family: 'General purpose', vCpus: 32,  memoryGb: 256 },
  { name: 'n2d-highmem-48',  series: 'N2D', family: 'General purpose', vCpus: 48,  memoryGb: 384 },
  { name: 'n2d-highmem-64',  series: 'N2D', family: 'General purpose', vCpus: 64,  memoryGb: 512 },
  { name: 'n2d-highmem-96',  series: 'N2D', family: 'General purpose', vCpus: 96,  memoryGb: 768 },
  { name: 'n2d-highcpu-2',   series: 'N2D', family: 'General purpose', vCpus: 2,   memoryGb: 2 },
  { name: 'n2d-highcpu-4',   series: 'N2D', family: 'General purpose', vCpus: 4,   memoryGb: 4 },
  { name: 'n2d-highcpu-8',   series: 'N2D', family: 'General purpose', vCpus: 8,   memoryGb: 8 },
  { name: 'n2d-highcpu-16',  series: 'N2D', family: 'General purpose', vCpus: 16,  memoryGb: 16 },
  { name: 'n2d-highcpu-32',  series: 'N2D', family: 'General purpose', vCpus: 32,  memoryGb: 32 },
  { name: 'n2d-highcpu-48',  series: 'N2D', family: 'General purpose', vCpus: 48,  memoryGb: 48 },
  { name: 'n2d-highcpu-64',  series: 'N2D', family: 'General purpose', vCpus: 64,  memoryGb: 64 },
  { name: 'n2d-highcpu-80',  series: 'N2D', family: 'General purpose', vCpus: 80,  memoryGb: 80 },
  { name: 'n2d-highcpu-96',  series: 'N2D', family: 'General purpose', vCpus: 96,  memoryGb: 96 },
  { name: 'n2d-highcpu-128', series: 'N2D', family: 'General purpose', vCpus: 128, memoryGb: 128 },
  { name: 'n2d-highcpu-224', series: 'N2D', family: 'General purpose', vCpus: 224, memoryGb: 224 },

  // --- T2D (AMD EPYC) ---
  { name: 't2d-standard-1',  series: 'T2D', family: 'General purpose', vCpus: 1,  memoryGb: 4 },
  { name: 't2d-standard-2',  series: 'T2D', family: 'General purpose', vCpus: 2,  memoryGb: 8 },
  { name: 't2d-standard-4',  series: 'T2D', family: 'General purpose', vCpus: 4,  memoryGb: 16 },
  { name: 't2d-standard-8',  series: 'T2D', family: 'General purpose', vCpus: 8,  memoryGb: 32 },
  { name: 't2d-standard-16', series: 'T2D', family: 'General purpose', vCpus: 16, memoryGb: 64 },
  { name: 't2d-standard-32', series: 'T2D', family: 'General purpose', vCpus: 32, memoryGb: 128 },
  { name: 't2d-standard-48', series: 'T2D', family: 'General purpose', vCpus: 48, memoryGb: 192 },
  { name: 't2d-standard-60', series: 'T2D', family: 'General purpose', vCpus: 60, memoryGb: 240 },

  // --- T2A (ARM Ampere Altra) ---
  { name: 't2a-standard-1',  series: 'T2A', family: 'General purpose', vCpus: 1,  memoryGb: 4 },
  { name: 't2a-standard-2',  series: 'T2A', family: 'General purpose', vCpus: 2,  memoryGb: 8 },
  { name: 't2a-standard-4',  series: 'T2A', family: 'General purpose', vCpus: 4,  memoryGb: 16 },
  { name: 't2a-standard-8',  series: 'T2A', family: 'General purpose', vCpus: 8,  memoryGb: 32 },
  { name: 't2a-standard-16', series: 'T2A', family: 'General purpose', vCpus: 16, memoryGb: 64 },
  { name: 't2a-standard-32', series: 'T2A', family: 'General purpose', vCpus: 32, memoryGb: 128 },
  { name: 't2a-standard-48', series: 'T2A', family: 'General purpose', vCpus: 48, memoryGb: 192 },

  // --- C2 Compute Optimized ---
  { name: 'c2-standard-4',  series: 'C2', family: 'Compute optimized', vCpus: 4,  memoryGb: 16 },
  { name: 'c2-standard-8',  series: 'C2', family: 'Compute optimized', vCpus: 8,  memoryGb: 32 },
  { name: 'c2-standard-16', series: 'C2', family: 'Compute optimized', vCpus: 16, memoryGb: 64 },
  { name: 'c2-standard-30', series: 'C2', family: 'Compute optimized', vCpus: 30, memoryGb: 120 },
  { name: 'c2-standard-60', series: 'C2', family: 'Compute optimized', vCpus: 60, memoryGb: 240 },

  // --- C2D (AMD EPYC) ---
  { name: 'c2d-standard-2',  series: 'C2D', family: 'Compute optimized', vCpus: 2,   memoryGb: 8 },
  { name: 'c2d-standard-4',  series: 'C2D', family: 'Compute optimized', vCpus: 4,   memoryGb: 16 },
  { name: 'c2d-standard-8',  series: 'C2D', family: 'Compute optimized', vCpus: 8,   memoryGb: 32 },
  { name: 'c2d-standard-16', series: 'C2D', family: 'Compute optimized', vCpus: 16,  memoryGb: 64 },
  { name: 'c2d-standard-32', series: 'C2D', family: 'Compute optimized', vCpus: 32,  memoryGb: 128 },
  { name: 'c2d-standard-56', series: 'C2D', family: 'Compute optimized', vCpus: 56,  memoryGb: 224 },
  { name: 'c2d-standard-112',series: 'C2D', family: 'Compute optimized', vCpus: 112, memoryGb: 448 },
  { name: 'c2d-highcpu-2',   series: 'C2D', family: 'Compute optimized', vCpus: 2,   memoryGb: 2 },
  { name: 'c2d-highcpu-4',   series: 'C2D', family: 'Compute optimized', vCpus: 4,   memoryGb: 4 },
  { name: 'c2d-highcpu-8',   series: 'C2D', family: 'Compute optimized', vCpus: 8,   memoryGb: 8 },
  { name: 'c2d-highcpu-16',  series: 'C2D', family: 'Compute optimized', vCpus: 16,  memoryGb: 16 },
  { name: 'c2d-highcpu-32',  series: 'C2D', family: 'Compute optimized', vCpus: 32,  memoryGb: 32 },
  { name: 'c2d-highcpu-56',  series: 'C2D', family: 'Compute optimized', vCpus: 56,  memoryGb: 56 },
  { name: 'c2d-highcpu-112', series: 'C2D', family: 'Compute optimized', vCpus: 112, memoryGb: 112 },
  { name: 'c2d-highmem-2',   series: 'C2D', family: 'Compute optimized', vCpus: 2,   memoryGb: 16 },
  { name: 'c2d-highmem-4',   series: 'C2D', family: 'Compute optimized', vCpus: 4,   memoryGb: 32 },
  { name: 'c2d-highmem-8',   series: 'C2D', family: 'Compute optimized', vCpus: 8,   memoryGb: 64 },
  { name: 'c2d-highmem-16',  series: 'C2D', family: 'Compute optimized', vCpus: 16,  memoryGb: 128 },
  { name: 'c2d-highmem-32',  series: 'C2D', family: 'Compute optimized', vCpus: 32,  memoryGb: 256 },
  { name: 'c2d-highmem-56',  series: 'C2D', family: 'Compute optimized', vCpus: 56,  memoryGb: 448 },
  { name: 'c2d-highmem-112', series: 'C2D', family: 'Compute optimized', vCpus: 112, memoryGb: 896 },

  // --- C3 (Intel Sapphire Rapids) ---
  { name: 'c3-standard-4',    series: 'C3', family: 'Compute optimized', vCpus: 4,   memoryGb: 16 },
  { name: 'c3-standard-8',    series: 'C3', family: 'Compute optimized', vCpus: 8,   memoryGb: 32 },
  { name: 'c3-standard-22',   series: 'C3', family: 'Compute optimized', vCpus: 22,  memoryGb: 88 },
  { name: 'c3-standard-44',   series: 'C3', family: 'Compute optimized', vCpus: 44,  memoryGb: 176 },
  { name: 'c3-standard-88',   series: 'C3', family: 'Compute optimized', vCpus: 88,  memoryGb: 352 },
  { name: 'c3-standard-176',  series: 'C3', family: 'Compute optimized', vCpus: 176, memoryGb: 704 },
  { name: 'c3-highcpu-4',     series: 'C3', family: 'Compute optimized', vCpus: 4,   memoryGb: 8 },
  { name: 'c3-highcpu-8',     series: 'C3', family: 'Compute optimized', vCpus: 8,   memoryGb: 16 },
  { name: 'c3-highcpu-22',    series: 'C3', family: 'Compute optimized', vCpus: 22,  memoryGb: 44 },
  { name: 'c3-highcpu-44',    series: 'C3', family: 'Compute optimized', vCpus: 44,  memoryGb: 88 },
  { name: 'c3-highcpu-88',    series: 'C3', family: 'Compute optimized', vCpus: 88,  memoryGb: 176 },
  { name: 'c3-highcpu-176',   series: 'C3', family: 'Compute optimized', vCpus: 176, memoryGb: 352 },
  { name: 'c3-highmem-4',     series: 'C3', family: 'Compute optimized', vCpus: 4,   memoryGb: 32 },
  { name: 'c3-highmem-8',     series: 'C3', family: 'Compute optimized', vCpus: 8,   memoryGb: 64 },
  { name: 'c3-highmem-22',    series: 'C3', family: 'Compute optimized', vCpus: 22,  memoryGb: 176 },
  { name: 'c3-highmem-44',    series: 'C3', family: 'Compute optimized', vCpus: 44,  memoryGb: 352 },
  { name: 'c3-highmem-88',    series: 'C3', family: 'Compute optimized', vCpus: 88,  memoryGb: 704 },
  { name: 'c3-highmem-176',   series: 'C3', family: 'Compute optimized', vCpus: 176, memoryGb: 1408 },

  // --- M1 Memory Optimized ---
  { name: 'm1-ultramem-40',  series: 'M1', family: 'Memory optimized', vCpus: 40,  memoryGb: 961 },
  { name: 'm1-ultramem-80',  series: 'M1', family: 'Memory optimized', vCpus: 80,  memoryGb: 1922 },
  { name: 'm1-ultramem-160', series: 'M1', family: 'Memory optimized', vCpus: 160, memoryGb: 3844 },
  { name: 'm1-megamem-96',   series: 'M1', family: 'Memory optimized', vCpus: 96,  memoryGb: 1433.6 },

  // --- M2 Memory Optimized ---
  { name: 'm2-ultramem-208',  series: 'M2', family: 'Memory optimized', vCpus: 208, memoryGb: 5888 },
  { name: 'm2-ultramem-416',  series: 'M2', family: 'Memory optimized', vCpus: 416, memoryGb: 11776 },
  { name: 'm2-megamem-416',   series: 'M2', family: 'Memory optimized', vCpus: 416, memoryGb: 5888 },
  { name: 'm2-hypermem-416',  series: 'M2', family: 'Memory optimized', vCpus: 416, memoryGb: 8832 },

  // --- M3 Memory Optimized ---
  { name: 'm3-ultramem-32',  series: 'M3', family: 'Memory optimized', vCpus: 32,  memoryGb: 976 },
  { name: 'm3-ultramem-64',  series: 'M3', family: 'Memory optimized', vCpus: 64,  memoryGb: 1952 },
  { name: 'm3-ultramem-128', series: 'M3', family: 'Memory optimized', vCpus: 128, memoryGb: 3904 },
  { name: 'm3-megamem-64',   series: 'M3', family: 'Memory optimized', vCpus: 64,  memoryGb: 976 },
  { name: 'm3-megamem-128',  series: 'M3', family: 'Memory optimized', vCpus: 128, memoryGb: 1952 },

  // --- N4 (Intel Emerald Rapids) ---
  { name: 'n4-standard-2',  series: 'N4', family: 'General purpose', vCpus: 2,  memoryGb: 8 },
  { name: 'n4-standard-4',  series: 'N4', family: 'General purpose', vCpus: 4,  memoryGb: 16 },
  { name: 'n4-standard-8',  series: 'N4', family: 'General purpose', vCpus: 8,  memoryGb: 32 },
  { name: 'n4-standard-16', series: 'N4', family: 'General purpose', vCpus: 16, memoryGb: 64 },
  { name: 'n4-standard-32', series: 'N4', family: 'General purpose', vCpus: 32, memoryGb: 128 },
  { name: 'n4-standard-48', series: 'N4', family: 'General purpose', vCpus: 48, memoryGb: 192 },
  { name: 'n4-standard-64', series: 'N4', family: 'General purpose', vCpus: 64, memoryGb: 256 },
  { name: 'n4-standard-80', series: 'N4', family: 'General purpose', vCpus: 80, memoryGb: 320 },
  { name: 'n4-highcpu-2',   series: 'N4', family: 'General purpose', vCpus: 2,  memoryGb: 2 },
  { name: 'n4-highcpu-4',   series: 'N4', family: 'General purpose', vCpus: 4,  memoryGb: 4 },
  { name: 'n4-highcpu-8',   series: 'N4', family: 'General purpose', vCpus: 8,  memoryGb: 8 },
  { name: 'n4-highcpu-16',  series: 'N4', family: 'General purpose', vCpus: 16, memoryGb: 16 },
  { name: 'n4-highcpu-32',  series: 'N4', family: 'General purpose', vCpus: 32, memoryGb: 32 },
  { name: 'n4-highcpu-48',  series: 'N4', family: 'General purpose', vCpus: 48, memoryGb: 48 },
  { name: 'n4-highcpu-64',  series: 'N4', family: 'General purpose', vCpus: 64, memoryGb: 64 },
  { name: 'n4-highcpu-80',  series: 'N4', family: 'General purpose', vCpus: 80, memoryGb: 80 },
  { name: 'n4-highmem-2',   series: 'N4', family: 'General purpose', vCpus: 2,  memoryGb: 16 },
  { name: 'n4-highmem-4',   series: 'N4', family: 'General purpose', vCpus: 4,  memoryGb: 32 },
  { name: 'n4-highmem-8',   series: 'N4', family: 'General purpose', vCpus: 8,  memoryGb: 64 },
  { name: 'n4-highmem-16',  series: 'N4', family: 'General purpose', vCpus: 16, memoryGb: 128 },
  { name: 'n4-highmem-32',  series: 'N4', family: 'General purpose', vCpus: 32, memoryGb: 256 },
  { name: 'n4-highmem-48',  series: 'N4', family: 'General purpose', vCpus: 48, memoryGb: 384 },
  { name: 'n4-highmem-64',  series: 'N4', family: 'General purpose', vCpus: 64, memoryGb: 512 },
  { name: 'n4-highmem-80',  series: 'N4', family: 'General purpose', vCpus: 80, memoryGb: 640 },
]

// Index by name for fast lookup
export const MACHINE_TYPE_MAP = new Map(MACHINE_TYPES.map((m) => [m.name, m]))
