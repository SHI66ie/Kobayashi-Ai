/**
 * Hybrid Data Storage Service
 * Supports both traditional (AWS) and blockchain storage backends
 * Provides seamless migration and fallback capabilities
 */

import { fetchRaceData as fetchFromAWS, isAWSConfigured } from './aws-data'
import { fetchRaceData as fetchFromBlockchain, storeRaceData, isBlockchainStorageConfigured } from './blockchain-data'

interface StorageBackend {
  type: 'aws' | 'blockchain'
  configured: boolean
  priority: number
}

interface HybridConfig {
  primaryBackend: 'aws' | 'blockchain'
  fallbackEnabled: boolean
  syncEnabled: boolean
  migrationMode: boolean
}

// Get hybrid storage configuration
function getHybridConfig(): HybridConfig {
  const primaryBackend = (process.env.STORAGE_PRIMARY || 'blockchain') as 'aws' | 'blockchain'
  const fallbackEnabled = process.env.STORAGE_FALLBACK_ENABLED !== 'false'
  const syncEnabled = process.env.STORAGE_SYNC_ENABLED === 'true'
  const migrationMode = process.env.STORAGE_MIGRATION_MODE === 'true'

  console.log('🔄 Hybrid Storage Configuration:')
  console.log('  - Primary Backend:', primaryBackend)
  console.log('  - Fallback Enabled:', fallbackEnabled)
  console.log('  - Sync Enabled:', syncEnabled)
  console.log('  - Migration Mode:', migrationMode)

  return {
    primaryBackend,
    fallbackEnabled,
    syncEnabled,
    migrationMode
  }
}

/**
 * Get available storage backends with priority
 */
function getStorageBackends(): StorageBackend[] {
  const backends: StorageBackend[] = []

  if (isAWSConfigured()) {
    backends.push({
      type: 'aws',
      configured: true,
      priority: process.env.STORAGE_PRIMARY === 'aws' ? 1 : 2
    })
  }

  if (isBlockchainStorageConfigured()) {
    backends.push({
      type: 'blockchain',
      configured: true,
      priority: process.env.STORAGE_PRIMARY === 'blockchain' ? 1 : 2
    })
  }

  // Sort by priority (lower number = higher priority)
  return backends.sort((a, b) => a.priority - b.priority)
}

/**
 * Fetch F1 race data using hybrid storage strategy
 */
export async function fetchRaceDataHybrid(track: string, filename: string): Promise<any> {
  const config = getHybridConfig()
  const backends = getStorageBackends()

  console.log(`🔍 Fetching ${filename} for track ${track} using hybrid storage`)

  for (const backend of backends) {
    try {
      console.log(`📡 Trying ${backend.type} backend...`)
      
      let data
      if (backend.type === 'aws') {
        data = await fetchFromAWS(track, filename)
      } else {
        data = await fetchFromBlockchain(track, filename)
      }

      if (data) {
        console.log(`✅ Successfully fetched from ${backend.type} backend`)
        
        // If sync is enabled and this is not the primary backend, sync the data
        if (config.syncEnabled && backend.type !== config.primaryBackend) {
          await syncDataToPrimary(track, filename, data, config.primaryBackend)
        }

        return data
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${backend.type} backend:`, error)
      
      // If fallback is disabled, don't try other backends
      if (!config.fallbackEnabled) {
        break
      }
    }
  }

  console.error(`❌ Failed to fetch ${filename} from all available backends`)
  return null
}

/**
 * Store F1 race data using hybrid storage strategy
 */
export async function storeRaceDataHybrid(track: string, filename: string, data: any): Promise<boolean> {
  const config = getHybridConfig()
  const backends = getStorageBackends()

  console.log(`💾 Storing ${filename} for track ${track} using hybrid storage`)

  let success = false
  let primaryBackendSuccess = false

  // Try to store on primary backend first
  const primaryBackend = backends.find(b => b.type === config.primaryBackend)
  if (primaryBackend) {
    try {
      if (primaryBackend.type === 'blockchain') {
        const result = await storeRaceData(track, filename, data)
        primaryBackendSuccess = result.success
      } else {
        // AWS storage would be implemented here
        console.log('📝 AWS storage not implemented for write operations')
        primaryBackendSuccess = false
      }

      if (primaryBackendSuccess) {
        console.log(`✅ Successfully stored on primary backend (${config.primaryBackend})`)
        success = true
      }
    } catch (error) {
      console.error(`❌ Failed to store on primary backend (${config.primaryBackend}):`, error)
    }
  }

  // If sync is enabled, store on secondary backends too
  if (config.syncEnabled && primaryBackendSuccess) {
    const secondaryBackends = backends.filter(b => b.type !== config.primaryBackend)
    
    for (const backend of secondaryBackends) {
      try {
        if (backend.type === 'blockchain') {
          await storeRaceData(track, filename, data)
        } else {
          console.log('📝 AWS storage not implemented for write operations')
        }
        console.log(`✅ Successfully synced to secondary backend (${backend.type})`)
      } catch (error) {
        console.warn(`⚠️ Failed to sync to secondary backend (${backend.type}):`, error)
      }
    }
  }

  return success
}

/**
 * Sync data from one backend to another
 */
async function syncDataToPrimary(track: string, filename: string, data: any, primaryBackend: 'aws' | 'blockchain'): Promise<void> {
  try {
    console.log(`🔄 Syncing ${filename} to primary backend (${primaryBackend})`)
    
    if (primaryBackend === 'blockchain') {
      await storeRaceData(track, filename, data)
      console.log(`✅ Successfully synced to blockchain storage`)
    } else {
      console.log('📝 AWS storage sync not implemented')
    }
  } catch (error) {
    console.warn(`⚠️ Failed to sync data to primary backend:`, error)
  }
}

/**
 * Migrate data from AWS to blockchain storage
 */
export async function migrateDataToBlockchain(track: string, filenames: string[]): Promise<{
  migrated: string[]
  failed: string[]
  total: number
}> {
  const config = getHybridConfig()
  const results = {
    migrated: [] as string[],
    failed: [] as string[],
    total: filenames.length
  }

  console.log(`🚀 Starting migration of ${filenames.length} files for track ${track} to blockchain storage`)

  for (const filename of filenames) {
    try {
      // Fetch from AWS
      const awsData = await fetchFromAWS(track, filename)
      if (!awsData) {
        console.warn(`⚠️ File ${filename} not found in AWS storage`)
        results.failed.push(filename)
        continue
      }

      // Store on blockchain
      const blockchainResult = await storeRaceData(track, filename, awsData)
      if (blockchainResult.success) {
        console.log(`✅ Migrated ${filename} to blockchain storage (CID: ${blockchainResult.cid})`)
        results.migrated.push(filename)
      } else {
        console.error(`❌ Failed to migrate ${filename} to blockchain storage: ${blockchainResult.error}`)
        results.failed.push(filename)
      }
    } catch (error) {
      console.error(`❌ Error migrating ${filename}:`, error)
      results.failed.push(filename)
    }
  }

  console.log(`📊 Migration complete: ${results.migrated.length}/${results.total} files migrated successfully`)
  return results
}

/**
 * Get hybrid storage status and configuration
 */
export function getHybridStorageStatus(): {
  configured: boolean
  primaryBackend: string
  availableBackends: string[]
  fallbackEnabled: boolean
  syncEnabled: boolean
  migrationMode: boolean
} {
  const config = getHybridConfig()
  const backends = getStorageBackends()

  return {
    configured: backends.length > 0,
    primaryBackend: config.primaryBackend,
    availableBackends: backends.map(b => b.type),
    fallbackEnabled: config.fallbackEnabled,
    syncEnabled: config.syncEnabled,
    migrationMode: config.migrationMode
  }
}

/**
 * Test connectivity to all configured backends
 */
export async function testStorageBackends(): Promise<{
  aws: { configured: boolean; connected: boolean; error?: string }
  blockchain: { configured: boolean; connected: boolean; error?: string }
}> {
  const results = {
    aws: { configured: false, connected: false, error: undefined as string | undefined },
    blockchain: { configured: false, connected: false, error: undefined as string | undefined }
  }

  // Test AWS
  results.aws.configured = isAWSConfigured()
  if (results.aws.configured) {
    try {
      // Try to fetch a small test file
      await fetchFromAWS('test', 'connectivity-test.json')
      results.aws.connected = true
    } catch (error) {
      results.aws.connected = false
      results.aws.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // Test Blockchain
  results.blockchain.configured = isBlockchainStorageConfigured()
  if (results.blockchain.configured) {
    try {
      // Try to fetch a small test file
      await fetchFromBlockchain('test', 'connectivity-test.json')
      results.blockchain.connected = true
    } catch (error) {
      results.blockchain.connected = false
      results.blockchain.error = error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return results
}
