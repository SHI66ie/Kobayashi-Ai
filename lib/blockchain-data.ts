/**
 * Blockchain Storage Integration for F1 Data
 * Supports IPFS, Filecoin, and Arweave storage backends
 */

interface StorageConfig {
  provider: 'ipfs' | 'filecoin' | 'arweave'
  endpoint?: string
  apiKey?: string
  network?: 'mainnet' | 'testnet'
}

interface StorageResult {
  success: boolean
  cid?: string
  url?: string
  error?: string
  provider: string
}

// Get blockchain storage configuration from environment
function getStorageConfig(): StorageConfig {
  const provider = (process.env.BLOCKCHAIN_STORAGE_PROVIDER || 'ipfs') as 'ipfs' | 'filecoin' | 'arweave'
  const endpoint = process.env.BLOCKCHAIN_STORAGE_ENDPOINT
  const apiKey = process.env.BLOCKCHAIN_STORAGE_API_KEY
  const network = (process.env.BLOCKCHAIN_NETWORK || 'mainnet') as 'mainnet' | 'testnet'

  console.log('🔗 Blockchain Storage Configuration:')
  console.log('  - Provider:', provider)
  console.log('  - Endpoint:', endpoint || '(default)')
  console.log('  - Network:', network)
  console.log('  - API Key:', apiKey ? '(configured)' : '(not set)')

  return {
    provider,
    endpoint,
    apiKey,
    network
  }
}

/**
 * Store F1 race data on blockchain storage
 */
export async function storeRaceData(track: string, filename: string, data: any): Promise<StorageResult> {
  const config = getStorageConfig()
  
  try {
    switch (config.provider) {
      case 'ipfs':
        return await storeOnIPFS(track, filename, data, config)
      case 'filecoin':
        return await storeOnFilecoin(track, filename, data, config)
      case 'arweave':
        return await storeOnArweave(track, filename, data, config)
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`)
    }
  } catch (error) {
    console.error(`❌ Error storing ${filename} on ${config.provider}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: config.provider
    }
  }
}

/**
 * Retrieve F1 race data from blockchain storage
 */
export async function fetchRaceData(track: string, filename: string): Promise<any> {
  const config = getStorageConfig()
  
  try {
    switch (config.provider) {
      case 'ipfs':
        return await fetchFromIPFS(track, filename, config)
      case 'filecoin':
        return await fetchFromFilecoin(track, filename, config)
      case 'arweave':
        return await fetchFromArweave(track, filename, config)
      default:
        throw new Error(`Unsupported storage provider: ${config.provider}`)
    }
  } catch (error) {
    console.error(`❌ Error fetching ${filename} from ${config.provider}:`, error)
    return null
  }
}

/**
 * IPFS Storage Implementation
 */
async function storeOnIPFS(track: string, filename: string, data: any, config: StorageConfig): Promise<StorageResult> {
  const endpoint = config.endpoint || 'https://api.pinata.cloud/pinning/pinFileToIPFS'
  
  if (!config.apiKey) {
    throw new Error('IPFS API key required (use Pinata, Infura, or similar service)')
  }

  // Create file with path structure
  const fileData = JSON.stringify(data)
  const file = new File([fileData], `${track}/${filename}`, { type: 'application/json' })

  const formData = new FormData()
  formData.append('file', file)
  
  // Add Pinata metadata for better organization
  formData.append('pinataMetadata', JSON.stringify({
    name: `F1 Data - ${track} - ${filename}`,
    keyvalues: {
      track,
      filename,
      dataType: 'f1-race-data',
      timestamp: new Date().toISOString()
    }
  }))

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.status}`)
  }

  const result = await response.json()
  const cid = result.IpfsHash

  console.log(`✅ Stored ${filename} on IPFS with CID: ${cid}`)

  return {
    success: true,
    cid,
    url: `https://gateway.pinata.cloud/ipfs/${cid}`,
    provider: 'ipfs'
  }
}

async function fetchFromIPFS(track: string, filename: string, config: StorageConfig): Promise<any> {
  // For IPFS, we need to know the CID beforehand
  // In production, you'd maintain a mapping of files to CIDs
  const endpoint = config.endpoint || 'https://gateway.pinata.cloud/ipfs/'
  
  // Try common gateways and CID patterns
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/'
  ]

  // For demo purposes, we'll search for the file using metadata
  // In production, maintain a database mapping filenames to CIDs
  const searchCid = await searchIPFSByMetadata(track, filename, config)
  if (!searchCid) {
    throw new Error(`File ${filename} for track ${track} not found on IPFS`)
  }

  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}${searchCid}`)
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Retrieved ${filename} from IPFS via ${gateway}`)
        return data
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${gateway}:`, error)
    }
  }

  throw new Error(`Failed to retrieve ${filename} from IPFS`)
}

/**
 * Filecoin Storage Implementation
 */
async function storeOnFilecoin(track: string, filename: string, data: any, config: StorageConfig): Promise<StorageResult> {
  // Filecoin storage typically goes through IPFS first, then deals are made
  // For simplicity, we'll use a Filecoin storage service API
  
  const endpoint = config.endpoint || 'https://api.filecoin.io/v1/storage'
  
  if (!config.apiKey) {
    throw new Error('Filecoin API key required')
  }

  const fileData = JSON.stringify(data)
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: fileData,
      name: `${track}/${filename}`,
      duration: '518400', // 6 months in blocks
      metadata: {
        track,
        filename,
        dataType: 'f1-race-data',
        timestamp: new Date().toISOString()
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Filecoin storage failed: ${response.status}`)
  }

  const result = await response.json()
  
  console.log(`✅ Stored ${filename} on Filecoin with deal ID: ${result.dealId}`)

  return {
    success: true,
    cid: result.cid,
    url: result.url,
    provider: 'filecoin'
  }
}

async function fetchFromFilecoin(track: string, filename: string, config: StorageConfig): Promise<any> {
  // Filecoin retrieval typically goes through IPFS gateways
  return await fetchFromIPFS(track, filename, config)
}

/**
 * Arweave Storage Implementation
 */
async function storeOnArweave(track: string, filename: string, data: any, config: StorageConfig): Promise<StorageResult> {
  const endpoint = config.endpoint || 'https://node2.arweave.org'
  
  const fileData = JSON.stringify(data)
  
  // Create Arweave transaction
  const transaction = {
    data: fileData,
    tags: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Track', value: track },
      { name: 'Filename', value: filename },
      { name: 'Data-Type', value: 'f1-race-data' },
      { name: 'Timestamp', value: new Date().toISOString() }
    ]
  }

  const response = await fetch(`${endpoint}/tx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction)
  })

  if (!response.ok) {
    throw new Error(`Arweave upload failed: ${response.status}`)
  }

  const result = await response.json()
  const txId = result.id

  console.log(`✅ Stored ${filename} on Arweave with transaction ID: ${txId}`)

  return {
    success: true,
    cid: txId,
    url: `https://arweave.net/${txId}`,
    provider: 'arweave'
  }
}

async function fetchFromArweave(track: string, filename: string, config: StorageConfig): Promise<any> {
  // Search for transaction by tags
  const endpoint = config.endpoint || 'https://node2.arweave.org'
  
  const searchQuery = `track="${track}" AND filename="${filename}"`
  
  const response = await fetch(`${endpoint}/arql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'Track',
          expr2: track
        },
        expr2: {
          op: 'equals',
          expr1: 'Filename',
          expr2: filename
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Arweave search failed: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.edges || result.edges.length === 0) {
    throw new Error(`File ${filename} for track ${track} not found on Arweave`)
  }

  const txId = result.edges[0].node.id
  
  // Fetch the actual data
  const dataResponse = await fetch(`https://arweave.net/${txId}`)
  if (!dataResponse.ok) {
    throw new Error(`Failed to fetch data from Arweave: ${dataResponse.status}`)
  }

  const data = await dataResponse.json()
  console.log(`✅ Retrieved ${filename} from Arweave`)
  
  return data
}

/**
 * Helper function to search IPFS by metadata (requires Pinata or similar service)
 */
async function searchIPFSByMetadata(track: string, filename: string, config: StorageConfig): Promise<string | null> {
  if (!config.apiKey) {
    return null
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/pinList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      }
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()
    const pins = result.rows || []

    // Find matching pin by metadata
    const matchingPin = pins.find((pin: any) => 
      pin.metadata?.keyvalues?.track === track && 
      pin.metadata?.keyvalues?.filename === filename
    )

    return matchingPin?.ipfs_pin_hash || null
  } catch (error) {
    console.warn('⚠️ Failed to search IPFS metadata:', error)
    return null
  }
}

/**
 * Check if blockchain storage is configured
 */
export function isBlockchainStorageConfigured(): boolean {
  const config = getStorageConfig()
  return !!(config.provider && config.apiKey)
}

/**
 * Get blockchain storage configuration info for debugging
 */
export function getBlockchainStorageInfo(): { 
  configured: boolean; 
  provider?: string; 
  endpoint?: string; 
  network?: string;
  hasApiKey?: boolean;
} {
  const config = getStorageConfig()
  return {
    configured: !!(config.provider && config.apiKey),
    provider: config.provider,
    endpoint: config.endpoint,
    network: config.network,
    hasApiKey: !!config.apiKey
  }
}

/**
 * List available files for a track (provider-specific implementation)
 */
export async function listTrackFiles(track: string): Promise<string[]> {
  const config = getStorageConfig()
  
  try {
    switch (config.provider) {
      case 'ipfs':
        return await listIPFSFiles(track, config)
      case 'arweave':
        return await listArweaveFiles(track, config)
      case 'filecoin':
        return await listFilecoinFiles(track, config)
      default:
        return []
    }
  } catch (error) {
    console.error('Error listing blockchain files:', error)
    return []
  }
}

async function listIPFSFiles(track: string, config: StorageConfig): Promise<string[]> {
  if (!config.apiKey) {
    return []
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/pinList', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      }
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()
    const pins = result.rows || []

    return pins
      .filter((pin: any) => pin.metadata?.keyvalues?.track === track)
      .map((pin: any) => pin.metadata?.keyvalues?.filename)
      .filter(Boolean)
  } catch (error) {
    console.warn('⚠️ Failed to list IPFS files:', error)
    return []
  }
}

async function listArweaveFiles(track: string, config: StorageConfig): Promise<string[]> {
  const endpoint = config.endpoint || 'https://node2.arweave.org'
  
  try {
    const response = await fetch(`${endpoint}/arql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          op: 'equals',
          expr1: 'Track',
          expr2: track
        }
      })
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()
    
    if (!result.edges) {
      return []
    }

    return result.edges
      .map((edge: any) => edge.node.tags?.find((tag: any) => tag.name === 'Filename')?.value)
      .filter(Boolean)
  } catch (error) {
    console.warn('⚠️ Failed to list Arweave files:', error)
    return []
  }
}

async function listFilecoinFiles(track: string, config: StorageConfig): Promise<string[]> {
  // Filecoin file listing would typically go through the storage provider's API
  // For now, delegate to IPFS listing
  return await listIPFSFiles(track, config)
}
