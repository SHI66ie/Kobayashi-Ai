#!/usr/bin/env node

/**
 * Migration Script: AWS to Blockchain Storage
 * 
 * This script helps migrate F1 race data from AWS S3 to blockchain storage
 * Supports IPFS, Filecoin, and Arweave backends
 * 
 * Usage:
 *   node scripts/migrate-to-blockchain.js --provider ipfs --track melbourne
 *   node scripts/migrate-to-blockchain.js --provider arweave --all
 *   node scripts/migrate-to-blockchain.js --dry-run --track monza
 */

const { migrateDataToBlockchain, getHybridStorageStatus } = require('../lib/hybrid-data');
const { listTrackFiles } = require('../lib/blockchain-data');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const flags = {
  provider: 'ipfs',
  track: null,
  all: false,
  dryRun: false,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--provider':
      flags.provider = args[++i];
      break;
    case '--track':
      flags.track = args[++i];
      break;
    case '--all':
      flags.all = true;
      break;
    case '--dry-run':
      flags.dryRun = true;
      break;
    case '--help':
    case '-h':
      flags.help = true;
      break;
    default:
      if (arg.startsWith('--')) {
        console.error(`Unknown flag: ${arg}`);
        process.exit(1);
      }
  }
}

// Show help
if (flags.help) {
  console.log(`
🚀 AWS to Blockchain Migration Script

Usage:
  node scripts/migrate-to-blockchain.js [options]

Options:
  --provider <type>    Storage provider (ipfs, filecoin, arweave) [default: ipfs]
  --track <name>       Specific track to migrate
  --all               Migrate all tracks
  --dry-run           Show what would be migrated without actually doing it
  --help, -h          Show this help message

Examples:
  node scripts/migrate-to-blockchain.js --provider ipfs --track melbourne
  node scripts/migrate-to-blockchain.js --provider arweave --all
  node scripts/migrate-to-blockchain.js --dry-run --track monza

Supported providers:
  - ipfs:   Fast, content-addressed storage (recommended for active data)
  - filecoin: Long-term archival storage with economic incentives
  - arweave: Permanent storage with one-time payment
`);
  process.exit(0);
}

// Validate arguments
if (!flags.track && !flags.all) {
  console.error('❌ Please specify either --track <name> or --all');
  process.exit(1);
}

if (!['ipfs', 'filecoin', 'arweave'].includes(flags.provider)) {
  console.error('❌ Invalid provider. Use: ipfs, filecoin, or arweave');
  process.exit(1);
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting AWS to Blockchain Migration');
  console.log('=====================================');
  console.log(`Provider: ${flags.provider}`);
  console.log(`Track: ${flags.track || 'All tracks'}`);
  console.log(`Dry Run: ${flags.dryRun ? 'Yes' : 'No'}`);
  console.log('');

  // Check storage configuration
  const status = getHybridStorageStatus();
  console.log('📊 Storage Status:');
  console.log(`  - Primary Backend: ${status.primaryBackend}`);
  console.log(`  - Available Backends: ${status.availableBackends.join(', ')}`);
  console.log(`  - Fallback Enabled: ${status.fallbackEnabled}`);
  console.log(`  - Sync Enabled: ${status.syncEnabled}`);
  console.log('');

  if (!status.configured) {
    console.error('❌ Storage not properly configured. Please check your environment variables.');
    process.exit(1);
  }

  // Get list of tracks to migrate
  const tracksToMigrate = flags.all ? await getAllTracks() : [flags.track];
  
  if (tracksToMigrate.length === 0) {
    console.log('ℹ️ No tracks found to migrate.');
    return;
  }

  console.log(`🏁 Tracks to migrate: ${tracksToMigrate.join(', ')}`);
  console.log('');

  // Migration statistics
  const totalStats = {
    tracks: tracksToMigrate.length,
    files: 0,
    migrated: 0,
    failed: 0,
    errors: []
  };

  // Migrate each track
  for (const track of tracksToMigrate) {
    console.log(`📍 Migrating track: ${track}`);
    console.log('----------------------------');
    
    try {
      // Get list of files for this track
      const files = await getTrackFiles(track);
      
      if (files.length === 0) {
        console.log(`ℹ️ No files found for track: ${track}`);
        continue;
      }

      console.log(`📁 Found ${files.length} files for ${track}:`);
      files.forEach(file => console.log(`   - ${file}`));
      console.log('');

      totalStats.files += files.length;

      if (flags.dryRun) {
        console.log(`🔍 DRY RUN: Would migrate ${files.length} files for ${track}`);
        totalStats.migrated += files.length;
        continue;
      }

      // Perform migration
      const results = await migrateDataToBlockchain(track, files);
      
      console.log(`📊 Migration results for ${track}:`);
      console.log(`   ✅ Migrated: ${results.migrated.length}`);
      console.log(`   ❌ Failed: ${results.failed.length}`);
      
      if (results.failed.length > 0) {
        console.log(`   Failed files: ${results.failed.join(', ')}`);
        totalStats.errors.push(...results.failed.map(f => `${track}/${f}`));
      }

      totalStats.migrated += results.migrated.length;
      totalStats.failed += results.failed.length;

    } catch (error) {
      console.error(`❌ Error migrating track ${track}:`, error.message);
      totalStats.errors.push(`${track}: ${error.message}`);
      totalStats.failed += 1;
    }

    console.log('');
  }

  // Final summary
  console.log('🎉 Migration Summary');
  console.log('==================');
  console.log(`Tracks processed: ${totalStats.tracks}`);
  console.log(`Total files: ${totalStats.files}`);
  console.log(`Successfully migrated: ${totalStats.migrated}`);
  console.log(`Failed: ${totalStats.failed}`);
  
  if (totalStats.errors.length > 0) {
    console.log('');
    console.log('❌ Errors:');
    totalStats.errors.forEach(error => console.log(`   - ${error}`));
  }

  console.log('');
  if (totalStats.failed === 0) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log(`⚠️ Migration completed with ${totalStats.failed} errors.`);
  }
}

// Helper function to get all available tracks
async function getAllTracks() {
  const dataDir = path.join(process.cwd(), 'Data');
  
  if (!fs.existsSync(dataDir)) {
    console.error('❌ Data directory not found. Make sure you have race data in the Data/ folder.');
    return [];
  }

  try {
    const items = fs.readdirSync(dataDir, { withFileTypes: true });
    const tracks = items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .filter(name => !name.startsWith('.') && name !== 'node_modules');
    
    return tracks;
  } catch (error) {
    console.error('❌ Error reading Data directory:', error.message);
    return [];
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run migration
runMigration().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
