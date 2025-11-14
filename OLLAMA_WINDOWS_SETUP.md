# 🦙 Ollama Setup for Windows - Local AI Racing Models

## Quick Windows Installation

Since the Unix command didn't work on Windows, here's the correct way:

### Method 1: Download Installer (Recommended)
1. **Visit**: https://ollama.ai/download
2. **Download**: `OllamaSetup.exe` for Windows
3. **Run installer** and follow prompts
4. **Restart terminal** after installation

### Method 2: Windows Package Manager
```powershell
# Using winget (Windows 11/10)
winget install Ollama.Ollama

# Or using Chocolatey
choco install ollama
```

### Method 3: Manual Installation
1. Download from GitHub releases: https://github.com/ollama/ollama/releases
2. Extract to `C:\Program Files\Ollama\`
3. Add to PATH environment variable

## 🚀 Quick Start After Installation

### 1. Verify Installation
```powershell
ollama --version
```

### 2. Download Racing-Optimized Models
```powershell
# Fast, good for racing analysis (4.7GB)
ollama pull llama3.1:8b

# Alternative: Smaller but still capable (2.3GB)
ollama pull llama3.2:3b

# Code-focused for technical analysis (4.1GB)
ollama pull codellama:7b

# Specialized for reasoning (good for strategy) (4.1GB)
ollama pull mistral:7b
```

### 3. Test Your Model
```powershell
ollama run llama3.1:8b
```

Type: "You are a racing AI. Analyze this: Driver finished 3rd with best lap 1:23.456"

### 4. Configure RaceMind AI
Add to your `.env.local`:
```env
CUSTOM_LLM_URL=http://localhost:11434/api/generate
CUSTOM_LLM_MODEL=llama3.1:8b
```

### 5. Test Integration
```powershell
npm run test-custom-llm
```

## 🏁 Racing Model Recommendations

### For Performance Analysis:
- **llama3.1:8b** - Best overall (4.7GB)
- **mistral:7b** - Great for technical insights (4.1GB)

### For Strategy Planning:
- **llama3.1:8b** - Excellent reasoning (4.7GB)
- **codellama:7b** - Good with data analysis (4.1GB)

### For Quick Responses:
- **llama3.2:3b** - Fast but capable (2.3GB)
- **phi3:mini** - Very fast, basic analysis (2.3GB)

## 🔧 Troubleshooting

### "ollama: command not found"
- Restart your terminal/PowerShell
- Check PATH: `echo $env:PATH` (PowerShell) or `echo %PATH%` (CMD)
- Reinstall Ollama

### "Connection refused" in RaceMind
- Start Ollama service: `ollama serve`
- Check if running: `ollama list`
- Verify URL: http://localhost:11434

### Models taking too long to download
- Use smaller models first: `ollama pull llama3.2:3b`
- Check internet connection
- Try different mirror if available

## 🎯 Integration with RaceMind AI

Once Ollama is running:

1. **Start Ollama service** (if not auto-started):
   ```powershell
   ollama serve
   ```

2. **Configure RaceMind** in `.env.local`:
   ```env
   CUSTOM_LLM_URL=http://localhost:11434/api/generate
   CUSTOM_LLM_MODEL=llama3.1:8b
   ```

3. **Test the integration**:
   ```powershell
   npm run test-custom-llm
   ```

4. **Start RaceMind**:
   ```powershell
   npm run dev
   ```

5. **Use Advanced AI Panel**:
   - Load race data
   - Go to "Advanced AI Systems"
   - Select "Autonomous Racing" tab
   - Your local AI will now power the analysis!

## 💡 Pro Tips

### Performance Optimization:
- **GPU Acceleration**: Ollama automatically uses GPU if available
- **Memory**: 8GB+ RAM recommended for 7B models
- **Storage**: Keep models on SSD for faster loading

### Model Management:
```powershell
# List installed models
ollama list

# Remove unused models
ollama rm model-name

# Update models
ollama pull llama3.1:8b
```

### Advanced Configuration:
```powershell
# Set custom model parameters
ollama run llama3.1:8b --temperature 0.7 --top-p 0.9
```

## 🏆 Benefits of Local AI

- **Privacy**: Your racing data never leaves your computer
- **Speed**: No internet latency
- **Cost**: No API fees
- **Customization**: Fine-tune models for racing
- **Reliability**: Works offline

## 🔗 Resources

- **Ollama Website**: https://ollama.ai
- **Model Library**: https://ollama.ai/library
- **GitHub**: https://github.com/ollama/ollama
- **Discord Community**: https://discord.gg/ollama

---

**Your local racing AI is ready to compete!** 🏁🤖
