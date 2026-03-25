export interface CloudSqlMachineType {
  name: string
  series: string    // "N1", "N2", "N4", "C4A"
  tier: string      // "standard", "highmem", "micro", "small"
  edition: 'Enterprise' | 'Enterprise Plus'
  vCpus: number | 'shared'
  memoryGb: number
}

export const CLOUDSQL_MACHINE_TYPES: CloudSqlMachineType[] = [
  // ---- Enterprise edition ----

  // N1 Standard
  { name: 'db-n1-standard-1',  series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 1,  memoryGb: 3.75 },
  { name: 'db-n1-standard-2',  series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 2,  memoryGb: 7.5 },
  { name: 'db-n1-standard-4',  series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 4,  memoryGb: 15 },
  { name: 'db-n1-standard-8',  series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 8,  memoryGb: 30 },
  { name: 'db-n1-standard-16', series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 16, memoryGb: 60 },
  { name: 'db-n1-standard-32', series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 32, memoryGb: 120 },
  { name: 'db-n1-standard-64', series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 64, memoryGb: 240 },
  { name: 'db-n1-standard-96', series: 'N1', tier: 'standard', edition: 'Enterprise', vCpus: 96, memoryGb: 360 },

  // N1 Highmem
  { name: 'db-n1-highmem-2',   series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 2,  memoryGb: 13 },
  { name: 'db-n1-highmem-4',   series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 4,  memoryGb: 26 },
  { name: 'db-n1-highmem-8',   series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 8,  memoryGb: 52 },
  { name: 'db-n1-highmem-16',  series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 16, memoryGb: 104 },
  { name: 'db-n1-highmem-32',  series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 32, memoryGb: 208 },
  { name: 'db-n1-highmem-64',  series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 64, memoryGb: 416 },
  { name: 'db-n1-highmem-96',  series: 'N1', tier: 'highmem', edition: 'Enterprise', vCpus: 96, memoryGb: 624 },

  // N2 Standard
  { name: 'db-n2-standard-2',  series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 2,  memoryGb: 8 },
  { name: 'db-n2-standard-4',  series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 4,  memoryGb: 16 },
  { name: 'db-n2-standard-8',  series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 8,  memoryGb: 32 },
  { name: 'db-n2-standard-16', series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 16, memoryGb: 64 },
  { name: 'db-n2-standard-32', series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 32, memoryGb: 128 },
  { name: 'db-n2-standard-48', series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 48, memoryGb: 192 },
  { name: 'db-n2-standard-64', series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 64, memoryGb: 256 },
  { name: 'db-n2-standard-80', series: 'N2', tier: 'standard', edition: 'Enterprise', vCpus: 80, memoryGb: 320 },

  // N2 Highmem
  { name: 'db-n2-highmem-2',   series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 2,  memoryGb: 16 },
  { name: 'db-n2-highmem-4',   series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 4,  memoryGb: 32 },
  { name: 'db-n2-highmem-8',   series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 8,  memoryGb: 64 },
  { name: 'db-n2-highmem-16',  series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 16, memoryGb: 128 },
  { name: 'db-n2-highmem-32',  series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 32, memoryGb: 256 },
  { name: 'db-n2-highmem-48',  series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 48, memoryGb: 384 },
  { name: 'db-n2-highmem-64',  series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 64, memoryGb: 512 },
  { name: 'db-n2-highmem-80',  series: 'N2', tier: 'highmem', edition: 'Enterprise', vCpus: 80, memoryGb: 640 },

  // ---- Enterprise Plus edition ----

  // N4-based (db-perf-optimized-N-*), 8 GB/vCPU
  { name: 'db-perf-optimized-N-2',   series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 2,   memoryGb: 16 },
  { name: 'db-perf-optimized-N-4',   series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 4,   memoryGb: 32 },
  { name: 'db-perf-optimized-N-8',   series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 8,   memoryGb: 64 },
  { name: 'db-perf-optimized-N-16',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 16,  memoryGb: 128 },
  { name: 'db-perf-optimized-N-32',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 32,  memoryGb: 256 },
  { name: 'db-perf-optimized-N-48',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 48,  memoryGb: 384 },
  { name: 'db-perf-optimized-N-64',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 64,  memoryGb: 512 },
  { name: 'db-perf-optimized-N-80',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 80,  memoryGb: 640 },
  { name: 'db-perf-optimized-N-96',  series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 96,  memoryGb: 768 },
  { name: 'db-perf-optimized-N-128', series: 'N4', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 128, memoryGb: 864 },

  // C4A-based (Google Axion / ARM), 8 GB/vCPU
  { name: 'db-c4a-highmem-2',  series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 2,  memoryGb: 16 },
  { name: 'db-c4a-highmem-4',  series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 4,  memoryGb: 32 },
  { name: 'db-c4a-highmem-8',  series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 8,  memoryGb: 64 },
  { name: 'db-c4a-highmem-16', series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 16, memoryGb: 128 },
  { name: 'db-c4a-highmem-32', series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 32, memoryGb: 256 },
  { name: 'db-c4a-highmem-48', series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 48, memoryGb: 384 },
  { name: 'db-c4a-highmem-64', series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 64, memoryGb: 512 },
  { name: 'db-c4a-highmem-72', series: 'C4A', tier: 'highmem', edition: 'Enterprise Plus', vCpus: 72, memoryGb: 576 },
]
