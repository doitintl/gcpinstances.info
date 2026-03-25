export interface MemorystoreMachineType {
  name: string
  product: 'Redis' | 'Redis Cluster' | 'Valkey'
  nodeType: string        // M1-M5 for capacity, or node type name for cluster
  capacityGb: number | null  // representative capacity for Redis standalone, null for nodes
  vCpus: number | 'shared' | null  // for cluster/valkey nodes
  memoryGb: number | null    // for cluster/valkey nodes
}

// Redis standalone capacity tiers (M1-M5)
// Pricing is per-GiB-per-hour — capacityGb here is a representative size for display
const REDIS_CAPACITY_TIERS: MemorystoreMachineType[] = [
  { name: 'redis-basic-m1',    product: 'Redis', nodeType: 'M1', capacityGb: 1,   vCpus: null, memoryGb: null },
  { name: 'redis-basic-m2',    product: 'Redis', nodeType: 'M2', capacityGb: 5,   vCpus: null, memoryGb: null },
  { name: 'redis-basic-m3',    product: 'Redis', nodeType: 'M3', capacityGb: 10,  vCpus: null, memoryGb: null },
  { name: 'redis-basic-m4',    product: 'Redis', nodeType: 'M4', capacityGb: 36,  vCpus: null, memoryGb: null },
  { name: 'redis-basic-m5',    product: 'Redis', nodeType: 'M5', capacityGb: 101, vCpus: null, memoryGb: null },
  { name: 'redis-standard-m1', product: 'Redis', nodeType: 'M1', capacityGb: 1,   vCpus: null, memoryGb: null },
  { name: 'redis-standard-m2', product: 'Redis', nodeType: 'M2', capacityGb: 5,   vCpus: null, memoryGb: null },
  { name: 'redis-standard-m3', product: 'Redis', nodeType: 'M3', capacityGb: 10,  vCpus: null, memoryGb: null },
  { name: 'redis-standard-m4', product: 'Redis', nodeType: 'M4', capacityGb: 36,  vCpus: null, memoryGb: null },
  { name: 'redis-standard-m5', product: 'Redis', nodeType: 'M5', capacityGb: 101, vCpus: null, memoryGb: null },
]

// Redis Cluster node types (per-node-per-hour)
const REDIS_CLUSTER_NODES: MemorystoreMachineType[] = [
  { name: 'redis-cluster-shared-core-nano', product: 'Redis Cluster', nodeType: 'Shared Core Nano', capacityGb: null, vCpus: 'shared', memoryGb: 1.5 },
  { name: 'redis-cluster-standard-small',   product: 'Redis Cluster', nodeType: 'Standard Small',   capacityGb: null, vCpus: 1,        memoryGb: 6.5 },
  { name: 'redis-cluster-default',          product: 'Redis Cluster', nodeType: 'Default',          capacityGb: null, vCpus: 2,        memoryGb: 13 },
  { name: 'redis-cluster-highmem-xlarge',   product: 'Redis Cluster', nodeType: 'Highmem XLarge',   capacityGb: null, vCpus: 16,       memoryGb: 208 },
]

// Valkey node types (per-node-per-hour)
const VALKEY_NODES: MemorystoreMachineType[] = [
  { name: 'valkey-shared-core-nano', product: 'Valkey', nodeType: 'Shared Core Nano', capacityGb: null, vCpus: 'shared', memoryGb: 1.5 },
  { name: 'valkey-standard-small',   product: 'Valkey', nodeType: 'Standard Small',   capacityGb: null, vCpus: 1,        memoryGb: 6.5 },
  { name: 'valkey-highmem-medium',   product: 'Valkey', nodeType: 'Highmem Medium',   capacityGb: null, vCpus: 4,        memoryGb: 52 },
  { name: 'valkey-highmem-xlarge',   product: 'Valkey', nodeType: 'Highmem XLarge',   capacityGb: null, vCpus: 16,       memoryGb: 208 },
]

export const MEMORYSTORE_MACHINE_TYPES: MemorystoreMachineType[] = [
  ...REDIS_CAPACITY_TIERS,
  ...REDIS_CLUSTER_NODES,
  ...VALKEY_NODES,
]

export const MEMORYSTORE_MACHINE_TYPE_MAP = new Map(
  MEMORYSTORE_MACHINE_TYPES.map((m) => [m.name, m]),
)
