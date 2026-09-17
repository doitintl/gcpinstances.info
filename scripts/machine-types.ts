// Canonical GPU type identifiers — used as keys in gpuRates lookup
// Values must match the patterns in GPU_TYPE_PATTERNS in fetch-pricing.ts
export type GpuType = 'A100_40GB' | 'A100_80GB' | 'H100_80GB' | 'H100_MEGA_80GB' | 'H200_141GB' | 'L4' | 'B200'

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
  // Series added from the Compute Engine API. CPU platforms are Google's
  // published ones for each series; localSsd reflects whether the series offers
  // Local SSD at all, not whether a given shape includes it.
  C4A: { cpuType: 'Google Axion (Arm Neoverse-V2)', localSsd: true,  gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: false },
  C4D: { cpuType: 'AMD EPYC Turin',                 localSsd: true,  gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: true },
  C4N: { cpuType: 'Intel Xeon 6 (Granite Rapids)',  localSsd: true,  gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: true },
  C3D: { cpuType: 'AMD EPYC Genoa',                 localSsd: true,  gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: true },
  N4A: { cpuType: 'Google Axion (Arm Neoverse-V2)', localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  N4D: { cpuType: 'AMD EPYC Turin',                 localSsd: false, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: true },
  M4:  { cpuType: 'Intel Xeon 6 (Granite Rapids)',  localSsd: false, gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: false },
  M4N: { cpuType: 'Intel Xeon 6 (Granite Rapids)',  localSsd: false, gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: false },
  X4:  { cpuType: 'Intel Sapphire Rapids',          localSsd: false, gpuSupport: false, soleTenantSupport: true,  nestedVirtualization: false },
  Z3:  { cpuType: 'Intel Sapphire Rapids',          localSsd: true,  gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  // Google prices the two Local SSD variants separately
  // (Z4D-HIGHMEM-STANDARDLSSD and Z4D-HIGHMEM-HIGHLSSD), so they are distinct
  // series here — one shared Z4D would bill the high-LSSD shapes at the
  // standard rate.
  Z4DStandardLssd: { cpuType: 'AMD EPYC Turin', localSsd: true, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  Z4DHighLssd:     { cpuType: 'AMD EPYC Turin', localSsd: true, gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  H4D: { cpuType: 'AMD EPYC Turin',                 localSsd: true,  gpuSupport: false, soleTenantSupport: false, nestedVirtualization: false },
  G4:  { cpuType: 'AMD EPYC Turin',                 localSsd: true,  gpuSupport: true,  soleTenantSupport: false, nestedVirtualization: false },
  A4:  { cpuType: 'Intel Emerald Rapids',           localSsd: true,  gpuSupport: true,  soleTenantSupport: false, nestedVirtualization: false },
  A4X: { cpuType: 'NVIDIA Grace (Arm)',             localSsd: true,  gpuSupport: true,  soleTenantSupport: false, nestedVirtualization: false },
  A3Plus:  { cpuType: 'Intel Sapphire Rapids', localSsd: true, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
  A3Ultra: { cpuType: 'Intel Emerald Rapids',  localSsd: true, gpuSupport: true, soleTenantSupport: false, nestedVirtualization: false },
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

  // --- A3 variants (Accelerator optimized) ---
  // The a3- prefix covers four series labels. A3Ultra carries H200s and is
  // priced under its own name in the catalogue; the edge shapes share A3's
  // H100 rates. a3-megagpu-8g is defined above as A3Mega and already priced.
  { name: 'a3-ultragpu-8g',        series: 'A3Ultra', family: 'Accelerator optimized', vCpus: 224, memoryGb: 2952, gpuCount: 8, gpuType: 'H200_141GB' },
  { name: 'a3-ultragpu-8g-nolssd', series: 'A3Ultra', family: 'Accelerator optimized', vCpus: 224, memoryGb: 2952, gpuCount: 8, gpuType: 'H200_141GB' },
  { name: 'a3-edgegpu-8g',         series: 'A3',      family: 'Accelerator optimized', vCpus: 208, memoryGb: 1872, gpuCount: 8, gpuType: 'H100_80GB' },
  { name: 'a3-edgegpu-8g-nolssd',  series: 'A3',      family: 'Accelerator optimized', vCpus: 208, memoryGb: 1872, gpuCount: 8, gpuType: 'H100_80GB' },

  // ── Families added from the Compute Engine API ──────────────────────────
  // Generated by scripts/generate-machine-types.ts. These fourteen series
  // existed in Google's catalogue for months while the table showed nothing:
  // a SKU has to clear both SERIES_PATTERNS in fetch-pricing.ts and a spec
  // here, and hand-maintaining the second meant new families were invisible
  // until someone typed them out. See scripts/check-drift.ts.
  // --- C4A (Compute optimized) — 42 types from the Compute Engine API ---
  { name: 'c4a-standard-1',        series: 'C4A', family: 'Compute optimized', vCpus:   1, memoryGb: 4 },
  { name: 'c4a-standard-2',        series: 'C4A', family: 'Compute optimized', vCpus:   2, memoryGb: 8 },
  { name: 'c4a-standard-4',        series: 'C4A', family: 'Compute optimized', vCpus:   4, memoryGb: 16 },
  { name: 'c4a-standard-4-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:   4, memoryGb: 16 },
  { name: 'c4a-standard-8',        series: 'C4A', family: 'Compute optimized', vCpus:   8, memoryGb: 32 },
  { name: 'c4a-standard-8-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:   8, memoryGb: 32 },
  { name: 'c4a-standard-16',       series: 'C4A', family: 'Compute optimized', vCpus:  16, memoryGb: 64 },
  { name: 'c4a-standard-16-lssd',  series: 'C4A', family: 'Compute optimized', vCpus:  16, memoryGb: 64 },
  { name: 'c4a-standard-32',       series: 'C4A', family: 'Compute optimized', vCpus:  32, memoryGb: 128 },
  { name: 'c4a-standard-32-lssd',  series: 'C4A', family: 'Compute optimized', vCpus:  32, memoryGb: 128 },
  { name: 'c4a-standard-48',       series: 'C4A', family: 'Compute optimized', vCpus:  48, memoryGb: 192 },
  { name: 'c4a-standard-48-lssd',  series: 'C4A', family: 'Compute optimized', vCpus:  48, memoryGb: 192 },
  { name: 'c4a-standard-64',       series: 'C4A', family: 'Compute optimized', vCpus:  64, memoryGb: 256 },
  { name: 'c4a-standard-64-lssd',  series: 'C4A', family: 'Compute optimized', vCpus:  64, memoryGb: 256 },
  { name: 'c4a-standard-72',       series: 'C4A', family: 'Compute optimized', vCpus:  72, memoryGb: 288 },
  { name: 'c4a-standard-72-lssd',  series: 'C4A', family: 'Compute optimized', vCpus:  72, memoryGb: 288 },
  { name: 'c4a-highcpu-1',         series: 'C4A', family: 'Compute optimized', vCpus:   1, memoryGb: 2 },
  { name: 'c4a-highcpu-2',         series: 'C4A', family: 'Compute optimized', vCpus:   2, memoryGb: 4 },
  { name: 'c4a-highcpu-4',         series: 'C4A', family: 'Compute optimized', vCpus:   4, memoryGb: 8 },
  { name: 'c4a-highcpu-8',         series: 'C4A', family: 'Compute optimized', vCpus:   8, memoryGb: 16 },
  { name: 'c4a-highcpu-16',        series: 'C4A', family: 'Compute optimized', vCpus:  16, memoryGb: 32 },
  { name: 'c4a-highcpu-32',        series: 'C4A', family: 'Compute optimized', vCpus:  32, memoryGb: 64 },
  { name: 'c4a-highcpu-48',        series: 'C4A', family: 'Compute optimized', vCpus:  48, memoryGb: 96 },
  { name: 'c4a-highcpu-64',        series: 'C4A', family: 'Compute optimized', vCpus:  64, memoryGb: 128 },
  { name: 'c4a-highcpu-72',        series: 'C4A', family: 'Compute optimized', vCpus:  72, memoryGb: 144 },
  { name: 'c4a-highmem-1',         series: 'C4A', family: 'Compute optimized', vCpus:   1, memoryGb: 8 },
  { name: 'c4a-highmem-2',         series: 'C4A', family: 'Compute optimized', vCpus:   2, memoryGb: 16 },
  { name: 'c4a-highmem-4',         series: 'C4A', family: 'Compute optimized', vCpus:   4, memoryGb: 32 },
  { name: 'c4a-highmem-4-lssd',    series: 'C4A', family: 'Compute optimized', vCpus:   4, memoryGb: 32 },
  { name: 'c4a-highmem-8',         series: 'C4A', family: 'Compute optimized', vCpus:   8, memoryGb: 64 },
  { name: 'c4a-highmem-8-lssd',    series: 'C4A', family: 'Compute optimized', vCpus:   8, memoryGb: 64 },
  { name: 'c4a-highmem-16',        series: 'C4A', family: 'Compute optimized', vCpus:  16, memoryGb: 128 },
  { name: 'c4a-highmem-16-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:  16, memoryGb: 128 },
  { name: 'c4a-highmem-32',        series: 'C4A', family: 'Compute optimized', vCpus:  32, memoryGb: 256 },
  { name: 'c4a-highmem-32-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:  32, memoryGb: 256 },
  { name: 'c4a-highmem-48',        series: 'C4A', family: 'Compute optimized', vCpus:  48, memoryGb: 384 },
  { name: 'c4a-highmem-48-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:  48, memoryGb: 384 },
  { name: 'c4a-highmem-64',        series: 'C4A', family: 'Compute optimized', vCpus:  64, memoryGb: 512 },
  { name: 'c4a-highmem-64-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:  64, memoryGb: 512 },
  { name: 'c4a-highmem-72',        series: 'C4A', family: 'Compute optimized', vCpus:  72, memoryGb: 576 },
  { name: 'c4a-highmem-72-lssd',   series: 'C4A', family: 'Compute optimized', vCpus:  72, memoryGb: 576 },
  { name: 'c4a-highmem-96-metal',  series: 'C4A', family: 'Compute optimized', vCpus:  96, memoryGb: 768 },
  // --- C4D (Compute optimized) — 49 types from the Compute Engine API ---
  { name: 'c4d-standard-2',          series: 'C4D', family: 'Compute optimized', vCpus:   2, memoryGb: 7 },
  { name: 'c4d-standard-4',          series: 'C4D', family: 'Compute optimized', vCpus:   4, memoryGb: 15 },
  { name: 'c4d-standard-8',          series: 'C4D', family: 'Compute optimized', vCpus:   8, memoryGb: 31 },
  { name: 'c4d-standard-8-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:   8, memoryGb: 31 },
  { name: 'c4d-standard-16',         series: 'C4D', family: 'Compute optimized', vCpus:  16, memoryGb: 62 },
  { name: 'c4d-standard-16-lssd',    series: 'C4D', family: 'Compute optimized', vCpus:  16, memoryGb: 62 },
  { name: 'c4d-standard-32',         series: 'C4D', family: 'Compute optimized', vCpus:  32, memoryGb: 124 },
  { name: 'c4d-standard-32-lssd',    series: 'C4D', family: 'Compute optimized', vCpus:  32, memoryGb: 124 },
  { name: 'c4d-standard-48',         series: 'C4D', family: 'Compute optimized', vCpus:  48, memoryGb: 186 },
  { name: 'c4d-standard-48-lssd',    series: 'C4D', family: 'Compute optimized', vCpus:  48, memoryGb: 186 },
  { name: 'c4d-standard-64',         series: 'C4D', family: 'Compute optimized', vCpus:  64, memoryGb: 248 },
  { name: 'c4d-standard-64-lssd',    series: 'C4D', family: 'Compute optimized', vCpus:  64, memoryGb: 248 },
  { name: 'c4d-standard-96',         series: 'C4D', family: 'Compute optimized', vCpus:  96, memoryGb: 372 },
  { name: 'c4d-standard-96-lssd',    series: 'C4D', family: 'Compute optimized', vCpus:  96, memoryGb: 372 },
  { name: 'c4d-standard-192',        series: 'C4D', family: 'Compute optimized', vCpus: 192, memoryGb: 744 },
  { name: 'c4d-standard-192-lssd',   series: 'C4D', family: 'Compute optimized', vCpus: 192, memoryGb: 744 },
  { name: 'c4d-standard-384',        series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 1488 },
  { name: 'c4d-standard-384-lssd',   series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 1488 },
  { name: 'c4d-standard-384-metal',  series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 1536 },
  { name: 'c4d-highcpu-2',           series: 'C4D', family: 'Compute optimized', vCpus:   2, memoryGb: 3 },
  { name: 'c4d-highcpu-4',           series: 'C4D', family: 'Compute optimized', vCpus:   4, memoryGb: 7 },
  { name: 'c4d-highcpu-8',           series: 'C4D', family: 'Compute optimized', vCpus:   8, memoryGb: 15 },
  { name: 'c4d-highcpu-16',          series: 'C4D', family: 'Compute optimized', vCpus:  16, memoryGb: 30 },
  { name: 'c4d-highcpu-32',          series: 'C4D', family: 'Compute optimized', vCpus:  32, memoryGb: 60 },
  { name: 'c4d-highcpu-48',          series: 'C4D', family: 'Compute optimized', vCpus:  48, memoryGb: 90 },
  { name: 'c4d-highcpu-64',          series: 'C4D', family: 'Compute optimized', vCpus:  64, memoryGb: 120 },
  { name: 'c4d-highcpu-96',          series: 'C4D', family: 'Compute optimized', vCpus:  96, memoryGb: 180 },
  { name: 'c4d-highcpu-192',         series: 'C4D', family: 'Compute optimized', vCpus: 192, memoryGb: 360 },
  { name: 'c4d-highcpu-384',         series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 720 },
  { name: 'c4d-highcpu-384-metal',   series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 768 },
  { name: 'c4d-highmem-2',           series: 'C4D', family: 'Compute optimized', vCpus:   2, memoryGb: 15 },
  { name: 'c4d-highmem-4',           series: 'C4D', family: 'Compute optimized', vCpus:   4, memoryGb: 31 },
  { name: 'c4d-highmem-8',           series: 'C4D', family: 'Compute optimized', vCpus:   8, memoryGb: 63 },
  { name: 'c4d-highmem-8-lssd',      series: 'C4D', family: 'Compute optimized', vCpus:   8, memoryGb: 63 },
  { name: 'c4d-highmem-16',          series: 'C4D', family: 'Compute optimized', vCpus:  16, memoryGb: 126 },
  { name: 'c4d-highmem-16-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:  16, memoryGb: 126 },
  { name: 'c4d-highmem-32',          series: 'C4D', family: 'Compute optimized', vCpus:  32, memoryGb: 252 },
  { name: 'c4d-highmem-32-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:  32, memoryGb: 252 },
  { name: 'c4d-highmem-48',          series: 'C4D', family: 'Compute optimized', vCpus:  48, memoryGb: 378 },
  { name: 'c4d-highmem-48-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:  48, memoryGb: 378 },
  { name: 'c4d-highmem-64',          series: 'C4D', family: 'Compute optimized', vCpus:  64, memoryGb: 504 },
  { name: 'c4d-highmem-64-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:  64, memoryGb: 504 },
  { name: 'c4d-highmem-96',          series: 'C4D', family: 'Compute optimized', vCpus:  96, memoryGb: 756 },
  { name: 'c4d-highmem-96-lssd',     series: 'C4D', family: 'Compute optimized', vCpus:  96, memoryGb: 756 },
  { name: 'c4d-highmem-192',         series: 'C4D', family: 'Compute optimized', vCpus: 192, memoryGb: 1512 },
  { name: 'c4d-highmem-192-lssd',    series: 'C4D', family: 'Compute optimized', vCpus: 192, memoryGb: 1512 },
  { name: 'c4d-highmem-384',         series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 3024 },
  { name: 'c4d-highmem-384-lssd',    series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 3024 },
  { name: 'c4d-highmem-384-metal',   series: 'C4D', family: 'Compute optimized', vCpus: 384, memoryGb: 3072 },
  // --- C4N (Compute optimized) — 38 types from the Compute Engine API ---
  { name: 'c4n-standard-2',         series: 'C4N', family: 'Compute optimized', vCpus:   2, memoryGb: 7 },
  { name: 'c4n-standard-4',         series: 'C4N', family: 'Compute optimized', vCpus:   4, memoryGb: 15 },
  { name: 'c4n-standard-4-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:   4, memoryGb: 15 },
  { name: 'c4n-standard-8',         series: 'C4N', family: 'Compute optimized', vCpus:   8, memoryGb: 30 },
  { name: 'c4n-standard-8-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:   8, memoryGb: 30 },
  { name: 'c4n-standard-16',        series: 'C4N', family: 'Compute optimized', vCpus:  16, memoryGb: 60 },
  { name: 'c4n-standard-16-lssd',   series: 'C4N', family: 'Compute optimized', vCpus:  16, memoryGb: 60 },
  { name: 'c4n-standard-24',        series: 'C4N', family: 'Compute optimized', vCpus:  24, memoryGb: 90 },
  { name: 'c4n-standard-24-lssd',   series: 'C4N', family: 'Compute optimized', vCpus:  24, memoryGb: 90 },
  { name: 'c4n-standard-48',        series: 'C4N', family: 'Compute optimized', vCpus:  48, memoryGb: 180 },
  { name: 'c4n-standard-48-lssd',   series: 'C4N', family: 'Compute optimized', vCpus:  48, memoryGb: 180 },
  { name: 'c4n-standard-96',        series: 'C4N', family: 'Compute optimized', vCpus:  96, memoryGb: 360 },
  { name: 'c4n-standard-96-lssd',   series: 'C4N', family: 'Compute optimized', vCpus:  96, memoryGb: 360 },
  { name: 'c4n-standard-192',       series: 'C4N', family: 'Compute optimized', vCpus: 192, memoryGb: 720 },
  { name: 'c4n-standard-192-lssd',  series: 'C4N', family: 'Compute optimized', vCpus: 192, memoryGb: 720 },
  { name: 'c4n-highcpu-2',          series: 'C4N', family: 'Compute optimized', vCpus:   2, memoryGb: 4 },
  { name: 'c4n-highcpu-4',          series: 'C4N', family: 'Compute optimized', vCpus:   4, memoryGb: 8 },
  { name: 'c4n-highcpu-8',          series: 'C4N', family: 'Compute optimized', vCpus:   8, memoryGb: 16 },
  { name: 'c4n-highcpu-16',         series: 'C4N', family: 'Compute optimized', vCpus:  16, memoryGb: 32 },
  { name: 'c4n-highcpu-24',         series: 'C4N', family: 'Compute optimized', vCpus:  24, memoryGb: 48 },
  { name: 'c4n-highcpu-48',         series: 'C4N', family: 'Compute optimized', vCpus:  48, memoryGb: 96 },
  { name: 'c4n-highcpu-96',         series: 'C4N', family: 'Compute optimized', vCpus:  96, memoryGb: 192 },
  { name: 'c4n-highcpu-192',        series: 'C4N', family: 'Compute optimized', vCpus: 192, memoryGb: 384 },
  { name: 'c4n-highmem-2',          series: 'C4N', family: 'Compute optimized', vCpus:   2, memoryGb: 15 },
  { name: 'c4n-highmem-4',          series: 'C4N', family: 'Compute optimized', vCpus:   4, memoryGb: 31 },
  { name: 'c4n-highmem-4-lssd',     series: 'C4N', family: 'Compute optimized', vCpus:   4, memoryGb: 31 },
  { name: 'c4n-highmem-8',          series: 'C4N', family: 'Compute optimized', vCpus:   8, memoryGb: 62 },
  { name: 'c4n-highmem-8-lssd',     series: 'C4N', family: 'Compute optimized', vCpus:   8, memoryGb: 62 },
  { name: 'c4n-highmem-16',         series: 'C4N', family: 'Compute optimized', vCpus:  16, memoryGb: 124 },
  { name: 'c4n-highmem-16-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:  16, memoryGb: 124 },
  { name: 'c4n-highmem-24',         series: 'C4N', family: 'Compute optimized', vCpus:  24, memoryGb: 186 },
  { name: 'c4n-highmem-24-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:  24, memoryGb: 186 },
  { name: 'c4n-highmem-48',         series: 'C4N', family: 'Compute optimized', vCpus:  48, memoryGb: 372 },
  { name: 'c4n-highmem-48-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:  48, memoryGb: 372 },
  { name: 'c4n-highmem-96',         series: 'C4N', family: 'Compute optimized', vCpus:  96, memoryGb: 744 },
  { name: 'c4n-highmem-96-lssd',    series: 'C4N', family: 'Compute optimized', vCpus:  96, memoryGb: 744 },
  { name: 'c4n-highmem-192',        series: 'C4N', family: 'Compute optimized', vCpus: 192, memoryGb: 1488 },
  { name: 'c4n-highmem-192-lssd',   series: 'C4N', family: 'Compute optimized', vCpus: 192, memoryGb: 1488 },
  // --- N4A (General purpose) — 24 types from the Compute Engine API ---
  { name: 'n4a-standard-1',   series: 'N4A', family: 'General purpose', vCpus:   1, memoryGb: 4 },
  { name: 'n4a-standard-2',   series: 'N4A', family: 'General purpose', vCpus:   2, memoryGb: 8 },
  { name: 'n4a-standard-4',   series: 'N4A', family: 'General purpose', vCpus:   4, memoryGb: 16 },
  { name: 'n4a-standard-8',   series: 'N4A', family: 'General purpose', vCpus:   8, memoryGb: 32 },
  { name: 'n4a-standard-16',  series: 'N4A', family: 'General purpose', vCpus:  16, memoryGb: 64 },
  { name: 'n4a-standard-32',  series: 'N4A', family: 'General purpose', vCpus:  32, memoryGb: 128 },
  { name: 'n4a-standard-48',  series: 'N4A', family: 'General purpose', vCpus:  48, memoryGb: 192 },
  { name: 'n4a-standard-64',  series: 'N4A', family: 'General purpose', vCpus:  64, memoryGb: 256 },
  { name: 'n4a-highcpu-1',    series: 'N4A', family: 'General purpose', vCpus:   1, memoryGb: 2 },
  { name: 'n4a-highcpu-2',    series: 'N4A', family: 'General purpose', vCpus:   2, memoryGb: 4 },
  { name: 'n4a-highcpu-4',    series: 'N4A', family: 'General purpose', vCpus:   4, memoryGb: 8 },
  { name: 'n4a-highcpu-8',    series: 'N4A', family: 'General purpose', vCpus:   8, memoryGb: 16 },
  { name: 'n4a-highcpu-16',   series: 'N4A', family: 'General purpose', vCpus:  16, memoryGb: 32 },
  { name: 'n4a-highcpu-32',   series: 'N4A', family: 'General purpose', vCpus:  32, memoryGb: 64 },
  { name: 'n4a-highcpu-48',   series: 'N4A', family: 'General purpose', vCpus:  48, memoryGb: 96 },
  { name: 'n4a-highcpu-64',   series: 'N4A', family: 'General purpose', vCpus:  64, memoryGb: 128 },
  { name: 'n4a-highmem-1',    series: 'N4A', family: 'General purpose', vCpus:   1, memoryGb: 8 },
  { name: 'n4a-highmem-2',    series: 'N4A', family: 'General purpose', vCpus:   2, memoryGb: 16 },
  { name: 'n4a-highmem-4',    series: 'N4A', family: 'General purpose', vCpus:   4, memoryGb: 32 },
  { name: 'n4a-highmem-8',    series: 'N4A', family: 'General purpose', vCpus:   8, memoryGb: 64 },
  { name: 'n4a-highmem-16',   series: 'N4A', family: 'General purpose', vCpus:  16, memoryGb: 128 },
  { name: 'n4a-highmem-32',   series: 'N4A', family: 'General purpose', vCpus:  32, memoryGb: 256 },
  { name: 'n4a-highmem-48',   series: 'N4A', family: 'General purpose', vCpus:  48, memoryGb: 384 },
  { name: 'n4a-highmem-64',   series: 'N4A', family: 'General purpose', vCpus:  64, memoryGb: 512 },
  // --- N4D (General purpose) — 27 types from the Compute Engine API ---
  { name: 'n4d-standard-2',   series: 'N4D', family: 'General purpose', vCpus:   2, memoryGb: 8 },
  { name: 'n4d-standard-4',   series: 'N4D', family: 'General purpose', vCpus:   4, memoryGb: 16 },
  { name: 'n4d-standard-8',   series: 'N4D', family: 'General purpose', vCpus:   8, memoryGb: 32 },
  { name: 'n4d-standard-16',  series: 'N4D', family: 'General purpose', vCpus:  16, memoryGb: 64 },
  { name: 'n4d-standard-32',  series: 'N4D', family: 'General purpose', vCpus:  32, memoryGb: 128 },
  { name: 'n4d-standard-48',  series: 'N4D', family: 'General purpose', vCpus:  48, memoryGb: 192 },
  { name: 'n4d-standard-64',  series: 'N4D', family: 'General purpose', vCpus:  64, memoryGb: 256 },
  { name: 'n4d-standard-80',  series: 'N4D', family: 'General purpose', vCpus:  80, memoryGb: 320 },
  { name: 'n4d-standard-96',  series: 'N4D', family: 'General purpose', vCpus:  96, memoryGb: 384 },
  { name: 'n4d-highcpu-2',    series: 'N4D', family: 'General purpose', vCpus:   2, memoryGb: 4 },
  { name: 'n4d-highcpu-4',    series: 'N4D', family: 'General purpose', vCpus:   4, memoryGb: 8 },
  { name: 'n4d-highcpu-8',    series: 'N4D', family: 'General purpose', vCpus:   8, memoryGb: 16 },
  { name: 'n4d-highcpu-16',   series: 'N4D', family: 'General purpose', vCpus:  16, memoryGb: 32 },
  { name: 'n4d-highcpu-32',   series: 'N4D', family: 'General purpose', vCpus:  32, memoryGb: 64 },
  { name: 'n4d-highcpu-48',   series: 'N4D', family: 'General purpose', vCpus:  48, memoryGb: 96 },
  { name: 'n4d-highcpu-64',   series: 'N4D', family: 'General purpose', vCpus:  64, memoryGb: 128 },
  { name: 'n4d-highcpu-80',   series: 'N4D', family: 'General purpose', vCpus:  80, memoryGb: 160 },
  { name: 'n4d-highcpu-96',   series: 'N4D', family: 'General purpose', vCpus:  96, memoryGb: 192 },
  { name: 'n4d-highmem-2',    series: 'N4D', family: 'General purpose', vCpus:   2, memoryGb: 16 },
  { name: 'n4d-highmem-4',    series: 'N4D', family: 'General purpose', vCpus:   4, memoryGb: 32 },
  { name: 'n4d-highmem-8',    series: 'N4D', family: 'General purpose', vCpus:   8, memoryGb: 64 },
  { name: 'n4d-highmem-16',   series: 'N4D', family: 'General purpose', vCpus:  16, memoryGb: 128 },
  { name: 'n4d-highmem-32',   series: 'N4D', family: 'General purpose', vCpus:  32, memoryGb: 256 },
  { name: 'n4d-highmem-48',   series: 'N4D', family: 'General purpose', vCpus:  48, memoryGb: 384 },
  { name: 'n4d-highmem-64',   series: 'N4D', family: 'General purpose', vCpus:  64, memoryGb: 512 },
  { name: 'n4d-highmem-80',   series: 'N4D', family: 'General purpose', vCpus:  80, memoryGb: 640 },
  { name: 'n4d-highmem-96',   series: 'N4D', family: 'General purpose', vCpus:  96, memoryGb: 768 },
  // --- Z3 (Storage optimized) — 14 types from the Compute Engine API ---
  { name: 'z3-highmem-14-standardlssd',     series: 'Z3', family: 'Storage optimized', vCpus:  14, memoryGb: 112 },
  { name: 'z3-highmem-22-standardlssd',     series: 'Z3', family: 'Storage optimized', vCpus:  22, memoryGb: 176 },
  { name: 'z3-highmem-44-standardlssd',     series: 'Z3', family: 'Storage optimized', vCpus:  44, memoryGb: 352 },
  { name: 'z3-highmem-88-standardlssd',     series: 'Z3', family: 'Storage optimized', vCpus:  88, memoryGb: 704 },
  { name: 'z3-highmem-176-standardlssd',    series: 'Z3', family: 'Storage optimized', vCpus: 176, memoryGb: 1408 },
  { name: 'z3-highmem-8-highlssd',          series: 'Z3', family: 'Storage optimized', vCpus:   8, memoryGb: 64 },
  { name: 'z3-highmem-16-highlssd',         series: 'Z3', family: 'Storage optimized', vCpus:  16, memoryGb: 128 },
  { name: 'z3-highmem-22-highlssd',         series: 'Z3', family: 'Storage optimized', vCpus:  22, memoryGb: 176 },
  { name: 'z3-highmem-32-highlssd',         series: 'Z3', family: 'Storage optimized', vCpus:  32, memoryGb: 256 },
  { name: 'z3-highmem-44-highlssd',         series: 'Z3', family: 'Storage optimized', vCpus:  44, memoryGb: 352 },
  { name: 'z3-highmem-88',                  series: 'Z3', family: 'Storage optimized', vCpus:  88, memoryGb: 704 },
  { name: 'z3-highmem-88-highlssd',         series: 'Z3', family: 'Storage optimized', vCpus:  88, memoryGb: 704 },
  { name: 'z3-highmem-176',                 series: 'Z3', family: 'Storage optimized', vCpus: 176, memoryGb: 1408 },
  { name: 'z3-highmem-192-highlssd-metal',  series: 'Z3', family: 'Storage optimized', vCpus: 192, memoryGb: 1536 },
  // --- Z4D (Storage optimized) — 14 types from the Compute Engine API ---
  { name: 'z4d-highmem-16-standardlssd',   series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus:  16, memoryGb: 126 },
  { name: 'z4d-highmem-32-standardlssd',   series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus:  32, memoryGb: 252 },
  { name: 'z4d-highmem-48-standardlssd',   series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus:  48, memoryGb: 378 },
  { name: 'z4d-highmem-64-standardlssd',   series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus:  64, memoryGb: 504 },
  { name: 'z4d-highmem-96-standardlssd',   series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus:  96, memoryGb: 756 },
  { name: 'z4d-highmem-192-standardlssd',  series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus: 192, memoryGb: 1512 },
  { name: 'z4d-highmem-384-standardlssd',  series: 'Z4DStandardLssd', family: 'Storage optimized', vCpus: 384, memoryGb: 3024 },
  { name: 'z4d-highmem-8-highlssd',        series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:   8, memoryGb: 63 },
  { name: 'z4d-highmem-16-highlssd',       series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:  16, memoryGb: 126 },
  { name: 'z4d-highmem-32-highlssd',       series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:  32, memoryGb: 252 },
  { name: 'z4d-highmem-48-highlssd',       series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:  48, memoryGb: 378 },
  { name: 'z4d-highmem-64-highlssd',       series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:  64, memoryGb: 504 },
  { name: 'z4d-highmem-96-highlssd',       series: 'Z4DHighLssd', family: 'Storage optimized', vCpus:  96, memoryGb: 756 },
  { name: 'z4d-highmem-192-highlssd',      series: 'Z4DHighLssd', family: 'Storage optimized', vCpus: 192, memoryGb: 1512 },
  // --- M2 (Memory optimized) — 6 types from the Compute Engine API, 4 already defined ---
  { name: 'm2-ultramem2x-96',  series: 'M2', family: 'Memory optimized', vCpus:  96, memoryGb: 1250 },
  { name: 'm2-ultramemx-96',   series: 'M2', family: 'Memory optimized', vCpus:  96, memoryGb: 600 },
  // --- M4 (Memory optimized) — 10 types from the Compute Engine API ---
  { name: 'm4-ultramem-56',   series: 'M4', family: 'Memory optimized', vCpus:  56, memoryGb: 1488 },
  { name: 'm4-ultramem-112',  series: 'M4', family: 'Memory optimized', vCpus: 112, memoryGb: 2976 },
  { name: 'm4-ultramem-224',  series: 'M4', family: 'Memory optimized', vCpus: 224, memoryGb: 5952 },
  { name: 'm4-megamem-28',    series: 'M4', family: 'Memory optimized', vCpus:  28, memoryGb: 372 },
  { name: 'm4-megamem-56',    series: 'M4', family: 'Memory optimized', vCpus:  56, memoryGb: 744 },
  { name: 'm4-megamem-112',   series: 'M4', family: 'Memory optimized', vCpus: 112, memoryGb: 1488 },
  { name: 'm4-megamem-224',   series: 'M4', family: 'Memory optimized', vCpus: 224, memoryGb: 2976 },
  { name: 'm4-hypermem-16',   series: 'M4', family: 'Memory optimized', vCpus:  16, memoryGb: 248 },
  { name: 'm4-hypermem-32',   series: 'M4', family: 'Memory optimized', vCpus:  32, memoryGb: 496 },
  { name: 'm4-hypermem-64',   series: 'M4', family: 'Memory optimized', vCpus:  64, memoryGb: 992 },
  // --- M4N (Memory optimized) — 10 types from the Compute Engine API ---
  { name: 'm4n-ultramem-56',   series: 'M4N', family: 'Memory optimized', vCpus:  56, memoryGb: 1488 },
  { name: 'm4n-ultramem-112',  series: 'M4N', family: 'Memory optimized', vCpus: 112, memoryGb: 2976 },
  { name: 'm4n-ultramem-224',  series: 'M4N', family: 'Memory optimized', vCpus: 224, memoryGb: 5952 },
  { name: 'm4n-megamem-28',    series: 'M4N', family: 'Memory optimized', vCpus:  28, memoryGb: 372 },
  { name: 'm4n-megamem-56',    series: 'M4N', family: 'Memory optimized', vCpus:  56, memoryGb: 744 },
  { name: 'm4n-megamem-112',   series: 'M4N', family: 'Memory optimized', vCpus: 112, memoryGb: 1488 },
  { name: 'm4n-megamem-224',   series: 'M4N', family: 'Memory optimized', vCpus: 224, memoryGb: 2976 },
  { name: 'm4n-hypermem-16',   series: 'M4N', family: 'Memory optimized', vCpus:  16, memoryGb: 248 },
  { name: 'm4n-hypermem-32',   series: 'M4N', family: 'Memory optimized', vCpus:  32, memoryGb: 496 },
  { name: 'm4n-hypermem-64',   series: 'M4N', family: 'Memory optimized', vCpus:  64, memoryGb: 992 },
  // --- X4 (Memory optimized) — 9 types from the Compute Engine API ---
  { name: 'x4-megamem-960-metal',   series: 'X4', family: 'Memory optimized', vCpus: 960, memoryGb: 16384 },
  { name: 'x4-megamem-1440-metal',  series: 'X4', family: 'Memory optimized', vCpus: 1440, memoryGb: 24576 },
  { name: 'x4-megamem-1920-metal',  series: 'X4', family: 'Memory optimized', vCpus: 1920, memoryGb: 32768 },
  { name: 'x4-480-6t-metal',        series: 'X4', family: 'Memory optimized', vCpus: 480, memoryGb: 6144 },
  { name: 'x4-480-8t-metal',        series: 'X4', family: 'Memory optimized', vCpus: 480, memoryGb: 8192 },
  { name: 'x4-960-12t-metal',       series: 'X4', family: 'Memory optimized', vCpus: 960, memoryGb: 12288 },
  { name: 'x4-960-16t-metal',       series: 'X4', family: 'Memory optimized', vCpus: 960, memoryGb: 16384 },
  { name: 'x4-1440-24t-metal',      series: 'X4', family: 'Memory optimized', vCpus: 1440, memoryGb: 24576 },
  { name: 'x4-1920-32t-metal',      series: 'X4', family: 'Memory optimized', vCpus: 1920, memoryGb: 32768 },
  // --- G4 (Accelerator optimized) — 7 types from the Compute Engine API ---
  { name: 'g4-standard-6',    series: 'G4', family: 'Accelerator optimized', vCpus:   6, memoryGb: 22 , gpuCount: 1 },
  { name: 'g4-standard-12',   series: 'G4', family: 'Accelerator optimized', vCpus:  12, memoryGb: 45 , gpuCount: 1 },
  { name: 'g4-standard-24',   series: 'G4', family: 'Accelerator optimized', vCpus:  24, memoryGb: 90 , gpuCount: 1 },
  { name: 'g4-standard-48',   series: 'G4', family: 'Accelerator optimized', vCpus:  48, memoryGb: 180 , gpuCount: 1 },
  { name: 'g4-standard-96',   series: 'G4', family: 'Accelerator optimized', vCpus:  96, memoryGb: 360 , gpuCount: 2 },
  { name: 'g4-standard-192',  series: 'G4', family: 'Accelerator optimized', vCpus: 192, memoryGb: 720 , gpuCount: 4 },
  { name: 'g4-standard-384',  series: 'G4', family: 'Accelerator optimized', vCpus: 384, memoryGb: 1440 , gpuCount: 8 },
  // --- H4D (High performance computing) — 3 types from the Compute Engine API ---
  { name: 'h4d-standard-192',      series: 'H4D', family: 'High performance computing', vCpus: 192, memoryGb: 720 },
  { name: 'h4d-highmem-192',       series: 'H4D', family: 'High performance computing', vCpus: 192, memoryGb: 1488 },
  { name: 'h4d-highmem-192-lssd',  series: 'H4D', family: 'High performance computing', vCpus: 192, memoryGb: 1488 },
  // --- A4 (Accelerator optimized) — 1 types from the Compute Engine API ---
  { name: 'a4-highgpu-8g',  series: 'A4', family: 'Accelerator optimized', vCpus: 224, memoryGb: 3968 , gpuCount: 8 },
  // --- A4X (Accelerator optimized) — 2 types from the Compute Engine API ---
  { name: 'a4x-maxgpu-4g-metal',  series: 'A4X', family: 'Accelerator optimized', vCpus: 144, memoryGb: 960 , gpuCount: 4 },
  { name: 'a4x-highgpu-4g',       series: 'A4X', family: 'Accelerator optimized', vCpus: 140, memoryGb: 884 , gpuCount: 4 },
]

// Index by name for fast lookup
export const MACHINE_TYPE_MAP = new Map(MACHINE_TYPES.map((m) => [m.name, m]))

/**
 * Linux CoreMark benchmark scores, keyed by machine type name.
 *
 * Source: Google Cloud, "CoreMark scores of VM instances by family"
 *   https://cloud.google.com/compute/docs/coremark-scores-of-vm-instances?hl=ko
 *
 * Each score is the aggregate multi-threaded CoreMark result measured by Google
 * with PerfKitBenchmarker on ubuntu2204, running threads equal to the machine
 * type's vCPU count. Scores therefore scale with vCPUs and compare total
 * throughput, not per-core performance. The CPU platform noted per group is the
 * one Google benchmarked on; the same machine type can land on a newer platform.
 *
 * IMPORTANT: Google retired these tables from the ENGLISH page in early 2026 —
 * it now only documents how to run PerfKitBenchmarker yourself and directs you
 * to your account team to ask about scores. Three localized versions still
 * serve the full tables and are the live source for this data:
 *
 *   ?hl=ko   ?hl=ja   ?hl=zh-cn
 *
 * All three were cross-checked against each other and against the last English
 * revision (2025-12-05 Internet Archive snapshot): 228 machine types, zero
 * disagreements on any value. Note the URL above is the Korean page on purpose;
 * dropping ?hl= returns the English page, which no longer has the data.
 *
 * These localized pages could be trimmed to match English at any time, so treat
 * this map as the source of truth and re-check before assuming a refresh is
 * possible. Machine types released after the last benchmark run (C4, A3, the
 * newer A2 GPU shapes, shared-core E2) have no published score and are absent.
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
  'n4-highcpu-80': 1651766,

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
  'g1-small': 10191,
}

