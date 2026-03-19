export interface CloudSqlMachineType {
  name: string
  series: string    // "N1", "N2"
  tier: string      // "standard", "highmem", "micro", "small"
  vCpus: number | 'shared'
  memoryGb: number
}

export const CLOUDSQL_MACHINE_TYPES: CloudSqlMachineType[] = [
  // Shared-core legacy instances
  { name: 'db-f1-micro',       series: 'N1', tier: 'micro',    vCpus: 'shared', memoryGb: 0.6 },
  { name: 'db-g1-small',       series: 'N1', tier: 'small',    vCpus: 'shared', memoryGb: 1.7 },

  // N1 Standard
  { name: 'db-n1-standard-1',  series: 'N1', tier: 'standard', vCpus: 1,  memoryGb: 3.75 },
  { name: 'db-n1-standard-2',  series: 'N1', tier: 'standard', vCpus: 2,  memoryGb: 7.5 },
  { name: 'db-n1-standard-4',  series: 'N1', tier: 'standard', vCpus: 4,  memoryGb: 15 },
  { name: 'db-n1-standard-8',  series: 'N1', tier: 'standard', vCpus: 8,  memoryGb: 30 },
  { name: 'db-n1-standard-16', series: 'N1', tier: 'standard', vCpus: 16, memoryGb: 60 },
  { name: 'db-n1-standard-32', series: 'N1', tier: 'standard', vCpus: 32, memoryGb: 120 },
  { name: 'db-n1-standard-64', series: 'N1', tier: 'standard', vCpus: 64, memoryGb: 240 },
  { name: 'db-n1-standard-96', series: 'N1', tier: 'standard', vCpus: 96, memoryGb: 360 },

  // N1 Highmem
  { name: 'db-n1-highmem-2',   series: 'N1', tier: 'highmem', vCpus: 2,  memoryGb: 13 },
  { name: 'db-n1-highmem-4',   series: 'N1', tier: 'highmem', vCpus: 4,  memoryGb: 26 },
  { name: 'db-n1-highmem-8',   series: 'N1', tier: 'highmem', vCpus: 8,  memoryGb: 52 },
  { name: 'db-n1-highmem-16',  series: 'N1', tier: 'highmem', vCpus: 16, memoryGb: 104 },
  { name: 'db-n1-highmem-32',  series: 'N1', tier: 'highmem', vCpus: 32, memoryGb: 208 },
  { name: 'db-n1-highmem-64',  series: 'N1', tier: 'highmem', vCpus: 64, memoryGb: 416 },
  { name: 'db-n1-highmem-96',  series: 'N1', tier: 'highmem', vCpus: 96, memoryGb: 624 },

  // N2 Standard
  { name: 'db-n2-standard-2',  series: 'N2', tier: 'standard', vCpus: 2,  memoryGb: 8 },
  { name: 'db-n2-standard-4',  series: 'N2', tier: 'standard', vCpus: 4,  memoryGb: 16 },
  { name: 'db-n2-standard-8',  series: 'N2', tier: 'standard', vCpus: 8,  memoryGb: 32 },
  { name: 'db-n2-standard-16', series: 'N2', tier: 'standard', vCpus: 16, memoryGb: 64 },
  { name: 'db-n2-standard-32', series: 'N2', tier: 'standard', vCpus: 32, memoryGb: 128 },
  { name: 'db-n2-standard-48', series: 'N2', tier: 'standard', vCpus: 48, memoryGb: 192 },
  { name: 'db-n2-standard-64', series: 'N2', tier: 'standard', vCpus: 64, memoryGb: 256 },
  { name: 'db-n2-standard-80', series: 'N2', tier: 'standard', vCpus: 80, memoryGb: 320 },

  // N2 Highmem
  { name: 'db-n2-highmem-2',   series: 'N2', tier: 'highmem', vCpus: 2,  memoryGb: 16 },
  { name: 'db-n2-highmem-4',   series: 'N2', tier: 'highmem', vCpus: 4,  memoryGb: 32 },
  { name: 'db-n2-highmem-8',   series: 'N2', tier: 'highmem', vCpus: 8,  memoryGb: 64 },
  { name: 'db-n2-highmem-16',  series: 'N2', tier: 'highmem', vCpus: 16, memoryGb: 128 },
  { name: 'db-n2-highmem-32',  series: 'N2', tier: 'highmem', vCpus: 32, memoryGb: 256 },
  { name: 'db-n2-highmem-48',  series: 'N2', tier: 'highmem', vCpus: 48, memoryGb: 384 },
  { name: 'db-n2-highmem-64',  series: 'N2', tier: 'highmem', vCpus: 64, memoryGb: 512 },
  { name: 'db-n2-highmem-80',  series: 'N2', tier: 'highmem', vCpus: 80, memoryGb: 640 },
]
