const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const readline = require('readline');

const extractedDir = path.join(__dirname, '../Data/extracted');
const outputDir = path.join(__dirname, '../Data/json');

// Large telemetry files to process (all tracks)
const largeTelemetryFiles = [
  // Barber
  'barber2/R1_barber_telemetry_data.csv',
  'barber2/R2_barber_telemetry_data.csv',
  'barber-motorsports-park/barber/R1_barber_telemetry_data.csv',
  'barber-motorsports-park/barber/R2_barber_telemetry_data.csv',
  // COTA
  'COTA/Race 1b/R1_cota_telemetry_data.csv',
  'COTA/Race 2b/R2_cota_telemetry_data.csv',
  'circuit-of-the-americas/COTA/Race 1/R1_cota_telemetry_data.csv',
  'circuit-of-the-americas/COTA/Race 2/R2_cota_telemetry_data.csv',
  // Indianapolis
  'indianapolis/Indianapolis/Indianapolis/Race 1/R1_indianapolis_motor_speedway_telemetry.csv',
  'indianapolis/Indianapolis/Indianapolis/Race 2/R2_indianapolis_motor_speedway_telemetry.csv',
  // Road America
  'road-america/Road America/Road America/Race 1/R1_road_america_telemetry_data.csv',
  'road-america/Road America/Road America/Race 2/R2_road_america_telemetry_data.csv',
  // Sebring
  'sebring/Sebring/Sebring/Race 1/sebring_telemetry_R1.csv',
  'sebring/Sebring/Sebring/Race 2/sebring_telemetry_R2.csv',
  // Sonoma
  'sonoma/Sonoma/Race 1/sonoma_telemetry_R1.csv',
  'sonoma/Sonoma/Race 2/sonoma_telemetry_R2.csv',
  // VIR
  'virginia-international-raceway/virginia-international-raceway/VIR/Race 1/R1_vir_telemetry_data.csv',
  'virginia-international-raceway/virginia-international-raceway/VIR/Race 2/R2_vir_telemetry_data.csv'
];

// Chunk size: split large files into smaller JSON files of N rows each
const CHUNK_SIZE = 10000; // 10k rows per chunk (adjustable)

async function convertLargeCSVToChunkedJSON(csvPath) {
  console.log(`\n🔄 Processing large file: ${csvPath}`);
  
  const fullPath = path.join(extractedDir, csvPath);
  const relativePath = csvPath;
  const baseJsonPath = path.join(outputDir, relativePath.replace(/\.csv$/i, ''));
  
  // Create output directory
  const jsonDir = path.dirname(baseJsonPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(fullPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = null;
    let currentChunk = [];
    let chunkIndex = 0;
    let totalRows = 0;
    let lineNumber = 0;

    rl.on('line', (line) => {
      lineNumber++;
      
      if (!headers) {
        // First line is headers
        headers = Papa.parse(line).data[0];
        return;
      }

      // Parse the CSV line
      const parsed = Papa.parse(line, { 
        dynamicTyping: true,
        skipEmptyLines: true 
      });
      
      if (parsed.data[0] && parsed.data[0].length > 0) {
        // Create object from headers and values
        const row = {};
        headers.forEach((header, index) => {
          row[header] = parsed.data[0][index];
        });
        
        currentChunk.push(row);
        totalRows++;

        // When chunk is full, write it to a file
        if (currentChunk.length >= CHUNK_SIZE) {
          const chunkPath = `${baseJsonPath}_chunk_${chunkIndex}.json`;
          fs.writeFileSync(chunkPath, JSON.stringify(currentChunk, null, 2));
          
          const chunkSizeMB = (fs.statSync(chunkPath).size / 1024 / 1024).toFixed(2);
          console.log(`  ✓ Chunk ${chunkIndex}: ${currentChunk.length} rows (${chunkSizeMB} MB)`);
          
          currentChunk = [];
          chunkIndex++;
        }
      }

      // Progress indicator every 50k lines
      if (lineNumber % 50000 === 0) {
        console.log(`  📊 Processed ${lineNumber.toLocaleString()} lines...`);
      }
    });

    rl.on('close', () => {
      // Write any remaining rows in the last chunk
      if (currentChunk.length > 0) {
        const chunkPath = `${baseJsonPath}_chunk_${chunkIndex}.json`;
        fs.writeFileSync(chunkPath, JSON.stringify(currentChunk, null, 2));
        
        const chunkSizeMB = (fs.statSync(chunkPath).size / 1024 / 1024).toFixed(2);
        console.log(`  ✓ Chunk ${chunkIndex}: ${currentChunk.length} rows (${chunkSizeMB} MB)`);
        chunkIndex++;
      }

      // Create an index file for this telemetry data
      const indexPath = `${baseJsonPath}_index.json`;
      const indexData = {
        originalFile: relativePath,
        totalRows: totalRows,
        totalChunks: chunkIndex,
        chunkSize: CHUNK_SIZE,
        headers: headers,
        chunks: Array.from({ length: chunkIndex }, (_, i) => ({
          chunkNumber: i,
          filename: `${path.basename(baseJsonPath)}_chunk_${i}.json`,
          estimatedRows: i < chunkIndex - 1 ? CHUNK_SIZE : (totalRows % CHUNK_SIZE) || CHUNK_SIZE
        }))
      };
      fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

      const csvSizeMB = (fs.statSync(fullPath).size / 1024 / 1024).toFixed(2);
      console.log(`  ✅ Complete: ${totalRows.toLocaleString()} rows in ${chunkIndex} chunks`);
      console.log(`  📁 CSV: ${csvSizeMB} MB`);
      console.log(`  📝 Index: ${indexPath}`);

      resolve({
        file: relativePath,
        totalRows,
        totalChunks: chunkIndex,
        csvSizeMB
      });
    });

    rl.on('error', (error) => {
      console.error(`  ❌ Error: ${error.message}`);
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Converting Large Telemetry CSV Files to Chunked JSON\n');
  console.log(`Chunk size: ${CHUNK_SIZE.toLocaleString()} rows per file\n`);

  const results = [];

  for (const file of largeTelemetryFiles) {
    const fullPath = path.join(extractedDir, file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skipping ${file} (file not found)`);
      continue;
    }

    try {
      const result = await convertLargeCSVToChunkedJSON(file);
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to convert ${file}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ CONVERSION SUMMARY');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n📊 ${result.file}`);
    console.log(`   Rows: ${result.totalRows.toLocaleString()}`);
    console.log(`   Chunks: ${result.totalChunks}`);
    console.log(`   CSV Size: ${result.csvSizeMB} MB`);
  });

  const totalRows = results.reduce((sum, r) => sum + r.totalRows, 0);
  const totalChunks = results.reduce((sum, r) => sum + r.totalChunks, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${totalRows.toLocaleString()} rows in ${totalChunks} chunk files`);
  console.log(`Output: ${outputDir}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
