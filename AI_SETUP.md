# 🤖 AI Setup Guide for RaceMind AI

## Overview
Your app now has **real AI-powered analysis** using OpenAI's GPT-4. This guide explains how to enable it.

---

## ✅ What's Included

### 1. **OpenAI Integration** (`app/api/ai-analyze/route.ts`)
- Analyzes race results, lap times, and weather data
- Provides performance insights and strategy recommendations
- Generates driver-specific coaching tips
- Uses GPT-4 Turbo for fast, accurate analysis

### 2. **Smart Dashboard** (`app/dashboard/page.tsx`)
- "Generate AI Report" button triggers analysis
- Shows loading state while AI processes data
- Displays report on dashboard + downloads as `.txt` file
- Falls back to demo data if AI is unavailable

### 3. **Environment Variables** (`.env.local`)
- Secure API key storage
- Easy configuration

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Click **"Create new secret key"**
4. Copy your key (starts with `sk-...`)

**Cost:** ~$0.01 - $0.05 per analysis (very affordable)

### Step 2: Add API Key to Your Project

1. **Create `.env.local` file** in project root:
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and add your key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Step 3: Test AI Analysis

1. Open `http://localhost:3002/dashboard`
2. Click **"Load Analytics"** to load race data
3. Click **"Generate AI Report"**
4. Watch the AI analyze your race data! 🎉

---

## 📊 What AI Analyzes

The AI receives:
- **Race Results**: Driver positions, times, gaps
- **Lap Times**: All lap data with timestamps
- **Weather**: Temperature, humidity, wind speed
- **Track Info**: Circuit name and race number

It provides:
- **Performance Insights**: Lap time analysis, consistency ratings
- **Strategy Tips**: Pit windows, tire management
- **Driver Coaching**: Specific improvements for each driver
- **Weather Impact**: How conditions affected performance
- **Predictions**: Recommendations for next race

---

## 💰 Cost Breakdown

| Analysis Type | Tokens | Cost |
|--------------|--------|------|
| Basic Report | ~2,000 | $0.02 |
| Detailed Report | ~4,000 | $0.04 |
| Full Season Analysis | ~10,000 | $0.10 |

**OpenAI Pricing**: $0.01 per 1,000 tokens (GPT-4 Turbo)

---

## 🔧 Advanced Configuration

### Use Different AI Models

Edit `app/api/ai-analyze/route.ts`:

```typescript
// Faster & Cheaper (GPT-3.5)
model: "gpt-3.5-turbo" // $0.001 per 1K tokens

// Most Intelligent (GPT-4 Turbo) - Default
model: "gpt-4-turbo-preview" // $0.01 per 1K tokens

// Vision + Analysis (GPT-4 with images)
model: "gpt-4-vision-preview" // For analyzing race photos
```

### Customize AI Prompts

Modify the system prompt to change AI behavior:

```typescript
content: `You are RaceMind AI, an expert racing data analyst.
Focus on: [YOUR CUSTOM INSTRUCTIONS]
- Tire wear analysis
- Fuel strategy optimization
- Overtaking opportunities
- Sector-by-sector breakdown`
```

---

## 🏎️ F1 2026 Prediction Algorithms (New)

The `KobayashiAI Alpha Engine` utilizes live Llama 3 / PyTorch inference for the F1 **Strategy Forge**.

### Overview of F1 Algorithms
1. **Data Ingestion**: Official F1 Open API telemetry and standings data are loaded dynamically.
2. **Context Assembly**: Variables from the Prediction Builder (fuel load, aero packages, weather) are encoded into JSON.
3. **Inference**: The model evaluates conditions across predefined factors specific to 2026 regulations (e.g., standardized 800kW MGU-K limits or C1-C5 tire degradation rates).
4. **Scoring**: A confidence `ALPHA` score and precision rate are calculated based on historical validation of similar track constraints.

### How to Extend F1 Simulations
If you want to add new variables (e.g., Driver Morale, Suspension stiffness) to the simulation:
1. **Update UI**: Add your variable to `app/f1/page.tsx` within the `f1Data` state and input forms.
2. **Backend Payload**: Ensure the variable is passed to `app/api/f1/predict/route.ts` via the `POST` request.
3. **Prompt Engineering**: Modify the `systemPrompt` in the API route to include instructions on how the new variable affects the 2026 regulations simulation.

---

## 🛠️ Alternative Options

### Option 2: Local AI (Free, but slower)

If you don't want to pay for OpenAI, use local models:

```bash
# Install Ollama (runs AI locally)
npm install ollama

# Download model
ollama pull llama3
```

Edit API route to use Ollama instead of OpenAI.

### Option 3: Claude API (Anthropic)

```bash
npm install @anthropic-ai/sdk
```

Claude is excellent for long-form analysis and reasoning.

### Option 4: Azure OpenAI

Enterprise option with compliance guarantees:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-key
```

---

## 📈 Next Steps

### 1. **PDF Analysis** (Coming Soon)
Parse PDF race documents and include insights in reports.

```bash
npm install pdf-parse
```

### 2. **Real-Time Predictions** (Advanced)
Train custom ML models on historical race data:

```bash
npm install @tensorflow/tfjs
```

### 3. **Voice Reports** (Cool Feature)
Convert AI reports to audio:

```bash
npm install openai # text-to-speech API
```

### 4. **Video Analysis** (Ultimate)
Analyze race footage with GPT-4 Vision:

```typescript
// Send video frames to AI
model: "gpt-4-vision-preview"
```

---

## ❓ Troubleshooting

### "OpenAI API key not configured"
- Check `.env.local` exists in project root
- Verify key starts with `sk-`
- Restart dev server after adding key

### "AI analysis failed"
- Check API key is valid
- Verify you have OpenAI credits
- Check console logs for specific error

### "Report shows demo data"
- This is the fallback if AI fails
- Check `.env.local` is configured
- Ensure race data is loaded first

### "Too slow / timeout"
- Use `gpt-3.5-turbo` instead (10x faster)
- Reduce `max_tokens` in API route
- Analyze fewer laps (first 50 instead of all)

---

## 🎯 Production Deployment

### Netlify Setup

1. Add environment variable in Netlify dashboard:
   - Go to **Site settings** → **Environment variables**
   - Add: `OPENAI_API_KEY = sk-your-key`
   - Redeploy site

2. **Important**: Add to `netlify.toml`:
   ```toml
   [functions]
     timeout = 60  # AI analysis can take 30-60s
   ```

### Vercel Setup

1. Add to **Project Settings** → **Environment Variables**
2. Set `OPENAI_API_KEY`
3. Redeploy

---

## 📚 Resources

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4 Guide](https://platform.openai.com/docs/guides/gpt)
- [Pricing Calculator](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)

---

## 🏁 Summary

**Before AI Setup:**
- ❌ Fake demo predictions
- ❌ Static placeholder text
- ❌ No real insights

**After AI Setup:**
- ✅ Real GPT-4 analysis
- ✅ Data-driven insights
- ✅ Personalized recommendations
- ✅ Professional reports

**Cost:** ~$0.02 per race analysis

**Setup Time:** 5 minutes

**Result:** Production-ready AI racing assistant! 🏎️🤖
