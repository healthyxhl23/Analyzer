//Analysis API Route
//Two endpoints: POST for analysis, GET for AI availability check
//Uses Next.js API routes with NextRequest and NextResponse
//Handles transcript analysis with optional AI support using Gemini API
//Returns JSON responses with analysis results and metadata
//Includes error handling and logging for better debugging


import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/analyzer';
import { analyzeTranscriptWithAI } from '@/lib/ai-analyzer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, useAI = false } = body;
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'No transcript provided' }, 
        { status: 400 }
      );
    }

    let analysis = null;
    let actualMethod = 'keyword-analysis';
    
    // If user wants AI analysis
    if (useAI) {
      // Check if API key exists
      if (process.env.GEMINI_API_KEY) {
        // Try AI analysis
        analysis = await analyzeTranscriptWithAI(transcript);
        if (analysis) {
          actualMethod = 'gemini-ai';
          console.log('✅ Used AI analysis');
        } else {
          console.log('⚠️ AI analysis returned null, falling back to keywords');
        }
      } else {
        console.log('⚠️ User requested AI but GEMINI_API_KEY not found');
      }
    }
    
    // If AI wasn't used or failed, use keyword analysis
    if (!analysis) {
      analysis = await analyzeTranscript(transcript);
      actualMethod = 'keyword-analysis';
      console.log('📊 Used keyword analysis');
    }
    
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis failed' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        method: actualMethod,
        aiPowered: actualMethod === 'gemini-ai',
        aiAvailable: !!process.env.GEMINI_API_KEY,
        userRequestedAI: useAI,
        transcriptLength: transcript.length
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check AI availability
export async function GET() {
  try {
    const aiAvailable = !!process.env.GEMINI_API_KEY;
    
    return NextResponse.json({
      status: 'ok',
      aiAvailable,
      service: aiAvailable ? 'gemini' : 'keyword',
      message: aiAvailable 
        ? 'Gemini API key found - AI analysis available' 
        : 'No API key found - only keyword analysis available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to check status' },
      { status: 500 }
    );
  }
}