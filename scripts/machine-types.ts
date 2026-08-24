// Canonical GPU type identifiers — used as keys in gpuRates lookup
// Values must match the patterns in GPU_TYPE_PATTERNS in fetch-pricing.ts
export type GpuType = 'A100_40GB' | 'A100_80GB' | 'H100_80GB' | 'H100_MEGA_80GB' | 'L4' | 'B200'

export interface MachineTypeSpec {
  name: string
  series: string
  family: string
  vCpus: number | 'shared'
  memoryGb: number
  sharedCore?: boolean
  /**
   * Fractional vCPU count used for billing calculations. Only relevant for
   * shared-core machine types (e2-micro/small/medium) where the displayed
   * vCpus reflects the max burstable count but billing is based on a smaller
   * fractional CPU allocation.
   */
  billedVcpus?: number
  cpuType?: string
  localSsd?: boolean
  networkBandwidth?: string  // e.g. "Up to 32 Gbps"
  gpuSupport?: boolean
  gpuCount?: number        // number of GPUs attached to this machine type
  gpuType?: GpuType        // canonical GPU type, must be set when gpuCount > 0
  soleTenantSupport?: boolean
  nestedVirtualization?: boolean
  /**
   * Linux CoreMark score. Normally resolved from COREMARK_SCORES below; set
   * here only to override the published table for a specific machine type.
   */
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
  C3D: { cpuType: 'AMD EPYC Genoa', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  C4:  { cpuType: 'Intel Emerald Rapids', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: true },
  H3:  { cpuType: 'Intel Sapphire Rapids (HBM2e)', localSsd: true, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  A2:  { cpuType: 'Intel Cascade Lake', localSsd: false, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
  A3:     { cpuType: 'Intel Sapphire Rapids', localSsd: false, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
  A3Mega: { cpuType: 'Intel Sapphire Rapids', localSsd: false, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
  G2:  { cpuType: 'Intel Cascade Lake', localSsd: true, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
  M1:  { cpuType: 'Intel Skylake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
  M2:  { cpuType: 'Intel Cascade Lake', localSsd: false, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
  M3:  { cpuType: 'Intel Ice Lake', localSsd: true, gpuSupport: false, soleTenantSupport: true, nestedVirtualization: false },
}

// Predefined GCP machine type specifications
// vCPUs and memory sourced from https://cloud.google.com/compute/docs/machine-resource
export const MACHINE_TYPES: MachineTypeSpec[] = [
  // --- E2 General Purpose ---
  // e2-micro/small/medium are burstable shared-core; Linux SUD unavailable, Windows = license only
  { name: 'e2-micro',      series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 1,  sharedCore: true, billedVcpus: 0.25 },
  { name: 'e2-small',      series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 2,  sharedCore: true, billedVcpus: 0.5 },
  { name: 'e2-medium',     series: 'E2', family: 'General purpose', vCpus: 2,  memoryGb: 4,  sharedCore: true, billedVcpus: 1 },
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
  { name: 'n2d-highmem-80',  series: 'N2D', family: 'General purpose', vCpus: 80,  memoryGb: 640 },
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

  // --- C3D (AMD EPYC Genoa) ---
  // Standard: 4 GB/vCPU | Highcpu: 2 GB/vCPU | Highmem: 8 GB/vCPU
  // Sizes: 4, 8, 16, 30, 60, 90, 180, 360 vCPUs
  { name: 'c3d-standard-4',   series: 'C3D', family: 'Compute optimized', vCpus: 4,   memoryGb: 16 },
  { name: 'c3d-standard-8',   series: 'C3D', family: 'Compute optimized', vCpus: 8,   memoryGb: 32 },
  { name: 'c3d-standard-16',  series: 'C3D', family: 'Compute optimized', vCpus: 16,  memoryGb: 64 },
  { name: 'c3d-standard-30',  series: 'C3D', family: 'Compute optimized', vCpus: 30,  memoryGb: 120 },
  { name: 'c3d-standard-60',  series: 'C3D', family: 'Compute optimized', vCpus: 60,  memoryGb: 240 },
  { name: 'c3d-standard-90',  series: 'C3D', family: 'Compute optimized', vCpus: 90,  memoryGb: 360 },
  { name: 'c3d-standard-180', series: 'C3D', family: 'Compute optimized', vCpus: 180, memoryGb: 720 },
  { name: 'c3d-standard-360', series: 'C3D', family: 'Compute optimized', vCpus: 360, memoryGb: 1440 },
  { name: 'c3d-highcpu-4',    series: 'C3D', family: 'Compute optimized', vCpus: 4,   memoryGb: 8 },
  { name: 'c3d-highcpu-8',    series: 'C3D', family: 'Compute optimized', vCpus: 8,   memoryGb: 16 },
  { name: 'c3d-highcpu-16',   series: 'C3D', family: 'Compute optimized', vCpus: 16,  memoryGb: 32 },
  { name: 'c3d-highcpu-30',   series: 'C3D', family: 'Compute optimized', vCpus: 30,  memoryGb: 60 },
  { name: 'c3d-highcpu-60',   series: 'C3D', family: 'Compute optimized', vCpus: 60,  memoryGb: 120 },
  { name: 'c3d-highcpu-90',   series: 'C3D', family: 'Compute optimized', vCpus: 90,  memoryGb: 180 },
  { name: 'c3d-highcpu-180',  series: 'C3D', family: 'Compute optimized', vCpus: 180, memoryGb: 360 },
  { name: 'c3d-highcpu-360',  series: 'C3D', family: 'Compute optimized', vCpus: 360, memoryGb: 720 },
  { name: 'c3d-highmem-4',    series: 'C3D', family: 'Compute optimized', vCpus: 4,   memoryGb: 32 },
  { name: 'c3d-highmem-8',    series: 'C3D', family: 'Compute optimized', vCpus: 8,   memoryGb: 64 },
  { name: 'c3d-highmem-16',   series: 'C3D', family: 'Compute optimized', vCpus: 16,  memoryGb: 128 },
  { name: 'c3d-highmem-30',   series: 'C3D', family: 'Compute optimized', vCpus: 30,  memoryGb: 240 },
  { name: 'c3d-highmem-60',   series: 'C3D', family: 'Compute optimized', vCpus: 60,  memoryGb: 480 },
  { name: 'c3d-highmem-90',   series: 'C3D', family: 'Compute optimized', vCpus: 90,  memoryGb: 720 },
  { name: 'c3d-highmem-180',  series: 'C3D', family: 'Compute optimized', vCpus: 180, memoryGb: 1440 },
  { name: 'c3d-highmem-360',  series: 'C3D', family: 'Compute optimized', vCpus: 360, memoryGb: 2880 },

  // --- C4 (Intel Emerald Rapids) ---
  // Standard: 4 GB/vCPU | Highcpu: 2 GB/vCPU | Highmem: 8 GB/vCPU
  // Sizes: 2, 4, 8, 16, 32, 48, 96, 192 vCPUs
  { name: 'c4-standard-2',   series: 'C4', family: 'Compute optimized', vCpus: 2,   memoryGb: 8 },
  { name: 'c4-standard-4',   series: 'C4', family: 'Compute optimized', vCpus: 4,   memoryGb: 16 },
  { name: 'c4-standard-8',   series: 'C4', family: 'Compute optimized', vCpus: 8,   memoryGb: 32 },
  { name: 'c4-standard-16',  series: 'C4', family: 'Compute optimized', vCpus: 16,  memoryGb: 64 },
  { name: 'c4-standard-32',  series: 'C4', family: 'Compute optimized', vCpus: 32,  memoryGb: 128 },
  { name: 'c4-standard-48',  series: 'C4', family: 'Compute optimized', vCpus: 48,  memoryGb: 192 },
  { name: 'c4-standard-96',  series: 'C4', family: 'Compute optimized', vCpus: 96,  memoryGb: 384 },
  { name: 'c4-standard-192', series: 'C4', family: 'Compute optimized', vCpus: 192, memoryGb: 768 },
  { name: 'c4-highcpu-2',    series: 'C4', family: 'Compute optimized', vCpus: 2,   memoryGb: 4 },
  { name: 'c4-highcpu-4',    series: 'C4', family: 'Compute optimized', vCpus: 4,   memoryGb: 8 },
  { name: 'c4-highcpu-8',    series: 'C4', family: 'Compute optimized', vCpus: 8,   memoryGb: 16 },
  { name: 'c4-highcpu-16',   series: 'C4', family: 'Compute optimized', vCpus: 16,  memoryGb: 32 },
  { name: 'c4-highcpu-32',   series: 'C4', family: 'Compute optimized', vCpus: 32,  memoryGb: 64 },
  { name: 'c4-highcpu-48',   series: 'C4', family: 'Compute optimized', vCpus: 48,  memoryGb: 96 },
  { name: 'c4-highcpu-96',   series: 'C4', family: 'Compute optimized', vCpus: 96,  memoryGb: 192 },
  { name: 'c4-highcpu-192',  series: 'C4', family: 'Compute optimized', vCpus: 192, memoryGb: 384 },
  { name: 'c4-highmem-2',    series: 'C4', family: 'Compute optimized', vCpus: 2,   memoryGb: 16 },
  { name: 'c4-highmem-4',    series: 'C4', family: 'Compute optimized', vCpus: 4,   memoryGb: 32 },
  { name: 'c4-highmem-8',    series: 'C4', family: 'Compute optimized', vCpus: 8,   memoryGb: 64 },
  { name: 'c4-highmem-16',   series: 'C4', family: 'Compute optimized', vCpus: 16,  memoryGb: 128 },
  { name: 'c4-highmem-32',   series: 'C4', family: 'Compute optimized', vCpus: 32,  memoryGb: 256 },
  { name: 'c4-highmem-48',   series: 'C4', family: 'Compute optimized', vCpus: 48,  memoryGb: 384 },
  { name: 'c4-highmem-96',   series: 'C4', family: 'Compute optimized', vCpus: 96,  memoryGb: 768 },
  { name: 'c4-highmem-192',  series: 'C4', family: 'Compute optimized', vCpus: 192, memoryGb: 1536 },

  // --- H3 (Intel Sapphire Rapids + HBM2e, HPC optimized) ---
  { name: 'h3-standard-88', series: 'H3', family: 'High performance computing', vCpus: 88, memoryGb: 352 },

  // --- A2 (Intel Cascade Lake + NVIDIA A100) ---
  // Highgpu: A100 40GB GPUs | Ultragpu: A100 80GB GPUs | Megagpu: 16× A100 40GB
  // Pricing = vCPU rate + RAM rate + GPU rate × gpuCount
  { name: 'a2-highgpu-1g',   series: 'A2', family: 'Accelerator optimized', vCpus: 12, memoryGb: 85,   gpuCount: 1,  gpuType: 'A100_40GB' },
  { name: 'a2-highgpu-2g',   series: 'A2', family: 'Accelerator optimized', vCpus: 24, memoryGb: 170,  gpuCount: 2,  gpuType: 'A100_40GB' },
  { name: 'a2-highgpu-4g',   series: 'A2', family: 'Accelerator optimized', vCpus: 48, memoryGb: 340,  gpuCount: 4,  gpuType: 'A100_40GB' },
  { name: 'a2-highgpu-8g',   series: 'A2', family: 'Accelerator optimized', vCpus: 96, memoryGb: 680,  gpuCount: 8,  gpuType: 'A100_40GB' },
  { name: 'a2-megagpu-16g',  series: 'A2', family: 'Accelerator optimized', vCpus: 96, memoryGb: 1360, gpuCount: 16, gpuType: 'A100_40GB' },
  { name: 'a2-ultragpu-1g',  series: 'A2', family: 'Accelerator optimized', vCpus: 12, memoryGb: 170,  gpuCount: 1,  gpuType: 'A100_80GB' },
  { name: 'a2-ultragpu-2g',  series: 'A2', family: 'Accelerator optimized', vCpus: 24, memoryGb: 340,  gpuCount: 2,  gpuType: 'A100_80GB' },
  { name: 'a2-ultragpu-4g',  series: 'A2', family: 'Accelerator optimized', vCpus: 48, memoryGb: 680,  gpuCount: 4,  gpuType: 'A100_80GB' },
  { name: 'a2-ultragpu-8g',  series: 'A2', family: 'Accelerator optimized', vCpus: 96, memoryGb: 1360, gpuCount: 8,  gpuType: 'A100_80GB' },

  // --- A3 (Intel Sapphire Rapids + NVIDIA H100) ---
  // Highgpu: H100 80GB SXM | Megagpu: H100 80GB SXM5 (NVLink fabric — distinct billing SKU)
  { name: 'a3-highgpu-1g',  series: 'A3', family: 'Accelerator optimized', vCpus: 26,  memoryGb: 234,  gpuCount: 1, gpuType: 'H100_80GB' },
  { name: 'a3-highgpu-2g',  series: 'A3', family: 'Accelerator optimized', vCpus: 52,  memoryGb: 468,  gpuCount: 2, gpuType: 'H100_80GB' },
  { name: 'a3-highgpu-4g',  series: 'A3', family: 'Accelerator optimized', vCpus: 104, memoryGb: 936,  gpuCount: 4, gpuType: 'H100_80GB' },
  { name: 'a3-highgpu-8g',  series: 'A3', family: 'Accelerator optimized', vCpus: 208, memoryGb: 1872, gpuCount: 8, gpuType: 'H100_80GB' },
  { name: 'a3-megagpu-8g',  series: 'A3Mega', family: 'Accelerator optimized', vCpus: 208, memoryGb: 1872, gpuCount: 8, gpuType: 'H100_MEGA_80GB' },

  // --- G2 (Intel Cascade Lake + NVIDIA L4) ---
  // GPU count scales with vCPU count: ≤16 vCPUs → 1×L4, 24 → 2×, 48 → 4×, 96 → 8×
  { name: 'g2-standard-4',  series: 'G2', family: 'Accelerator optimized', vCpus: 4,  memoryGb: 16,  gpuCount: 1, gpuType: 'L4' },
  { name: 'g2-standard-8',  series: 'G2', family: 'Accelerator optimized', vCpus: 8,  memoryGb: 32,  gpuCount: 1, gpuType: 'L4' },
  { name: 'g2-standard-12', series: 'G2', family: 'Accelerator optimized', vCpus: 12, memoryGb: 48,  gpuCount: 1, gpuType: 'L4' },
  { name: 'g2-standard-16', series: 'G2', family: 'Accelerator optimized', vCpus: 16, memoryGb: 64,  gpuCount: 1, gpuType: 'L4' },
  { name: 'g2-standard-24', series: 'G2', family: 'Accelerator optimized', vCpus: 24, memoryGb: 96,  gpuCount: 2, gpuType: 'L4' },
  { name: 'g2-standard-32', series: 'G2', family: 'Accelerator optimized', vCpus: 32, memoryGb: 128, gpuCount: 1, gpuType: 'L4' },
  { name: 'g2-standard-48', series: 'G2', family: 'Accelerator optimized', vCpus: 48, memoryGb: 192, gpuCount: 4, gpuType: 'L4' },
  { name: 'g2-standard-96', series: 'G2', family: 'Accelerator optimized', vCpus: 96, memoryGb: 384, gpuCount: 8, gpuType: 'L4' },

  // TODO: A4 (NVIDIA B200) — specs not yet confirmed, add once published
  // TODO: Z3 (storage-optimized), X4 (memory-optimized) — specs to be added
]

// Index by name for fast lookup
export const MACHINE_TYPE_MAP = new Map(MACHINE_TYPES.map((m) => [m.name, m]))

/**
 * Linux CoreMark benchmark scores, keyed by machine type name.
 *
 * Source: Google Cloud, "CoreMark scores of VM instances by family"
 *   https://cloud.google.com/compute/docs/coremark-scores-of-vm-instances
 *
 * Each score is the aggregate multi-threaded CoreMark result measured by Google
 * with PerfKitBenchmarker on ubuntu2204, running threads equal to the machine
 * type's vCPU count. Scores therefore scale with vCPUs and compare total
 * throughput, not per-core performance. The CPU platform noted per group is the
 * one Google benchmarked on; the same machine type can land on a newer platform.
 *
 * IMPORTANT: Google retired these tables from the page above in early 2026 — it
 * now only documents how to run PerfKitBenchmarker yourself and directs you to
 * your account team to ask about scores. The values below are frozen from the
 * last published revision (verified identical in the 2025-11-04 and 2025-12-05
 * Internet Archive snapshots) and cannot be refreshed from a public Google
 * source. Machine types released after that revision (C4, A3, the newer A2 GPU
 * shapes) have no published score and are intentionally absent.
 */
export const COREMARK_SCORES: Record<string, number> = {
  // N4 standard VMs — Emerald Rapids
  'n4-standard-2':  44377,
  'n4-standard-4':  86569,
  'n4-standard-8':  177655,
  'n4-standard-16': 354249,
  'n4-standard-32': 706433,
  'n4-standard-48': 1057781,
  'n4-standard-64': 1351294,
  'n4-standard-80': 1626413,

  // N4 highcpu VMs — Emerald Rapids
  'n4-highcpu-2':  44397,
  'n4-highcpu-4':  86649,
  'n4-highcpu-8':  177628,
  'n4-highcpu-16': 354814,
  'n4-highcpu-32': 707229,
  'n4-highcpu-48': 1058224,
  'n4-highcpu-64': 1351265,

  // N4 highmem VMs — Emerald Rapids
  'n4-highmem-2':  44371,
  'n4-highmem-4':  86305,
  'n4-highmem-8':  177336,
  'n4-highmem-16': 354343,
  'n4-highmem-32': 704876,
  'n4-highmem-48': 1027463,
  'n4-highmem-64': 1256257,
  'n4-highmem-80': 1536069,

  // C3D standard VMs — Genoa
  'c3d-standard-4':   94572,
  'c3d-standard-8':   192584,
  'c3d-standard-16':  384420,
  'c3d-standard-30':  681460,
  'c3d-standard-60':  1360072,
  'c3d-standard-90':  2138141,
  'c3d-standard-180': 3905736,
  'c3d-standard-360': 8026988,

  // C3D highcpu VMs — Genoa
  'c3d-highcpu-4':   94611,
  'c3d-highcpu-8':   192661,
  'c3d-highcpu-16':  384658,
  'c3d-highcpu-30':  682826,
  'c3d-highcpu-60':  1363944,
  'c3d-highcpu-90':  2149508,
  'c3d-highcpu-180': 3940383,
  'c3d-highcpu-360': 7977725,

  // C3D highmem VMs — Genoa
  'c3d-highmem-4':   94477,
  'c3d-highmem-8':   192283,
  'c3d-highmem-16':  384623,
  'c3d-highmem-30':  681272,
  'c3d-highmem-60':  1364173,
  'c3d-highmem-90':  2143972,
  'c3d-highmem-180': 3958388,
  'c3d-highmem-360': 8069686,

  // C3 standard VMs — Sapphire Rapids
  'c3-standard-4':   80609,
  'c3-standard-8':   160341,
  'c3-standard-22':  440662,
  'c3-standard-44':  878867,
  'c3-standard-88':  1691035,
  'c3-standard-176': 3377967,

  // C3 highcpu VMs — Sapphire Rapids
  'c3-highcpu-4':   80641,
  'c3-highcpu-8':   160329,
  'c3-highcpu-22':  441164,
  'c3-highcpu-44':  880832,
  'c3-highcpu-88':  1696613,
  'c3-highcpu-176': 3388373,

  // C3 highmem VMs — Sapphire Rapids
  'c3-highmem-4':   80742,
  'c3-highmem-8':   160478,
  'c3-highmem-22':  441229,
  'c3-highmem-44':  877637,
  'c3-highmem-88':  1689147,
  'c3-highmem-176': 3347332,

  // H3 standard VMs — Sapphire Rapids
  'h3-standard-88': 2367121,

  // M3 VMs — Ice Lake
  'm3-ultramem-32':  556066,
  'm3-ultramem-64':  1101308,
  'm3-ultramem-128': 2190379,

  // M3 VMs — Ice Lake
  'm3-megamem-64':  1094465,
  'm3-megamem-128': 2182236,

  // Z3 highmem VMs — Sapphire Rapids
  'z3-highmem-88-highlssd':      1691169,
  'z3-highmem-176-standardlssd': 3373295,

  // N2 standard VMs — Ice Lake
  'n2-standard-2':   34735,
  'n2-standard-4':   66884,
  'n2-standard-8':   138567,
  'n2-standard-16':  277010,
  'n2-standard-32':  553662,
  'n2-standard-48':  824915,
  'n2-standard-64':  1091008,
  'n2-standard-80':  1365998,
  'n2-standard-96':  1651980,
  'n2-standard-128': 2169248,

  // N2 high-memory VMs — Ice Lake
  'n2-highmem-2':   34695,
  'n2-highmem-4':   66798,
  'n2-highmem-8':   138406,
  'n2-highmem-16':  276327,
  'n2-highmem-32':  550448,
  'n2-highmem-48':  814034,
  'n2-highmem-64':  1097943,
  'n2-highmem-80':  1361752,
  'n2-highmem-96':  1643949,
  'n2-highmem-128': 2191510,

  // N2 high-cpu VMs — Ice Lake
  'n2-highcpu-2':  34740,
  'n2-highcpu-4':  66908,
  'n2-highcpu-8':  138600,
  'n2-highcpu-16': 276855,
  'n2-highcpu-32': 550940,
  'n2-highcpu-48': 822890,
  'n2-highcpu-64': 1100249,
  'n2-highcpu-80': 1377373,

  // Tau T2A standard VMs — Ampere
  't2a-standard-1':  23509,
  't2a-standard-2':  47054,
  't2a-standard-4':  94096,
  't2a-standard-8':  188206,
  't2a-standard-16': 375477,
  't2a-standard-32': 748166,
  't2a-standard-48': 1118158,

  // Tau T2D standard VMs — Milan
  't2d-standard-1':  29363,
  't2d-standard-2':  59889,
  't2d-standard-4':  119587,
  't2d-standard-8':  238534,
  't2d-standard-16': 475405,
  't2d-standard-32': 945524,
  't2d-standard-48': 1395082,
  't2d-standard-60': 1667024,

  // N2D standard VMs — Milan
  'n2d-standard-2':   41092,
  'n2d-standard-4':   80098,
  'n2d-standard-8':   163858,
  'n2d-standard-16':  327484,
  'n2d-standard-32':  651986,
  'n2d-standard-48':  967312,
  'n2d-standard-64':  1162499,
  'n2d-standard-80':  1425708,
  'n2d-standard-96':  1768996,
  'n2d-standard-128': 2305562,
  'n2d-standard-224': 3835775,

  // N2D high-memory VMs — Milan
  'n2d-highmem-2':  41073,
  'n2d-highmem-4':  80065,
  'n2d-highmem-8':  163486,
  'n2d-highmem-16': 327341,
  'n2d-highmem-32': 652572,
  'n2d-highmem-48': 975016,
  'n2d-highmem-64': 1198883,
  'n2d-highmem-80': 1484925,
  'n2d-highmem-96': 1794083,

  // N2D high-cpu VMs — Milan
  'n2d-highcpu-2':  41112,
  'n2d-highcpu-4':  80173,
  'n2d-highcpu-8':  163935,
  'n2d-highcpu-16': 327122,
  'n2d-highcpu-32': 654523,
  'n2d-highcpu-48': 973067,
  'n2d-highcpu-64': 1174712,
  'n2d-highcpu-80': 1478174,
  'n2d-highcpu-96': 1801312,

  // E2 standard VMs — Intel
  'e2-standard-2':  26255,
  'e2-standard-4':  52043,
  'e2-standard-8':  103957,
  'e2-standard-16': 208075,
  'e2-standard-32': 417535,

  // E2 high-memory VMs — Skylake
  'e2-highmem-2':  26243,
  'e2-highmem-4':  51736,
  'e2-highmem-8':  104083,
  'e2-highmem-16': 208433,

  // E2 high-cpu VMs — Skylake
  'e2-highcpu-2':  26092,
  'e2-highcpu-4':  51937,
  'e2-highcpu-8':  104080,
  'e2-highcpu-16': 207561,
  'e2-highcpu-32': 416599,

  // M2 VMs — Cascade Lake
  'm2-megamem-416':  6193999,
  'm2-hypermem-416': 6192759,
  'm2-ultramem-416': 6205665,
  'm2-ultramem-208': 3124387,

  // M1 VMs — Broadwell, Skylake
  'm1-megamem-96':   1223742,
  'm1-ultramem-40':  516435,
  'm1-ultramem-80':  1010128,
  'm1-ultramem-160': 2015006,

  // C2 standard VMs — Cascade Lake
  'c2-standard-4':  73269,
  'c2-standard-8':  146712,
  'c2-standard-16': 292366,
  'c2-standard-30': 531709,
  'c2-standard-60': 1060101,

  // C2D standard VMs — Milan
  'c2d-standard-2':   44674,
  'c2d-standard-4':   86943,
  'c2d-standard-8':   177921,
  'c2d-standard-16':  354249,
  'c2d-standard-32':  709399,
  'c2d-standard-56':  1244451,
  'c2d-standard-112': 2299545,

  // C2D high-mem VMs — Milan
  'c2d-highmem-2':   44649,
  'c2d-highmem-4':   86956,
  'c2d-highmem-8':   177882,
  'c2d-highmem-16':  354656,
  'c2d-highmem-32':  709754,
  'c2d-highmem-56':  1242783,
  'c2d-highmem-112': 2294226,

  // C2D high-cpu VMs — Milan
  'c2d-highcpu-2':   44678,
  'c2d-highcpu-4':   86953,
  'c2d-highcpu-8':   177774,
  'c2d-highcpu-16':  354771,
  'c2d-highcpu-32':  710036,
  'c2d-highcpu-56':  1244008,
  'c2d-highcpu-112': 2299260,

  // A2 high-gpu instances — Cascade Lake
  'a2-highgpu-8g': 1269327,

  // A2 mega-gpu instances — Cascade Lake
  'a2-megagpu-16g': 1258852,

  // G2 standard instances — Cascade Lake
  'g2-standard-4':  56273,
  'g2-standard-8':  111997,
  'g2-standard-12': 167604,
  'g2-standard-16': 223514,
  'g2-standard-24': 334411,
  'g2-standard-32': 446322,
  'g2-standard-48': 656106,
  'g2-standard-96': 1249876,

  // N1 standard VMs — Skylake
  'n1-standard-1':  20060,
  'n1-standard-2':  26293,
  'n1-standard-4':  52091,
  'n1-standard-8':  104161,
  'n1-standard-16': 208193,
  'n1-standard-32': 414412,
  'n1-standard-64': 812905,
  'n1-standard-96': 1231358,

  // N1 high-memory VMs — Skylake
  'n1-highmem-2':  26293,
  'n1-highmem-4':  52095,
  'n1-highmem-8':  104145,
  'n1-highmem-16': 208446,
  'n1-highmem-32': 415396,
  'n1-highmem-64': 817050,
  'n1-highmem-96': 1233066,

  // N1 high-cpu VMs — Skylake
  'n1-highcpu-2':  26348,
  'n1-highcpu-4':  52108,
  'n1-highcpu-8':  104238,
  'n1-highcpu-16': 207968,
  'n1-highcpu-32': 414526,
  'n1-highcpu-64': 815329,
  'n1-highcpu-96': 1232561,

  // N1 shared-core VMs — Skylake
  'f1-micro': 3949,
  'g1-small': 10191,}

