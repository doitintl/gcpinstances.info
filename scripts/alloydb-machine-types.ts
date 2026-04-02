export interface AlloyDbMachineType {
  name: string
  series: string    // 'N2', 'C4A', 'C4', 'Z3'
  tier: string      // 'highmem'
  vCpus: number
  memoryGb: number
}

export const ALLOYDB_MACHINE_TYPES: AlloyDbMachineType[] = [
  // N2 Highmem
  { name: 'n2-highmem-2',   series: 'N2',  tier: 'highmem', vCpus: 2,   memoryGb: 16 },
  { name: 'n2-highmem-4',   series: 'N2',  tier: 'highmem', vCpus: 4,   memoryGb: 32 },
  { name: 'n2-highmem-8',   series: 'N2',  tier: 'highmem', vCpus: 8,   memoryGb: 64 },
  { name: 'n2-highmem-16',  series: 'N2',  tier: 'highmem', vCpus: 16,  memoryGb: 128 },
  { name: 'n2-highmem-32',  series: 'N2',  tier: 'highmem', vCpus: 32,  memoryGb: 256 },
  { name: 'n2-highmem-64',  series: 'N2',  tier: 'highmem', vCpus: 64,  memoryGb: 512 },
  { name: 'n2-highmem-96',  series: 'N2',  tier: 'highmem', vCpus: 96,  memoryGb: 768 },
  { name: 'n2-highmem-128', series: 'N2',  tier: 'highmem', vCpus: 128, memoryGb: 864 },

  // C4A Highmem LSSD (Axion ARM)
  { name: 'c4a-highmem-1',       series: 'C4A', tier: 'highmem', vCpus: 1,   memoryGb: 8 },
  { name: 'c4a-highmem-2-lssd',  series: 'C4A', tier: 'highmem', vCpus: 2,   memoryGb: 16 },
  { name: 'c4a-highmem-4-lssd',  series: 'C4A', tier: 'highmem', vCpus: 4,   memoryGb: 32 },
  { name: 'c4a-highmem-8-lssd',  series: 'C4A', tier: 'highmem', vCpus: 8,   memoryGb: 64 },
  { name: 'c4a-highmem-16-lssd', series: 'C4A', tier: 'highmem', vCpus: 16,  memoryGb: 128 },
  { name: 'c4a-highmem-32-lssd', series: 'C4A', tier: 'highmem', vCpus: 32,  memoryGb: 256 },
  { name: 'c4a-highmem-48-lssd', series: 'C4A', tier: 'highmem', vCpus: 48,  memoryGb: 384 },
  { name: 'c4a-highmem-64-lssd', series: 'C4A', tier: 'highmem', vCpus: 64,  memoryGb: 512 },
  { name: 'c4a-highmem-72-lssd', series: 'C4A', tier: 'highmem', vCpus: 72,  memoryGb: 576 },

  // C4 Highmem LSSD
  { name: 'c4-highmem-4-lssd',   series: 'C4', tier: 'highmem', vCpus: 4,   memoryGb: 32 },
  { name: 'c4-highmem-8-lssd',   series: 'C4', tier: 'highmem', vCpus: 8,   memoryGb: 64 },
  { name: 'c4-highmem-16-lssd',  series: 'C4', tier: 'highmem', vCpus: 16,  memoryGb: 128 },
  { name: 'c4-highmem-24-lssd',  series: 'C4', tier: 'highmem', vCpus: 24,  memoryGb: 192 },
  { name: 'c4-highmem-32-lssd',  series: 'C4', tier: 'highmem', vCpus: 32,  memoryGb: 256 },
  { name: 'c4-highmem-48-lssd',  series: 'C4', tier: 'highmem', vCpus: 48,  memoryGb: 384 },
  { name: 'c4-highmem-96-lssd',  series: 'C4', tier: 'highmem', vCpus: 96,  memoryGb: 768 },
  { name: 'c4-highmem-144-lssd', series: 'C4', tier: 'highmem', vCpus: 144, memoryGb: 1152 },
  { name: 'c4-highmem-192-lssd', series: 'C4', tier: 'highmem', vCpus: 192, memoryGb: 1536 },
  { name: 'c4-highmem-288-lssd', series: 'C4', tier: 'highmem', vCpus: 288, memoryGb: 2304 },

  // Z3 Highmem Standard LSSD
  { name: 'z3-highmem-14-standardlssd', series: 'Z3', tier: 'highmem', vCpus: 14,  memoryGb: 112 },
  { name: 'z3-highmem-22-standardlssd', series: 'Z3', tier: 'highmem', vCpus: 22,  memoryGb: 176 },
  { name: 'z3-highmem-44-standardlssd', series: 'Z3', tier: 'highmem', vCpus: 44,  memoryGb: 352 },
  { name: 'z3-highmem-88-standardlssd', series: 'Z3', tier: 'highmem', vCpus: 88,  memoryGb: 704 },

  // Z3 Highmem High LSSD
  { name: 'z3-highmem-8-highlssd',  series: 'Z3', tier: 'highmem', vCpus: 8,  memoryGb: 64 },
  { name: 'z3-highmem-16-highlssd', series: 'Z3', tier: 'highmem', vCpus: 16, memoryGb: 128 },
  { name: 'z3-highmem-22-highlssd', series: 'Z3', tier: 'highmem', vCpus: 22, memoryGb: 176 },
  { name: 'z3-highmem-32-highlssd', series: 'Z3', tier: 'highmem', vCpus: 32, memoryGb: 256 },
  { name: 'z3-highmem-44-highlssd', series: 'Z3', tier: 'highmem', vCpus: 44, memoryGb: 352 },
]
