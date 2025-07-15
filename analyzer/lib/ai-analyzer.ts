//AI-powered analyzer using Google Gemini API

import { AnalysisResult } from './types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rate limiter for free tier (15 requests per minute)
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 15;
  private readonly timeWindow = 60000; // 1 minute

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = (oldestRequest + this.timeWindow) - now;
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

export async function analyzeTranscriptWithAI(transcriptText: string): Promise<AnalysisResult | null> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not found. AI analysis unavailable.');
    return null;
  }

  try {
    // Rate limiting
    await rateLimiter.waitIfNeeded();

    const prompt = `Analyze this earnings call transcript and return ONLY a valid JSON response with this exact structure:

{
  "managementSentiment": {
    "score": <number between 0-100, where 100 is most positive>,
    "label": <"positive" or "neutral" or "negative">,
    "summary": <brief summary of management's sentiment>
  },
  "keyThemes": <array of 3-5 key strategic themes discussed>,
  "overallTone": <"confident" or "cautious" or "mixed">
}

Guidelines:
- Score 70-100: positive (strong growth, exceeded expectations)
- Score 40-69: neutral (balanced view, some challenges)
- Score 0-39: negative (significant concerns, missed targets)
- Extract specific themes like "AI Infrastructure Leadership", "Data Center Growth", etc.
- Base analysis on actual content, not speculation

Transcript to analyze:
${transcriptText.slice(0, 100000)}`; // Gemini has 1M token context, but we limit for speed

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No response from Gemini');
    }

    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    return {
      managementSentiment: {
        score: Math.max(0, Math.min(100, analysis.managementSentiment.score)),
        label: analysis.managementSentiment.label,
        summary: analysis.managementSentiment.summary
      },
      keyThemes: Array.isArray(analysis.keyThemes) ? analysis.keyThemes.slice(0, 5) : [],
      overallTone: analysis.overallTone
    };

  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    return null;
  }
}

// Batch analysis with rate limiting
export async function batchAnalyzeWithAI(
  transcripts: Array<{ quarter: string; content: string }>
): Promise<Record<string, AnalysisResult>> {
  const results: Record<string, AnalysisResult> = {};
  
  for (const { quarter, content } of transcripts) {
    const analysis = await analyzeTranscriptWithAI(content);
    if (analysis) {
      results[quarter] = analysis;
      console.log(`✅ AI analyzed ${quarter}`);
    } else {
      console.log(`⚠️ AI analysis failed for ${quarter}`);
    }
  }
  
  return results;
}

// Compare quarters using AI insights
export async function compareQuartersWithAI(
  transcripts: Array<{ quarter: string; content: string }>
): Promise<{
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
}> {
  if (!GEMINI_API_KEY || transcripts.length < 2) {
    return { trend: 'stable', insights: ['Not enough data for AI comparison'] };
  }

  try {
    await rateLimiter.waitIfNeeded();

    const prompt = `Compare these earnings call excerpts and provide trend analysis. Return ONLY valid JSON:

{
  "trend": <"improving" or "stable" or "declining">,
  "insights": [<2-3 key insights about the progression>]
}

${transcripts.map(t => `${t.quarter}: "${t.content.slice(0, 5000)}"`).join('\n\n')}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('Comparison error:', error);
  }

  return { trend: 'stable', insights: ['AI comparison unavailable'] };
}