# Qwen 3.5 Integration Setup Guide

This guide will help you integrate Qwen 3.5 into your KobayashiAI racing analytics dashboard for powerful AI-driven insights.

## 🚀 Why Qwen 3.5?

- **Powerful Performance**: Qwen 3.5 offers state-of-the-art reasoning capabilities
- **Fast Response Times**: Optimized for quick analysis and coaching
- **Cost-Effective**: Competitive pricing compared to other premium models
- **OpenAI Compatible**: Easy integration with existing OpenAI SDK
- **Multilingual Support**: Excellent for international racing teams

## 📋 Prerequisites

- Node.js 18+ installed
- KobayashiAI project set up
- Alibaba Cloud account (for API access)

## 🔧 Setup Instructions

### 1. Get Your Qwen API Key

1. Visit [Alibaba Cloud Model Studio Console](https://dashscope.console.aliyun.com/)
2. Sign up or log in to your Alibaba Cloud account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key for configuration

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Qwen 3.5 API Configuration (Alibaba Cloud Model Studio)
QWEN_API_KEY=your_actual_qwen_api_key_here
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

**Important**: Replace `your_actual_qwen_api_key_here` with your actual API key from step 1.

### 3. Test the Integration

Run the test script to verify your setup:

```bash
npm run test-qwen
```

This will test both race analysis and driver coaching functionality.

### 4. Start Using Qwen 3.5

Qwen 3.5 is now integrated into your app with the following priority:

1. **Groq** (FREE & FAST) - Primary choice
2. **Qwen 3.5** (POWERFUL & FAST) - Secondary choice  
3. **DeepSeek** (FREE) - Tertiary choice
4. **Custom LLM** - Your own models
5. **Gemini** (FREE) - Google's model
6. **OpenAI** (PAID) - Final fallback

## 🏁 Features Enabled

With Qwen 3.5, you get enhanced:

### Race Analysis
- **Deeper Insights**: More sophisticated pattern recognition
- **Better Strategy**: Advanced tactical recommendations
- **Improved Predictions**: More accurate performance forecasts
- **Enhanced Context**: Better understanding of racing scenarios

### Driver Coaching  
- **Detailed Feedback**: More specific and actionable coaching
- **Technical Analysis**: Deeper understanding of driving techniques
- **Personalized Tips**: Tailored advice for individual drivers
- **Performance Trends**: Better identification of improvement areas

## 📊 Model Details

- **Model**: `qwen3.5-plus`
- **Context Window**: Large context for comprehensive analysis
- **Temperature**: 0.7 for analysis, 0.6 for coaching
- **Max Tokens**: 2000 for analysis, 2500 for coaching
- **Region**: International (Singapore endpoint)

## 🛠️ Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is copied correctly
   - Check if the key has sufficient credits
   - Ensure the key is active

2. **Connection Timeout**
   - Check your internet connection
   - Verify the BASE_URL is correct
   - Try running the test again

3. **Rate Limiting**
   - Qwen has generous rate limits
   - If hit, wait a few moments and retry
   - Consider upgrading your plan for higher limits

### Error Messages

- **401 Unauthorized**: Check your API key
- **429 Too Many Requests**: Rate limit exceeded, wait and retry
- **500 Server Error**: Temporary issue, try again
- **Timeout**: Check internet connection, increase timeout

## 📈 Performance Tips

1. **Optimize Prompts**: Keep prompts focused and specific
2. **Monitor Usage**: Track token usage for cost management
3. **Cache Results**: Consider caching frequent analyses
4. **Batch Requests**: Process multiple analyses together when possible

## 🔍 Advanced Configuration

### Custom Base URL

If you're using a different region, update the base URL:

```bash
# For US region
QWEN_BASE_URL=https://dashscope-us.aliyuncs.com/compatible-mode/v1

# For China region
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### Model Selection

You can use different Qwen models by modifying the API routes:

- `qwen3.5-plus` (recommended)
- `qwen3-max` (most powerful)
- `qwen-plus` (balanced)
- `qwen-flash` (fastest)

## 📞 Support

- **Documentation**: [Alibaba Cloud Model Studio](https://www.alibabacloud.com/help/en/model-studio/)
- **API Reference**: [Qwen API Documentation](https://qwen.ai/)
- **Community**: [GitHub Issues](https://github.com/QwenLM/Qwen3.5/issues)

## 🎉 Ready to Race!

Once configured, your KobayashiAI dashboard will leverage Qwen 3.5's powerful capabilities for:

- ⚡ **Lightning-fast race analysis**
- 🏆 **Professional driver coaching**  
- 📊 **Advanced performance insights**
- 🎯 **Strategic recommendations**

Enjoy the enhanced AI-powered racing analytics with Qwen 3.5!
