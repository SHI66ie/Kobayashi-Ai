# 🤖 Custom LLM Integration Guide

## Overview

RaceMind AI now supports your own LLM! You can use:
- **Ollama** (local models like Llama, Mistral, CodeLlama)
- **LM Studio** (local GUI for running models)
- **text-generation-webui** (oobabooga)
- **LocalAI** (OpenAI-compatible local API)
- **Any custom API endpoint**

## 🚀 Quick Setup Options

### Option 1: Ollama (Recommended for Local)

1. **Install Ollama**
   ```bash
   # Windows/Mac/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Download a model**
   ```bash
   ollama pull llama3.1:8b     # Fast, good quality
   ollama pull mistral:7b      # Alternative option
   ollama pull codellama:7b    # Code-focused
   ```

3. **Add to `.env.local`**
   ```env
   CUSTOM_LLM_URL=http://localhost:11434/api/generate
   CUSTOM_LLM_MODEL=llama3.1:8b
   ```

### Option 2: LM Studio (GUI)

1. **Download LM Studio**: https://lmstudio.ai/
2. **Load a model** (e.g., Llama 3.1, Mistral)
3. **Start local server** (usually port 1234)
4. **Add to `.env.local`**
   ```env
   CUSTOM_LLM_URL=http://localhost:1234/v1/chat/completions
   CUSTOM_LLM_MODEL=your-model-name
   ```

### Option 3: text-generation-webui

1. **Install**: https://github.com/oobabooga/text-generation-webui
2. **Start with API enabled**
   ```bash
   python server.py --api --listen
   ```
3. **Add to `.env.local`**
   ```env
   CUSTOM_LLM_URL=http://localhost:5000/v1/chat/completions
   CUSTOM_LLM_MODEL=your-model-name
   ```

### Option 4: LocalAI

1. **Install LocalAI**: https://localai.io/
2. **Start server**
   ```bash
   docker run -p 8080:8080 localai/localai
   ```
3. **Add to `.env.local`**
   ```env
   CUSTOM_LLM_URL=http://localhost:8080/v1/chat/completions
   CUSTOM_LLM_MODEL=gpt-3.5-turbo
   ```

## 📝 Configuration

Add these variables to your `.env.local` file:

```env
# Required: Your LLM endpoint URL
CUSTOM_LLM_URL=http://localhost:11434/api/generate

# Optional: Model name (if your API supports multiple models)
CUSTOM_LLM_MODEL=llama3.1:8b

# Optional: API key (if your custom LLM requires authentication)
CUSTOM_LLM_API_KEY=your-api-key-here
```

## 🔧 Supported API Formats

### Ollama Format
```json
{
  "model": "llama3.1:8b",
  "prompt": "Your prompt here",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 2000
  }
}
```

### OpenAI-Compatible Format
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a racing AI."},
    {"role": "user", "content": "Your prompt here"}
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### Generic Format
```json
{
  "prompt": "Your prompt here",
  "max_tokens": 2000,
  "temperature": 0.7
}
```

## 🧪 Testing Your Setup

1. **Test the custom LLM**
   ```bash
   npm run test-custom-llm
   ```

2. **Or test through the dashboard**
   - Start your LLM server
   - Run `npm run dev`
   - Load race data
   - Click "Generate AI Report"

## 📊 Model Recommendations

### For Racing Analysis

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| Llama 3.1 8B | 4.7GB | Fast | High | General analysis |
| Mistral 7B | 4.1GB | Fast | High | Technical insights |
| CodeLlama 7B | 4.1GB | Fast | Medium | Data analysis |
| Llama 3.1 70B | 40GB | Slow | Excellent | Deep analysis |

### Hardware Requirements

- **8B models**: 8GB+ RAM, any modern CPU
- **13B models**: 16GB+ RAM, good CPU
- **70B models**: 64GB+ RAM or GPU with 24GB+ VRAM

## 🔄 Fallback Priority

RaceMind AI tries services in this order:
1. **Custom LLM** (if configured)
2. **Gemini** (if API key available)
3. **OpenAI** (if API key available)

## 🐛 Troubleshooting

### "Custom LLM not configured"
- Check `CUSTOM_LLM_URL` is set in `.env.local`
- Ensure your LLM server is running

### "Connection refused"
- Verify the URL and port
- Check if your LLM server is accessible
- Try: `curl http://localhost:11434/api/generate`

### "Model not found"
- Check `CUSTOM_LLM_MODEL` matches your loaded model
- For Ollama: `ollama list` to see available models

### Poor quality responses
- Try a larger model (13B instead of 7B)
- Adjust temperature (lower = more focused)
- Ensure model is fully loaded

## 🎯 Example Configurations

### Complete Ollama Setup
```env
# Ollama with Llama 3.1
CUSTOM_LLM_URL=http://localhost:11434/api/generate
CUSTOM_LLM_MODEL=llama3.1:8b

# Backup options
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
```

### LM Studio Setup
```env
# LM Studio
CUSTOM_LLM_URL=http://localhost:1234/v1/chat/completions
CUSTOM_LLM_MODEL=llama-3.1-8b-instruct

# Backup options
GEMINI_API_KEY=your-gemini-key
```

### Remote LLM Setup
```env
# Remote custom LLM
CUSTOM_LLM_URL=https://your-llm-server.com/v1/chat/completions
CUSTOM_LLM_API_KEY=your-remote-api-key
CUSTOM_LLM_MODEL=your-model-name
```

## 🚀 Performance Tips

1. **Use GPU acceleration** if available
2. **Keep models loaded** (don't restart between requests)
3. **Optimize context length** for your hardware
4. **Use quantized models** (Q4, Q5) for speed
5. **Monitor RAM usage** during analysis

## 🔐 Security Notes

- Custom LLMs run locally = your data stays private
- No external API calls when using local models
- Perfect for sensitive racing data
- Full control over model behavior

## 📚 Resources

- [Ollama Models](https://ollama.ai/library)
- [LM Studio](https://lmstudio.ai/)
- [text-generation-webui](https://github.com/oobabooga/text-generation-webui)
- [LocalAI](https://localai.io/)
- [Hugging Face Models](https://huggingface.co/models)

---

**Your data, your model, your control!** 🏁
