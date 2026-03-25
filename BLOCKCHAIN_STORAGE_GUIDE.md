# Blockchain Storage Migration Guide

This guide helps you migrate your Kobayashi-Ai F1 application from AWS/Google storage to decentralized blockchain storage solutions.

## 🚀 Quick Start

### 1. Choose Your Storage Provider

**IPFS (Recommended for Active Data)**
- Fast retrieval for frequently accessed data
- Content-addressed storage ensures data integrity
- Ideal for live F1 race data and telemetry

**Filecoin (Best for Archives)**
- Long-term storage with economic incentives
- Built on IPFS with proof-of-storage
- Perfect for historical race data archives

**Arweave (Permanent Storage)**
- One-time payment for permanent storage
- "Pay once, store forever" model
- Best for immutable race records

### 2. Setup Environment

Copy the example configuration:
```bash
cp .env.blockchain.example .env.local
```

Configure your preferred provider:

#### For IPFS (using Pinata)
```env
BLOCKCHAIN_STORAGE_PROVIDER=ipfs
BLOCKCHAIN_STORAGE_ENDPOINT=https://api.pinata.cloud/pinning/pinFileToIPFS
BLOCKCHAIN_STORAGE_API_KEY=your_pinata_api_key_here
```

#### For Arweave
```env
BLOCKCHAIN_STORAGE_PROVIDER=arweave
BLOCKCHAIN_STORAGE_ENDPOINT=https://node1.arweave.org
```

#### For Filecoin
```env
BLOCKCHAIN_STORAGE_PROVIDER=filecoin
BLOCKCHAIN_STORAGE_ENDPOINT=https://api.filecoin.io/v1/storage
BLOCKCHAIN_STORAGE_API_KEY=your_filecoin_api_key_here
```

### 3. Install Dependencies

```bash
npm install ipfs-http-client web3.storage
```

### 4. Test Configuration

```bash
node scripts/migrate-to-blockchain.js --dry-run --track melbourne
```

## 📋 Migration Options

### Option 1: Gradual Migration (Recommended)

Use hybrid mode to migrate gradually while maintaining AWS as backup:

```env
STORAGE_HYBRID_MODE=true
STORAGE_PRIMARY=blockchain
STORAGE_BACKUP=aws
STORAGE_FALLBACK_ENABLED=true
STORAGE_SYNC_ENABLED=true
```

### Option 2: Full Migration

Switch completely to blockchain storage:

```env
STORAGE_HYBRID_MODE=false
BLOCKCHAIN_STORAGE_PROVIDER=ipfs
```

### Option 3: Test Migration

Migrate a single track first:

```bash
node scripts/migrate-to-blockchain.js --provider ipfs --track melbourne
```

## 🛠️ Migration Commands

### Migrate Single Track
```bash
node scripts/migrate-to-blockchain.js --provider ipfs --track melbourne
```

### Migrate All Tracks
```bash
node scripts/migrate-to-blockchain.js --provider ipfs --all
```

### Dry Run (Preview Only)
```bash
node scripts/migrate-to-blockchain.js --dry-run --track monza
```

### Use Different Providers
```bash
# IPFS
node scripts/migrate-to-blockchain.js --provider ipfs --all

# Filecoin  
node scripts/migrate-to-blockchain.js --provider filecoin --all

# Arweave
node scripts/migrate-to-blockchain.js --provider arweave --all
```

## 📊 Storage Comparison

| Feature | IPFS | Filecoin | Arweave |
|---------|------|----------|---------|
| **Speed** | ⚡ Fast | 🐢 Medium | 🐌 Slow |
| **Cost** | 💰 Low | 💸 Variable | 💎 One-time |
| **Permanence** | 🔄 Needs pinning | 📅 Contract-based | ♾️ Permanent |
| **Best For** | Active data | Archives | Immutable records |

## 🔧 API Integration

The blockchain storage services integrate seamlessly with your existing code:

```typescript
import { fetchRaceDataHybrid, storeRaceDataHybrid } from '../lib/hybrid-data'

// Fetch data (automatically tries blockchain first, then AWS)
const raceData = await fetchRaceDataHybrid('melbourne', 'race_results.json')

// Store data (saves to primary and syncs to backup)
await storeRaceDataHybrid('melbourne', 'race_results.json', raceData)
```

## 🎯 Recommended Setup for F1 App

### Active Race Data (IPFS)
- Live telemetry data
- Current race results  
- Driver standings
- Tire data

### Historical Archives (Filecoin)
- Past race results
- Historical telemetry
- Season archives
- Driver statistics

### Permanent Records (Arweave)
- Championship records
- Official race results
- Historical achievements
- Compliance data

## 🔍 Verification

After migration, verify your data:

```typescript
import { testStorageBackends } from '../lib/hybrid-data'

// Test connectivity
const status = await testStorageBackends()
console.log('AWS:', status.aws)
console.log('Blockchain:', status.blockchain)
```

## 🚨 Important Notes

1. **Data Availability**: Ensure your blockchain storage provider has good uptime and multiple gateways

2. **Cost Management**: Monitor storage costs, especially with Filecoin's market-based pricing

3. **Backup Strategy**: Keep AWS as backup during initial migration period

4. **Performance**: Blockchain storage may be slower than AWS for initial loads

5. **Data Privacy**: Consider encryption for sensitive F1 data

## 🆘 Troubleshooting

### Common Issues

**"API Key Required"**
- Ensure your blockchain storage API key is properly configured
- Check that the endpoint URL is correct

**"File Not Found"**
- Verify the file exists in your local Data/ directory
- Check that track and filenames are spelled correctly

**"Connection Failed"**
- Test your internet connection
- Verify the blockchain storage endpoint is accessible
- Check if your API key has sufficient permissions

**"Migration Failed"**
- Check the error logs for specific issues
- Ensure you have sufficient storage quota
- Verify file sizes are within limits

### Getting Help

1. Check the console logs for detailed error messages
2. Verify your environment variables are set correctly
3. Test with a small file first
4. Use dry-run mode to preview migrations

## 📚 Additional Resources

- [IPFS Documentation](https://docs.ipfs.io/)
- [Filecoin Documentation](https://docs.filecoin.io/)
- [Arweave Documentation](https://docs.arweave.org/)
- [Pinata API Guide](https://docs.pinata.cloud/)

## 🎉 Next Steps

1. **Test Migration**: Start with a single track
2. **Monitor Performance**: Check load times and costs
3. **Scale Up**: Migrate remaining tracks gradually
4. **Optimize**: Adjust based on usage patterns
5. **Maintain**: Keep backup systems during transition

Welcome to decentralized storage! 🚀
