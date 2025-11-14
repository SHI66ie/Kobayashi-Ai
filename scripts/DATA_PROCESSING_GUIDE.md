# 🏎️ Toyota GR Cup Data Processing Guide

## Overview
This script processes large CSV racing data files using Pandas with intelligent downsampling to make them Git-friendly while preserving racing integrity.

## Features
✅ **Smart Downsampling** - Preserves critical racing events (braking, acceleration, corners)  
✅ **Memory Efficient** - Processes large files in chunks  
✅ **Racing Integrity** - Keeps speed spikes, braking points, and corner data  
✅ **JSON Conversion** - Converts CSV to smaller JSON files  
✅ **Test Mode** - Processes one track first for review  

## Setup

### 1. Install Dependencies
```bash
cd c:\Users\DELL\Documents\GitHub\DriftKing-Ai
pip install -r scripts/requirements-data-processing.txt
```

### 2. Run Test (First Track Only)
```bash
python scripts/process-racing-data.py
```

This will process **Indianapolis** first as a test. Review the output!

### 3. Check Results
Look in: `c:\Users\DELL\Documents\GitHub\DriftKing-Ai\Data\indianapolis\`

You should see JSON files:
- Race results
- Lap times
- Weather data
- Telemetry (downsampled)

### 4. Process All Tracks
If the test looks good, edit `process-racing-data.py`:

**Uncomment this line at the bottom:**
```python
# processed_files = process_all_tracks()
```

Then run again:
```bash
python scripts/process-racing-data.py
```

## How It Works

### Telemetry Downsampling Strategy
The script intelligently downsamples large telemetry files:

1. **Identifies Important Events:**
   - Braking (speed drops)
   - Acceleration (speed increases)
   - Corner entry/exit
   - Speed spikes

2. **Preserves Critical Data:**
   - Top 10% of speed changes
   - First and last data points
   - Regular samples every N rows

3. **Aggressive on Straights:**
   - More downsampling where speed is constant
   - Less downsampling during racing action

### File Types
- **Small files** (< 5 MB): No downsampling, direct conversion
- **Large telemetry** (> 5 MB): Smart downsampling applied
- **Race results, lap times, weather**: Preserved completely

## Configuration

Edit these values in `process-racing-data.py`:

```python
CHUNK_SIZE = 10000  # Process in chunks (memory management)
TELEMETRY_DOWNSAMPLE_RATE = 10  # Keep every 10th row (adjust as needed)
```

**Downsample Rate Options:**
- `5` = More data, larger files (20% reduction)
- `10` = Balanced (50-70% reduction) ← **Recommended**
- `20` = Aggressive (80-90% reduction)
- `50` = Very aggressive (95% reduction)

## Expected Results

### Before (CSV):
```
barber-motorsports-park/
  ├── telemetry.csv (1.5 GB)
  ├── lap_times.csv (2 MB)
  └── results.csv (500 KB)
```

### After (JSON):
```
Data/barber/
  ├── telemetry.json (150-300 MB) ← Downsampled!
  ├── lap_times.json (2 MB)
  └── results.json (500 KB)
```

## Verification

After processing, check:
1. **File sizes** - Should be much smaller
2. **Data integrity** - Open JSON files, spot-check values
3. **Racing events** - Ensure speed spikes and braking points are preserved

## Troubleshooting

### Memory Error
- Reduce `CHUNK_SIZE` to `5000` or `1000`
- Increase `TELEMETRY_DOWNSAMPLE_RATE` to `20` or `50`

### Missing Important Data
- Reduce `TELEMETRY_DOWNSAMPLE_RATE` to `5`
- Check the speed change threshold in the script

### Slow Processing
- Normal for large files
- Each track takes 2-10 minutes depending on telemetry size

## Next Steps

After processing:
1. ✅ Commit to Git (files will be much smaller)
2. ✅ Update your app to load JSON instead of CSV
3. ✅ Push to GitHub
4. ✅ Deploy to Netlify with the new data

## Notes

- Original ZIP files are NOT modified
- Temp extraction folders are cleaned up automatically
- JSON files use proper formatting (indent=2)
- Progress is printed for each file

**Ready to process your racing data!** 🏁
