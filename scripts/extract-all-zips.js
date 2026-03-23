const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const axios = require('axios');

const dataDir = path.join(__dirname, '../Data');
const extractedDir = path.join(dataDir, 'extracted');

const TRACK_ZIP_URLS = {
  'barber-motorsports-park.zip': 'https://trddev.com/hackathon-2025/barber-motorsports-park.zip',
  'circuit-of-the-americas.zip': 'https://trddev.com/hackathon-2025/circuit-of-the-americas.zip',
  'indianapolis.zip': 'https://trddev.com/hackathon-2025/indianapolis.zip',
  'road-america.zip': 'https://trddev.com/hackathon-2025/road-america.zip',
  'sebring.zip': 'https://trddev.com/hackathon-2025/sebring.zip',
  'sonoma.zip': 'https://trddev.com/hackathon-2025/sonoma.zip',
  'virginia-international-raceway.zip': 'https://trddev.com/hackathon-2025/virginia-international-raceway.zip'
};

const zipFiles = Object.keys(TRACK_ZIP_URLS);

// Create directories if they don't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(extractedDir)) {
  fs.mkdirSync(extractedDir, { recursive: true });
}

async function downloadFile(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function runExtraction() {
  console.log('🗜️  KobayashiAI Data Tech: Extraction & Download\n');
  console.log('='.repeat(60));

  for (let i = 0; i < zipFiles.length; i++) {
    const zipFileName = zipFiles[i];
    const zipPath = path.join(dataDir, zipFileName);
    const url = TRACK_ZIP_URLS[zipFileName];

    console.log(`\n${i + 1}. 📦 ${zipFileName}`);

    // Download if missing
    if (!fs.existsSync(zipPath)) {
      console.log(`   🔄 Downloading from: ${url}`);
      try {
        await downloadFile(url, zipPath);
        console.log(`   ✅ Download Complete`);
      } catch (error) {
        console.log(`   ❌ Download Failed: ${error.message}`);
        continue;
      }
    } else {
      console.log(`   ✓ File already exists locally`);
    }

    try {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      
      const zipSizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
      console.log(`   Size: ${zipSizeMB} MB`);
      console.log(`   Files: ${entries.length}`);
      
      // Extract to a subfolder named after the track
      const trackName = zipFileName.replace('.zip', '');
      const outputPath = path.join(extractedDir, trackName);
      
      // Check if already extracted
      if (fs.existsSync(outputPath)) {
        const existingFiles = fs.readdirSync(outputPath, { recursive: true });
        const csvCount = existingFiles.filter(f => f.toLowerCase().endsWith('.csv')).length;
        
        if (csvCount > 0) {
          console.log(`   ✓ Already extracted (${csvCount} CSV files)`);
          console.log(`   Location: ${outputPath}`);
          continue;
        }
      }
      
      console.log(`   🔄 Extracting...`);
      zip.extractAllTo(outputPath, true);
      
      // Count extracted CSV files
      const extractedFiles = fs.readdirSync(outputPath, { recursive: true });
      const csvFiles = extractedFiles.filter(f => f.toLowerCase().endsWith('.csv'));
      
      console.log(`   ✅ Extracted ${csvFiles.length} CSV files`);
      console.log(`   Location: ${outputPath}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Tech Process Complete!');
  console.log(`\nNext steps:`);
  console.log(`  1. Run: npm run convert-csv`);
  console.log(`  2. Run: npm run convert-large-csv`);
  console.log('='.repeat(60));
}

runExtraction();
