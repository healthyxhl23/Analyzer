// Offline analyzer for NVIDIA earnings call transcripts

import { AnalysisResult } from './types';

export async function analyzeTranscript(transcriptText: string): Promise<AnalysisResult | null> {
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const text = transcriptText.toLowerCase();
    
    // Keyword lists for sentiment analysis
    const positiveWords = [
      'growth', 'strong', 'record', 'exceeded', 'positive', 'momentum',
      'accelerate', 'breakthrough', 'innovation', 'excellent', 'robust',
      'outperform', 'surge', 'expand', 'increase', 'improve', 'gain'
    ];
    
    const negativeWords = [
      'decline', 'challenge', 'concern', 'weak', 'difficult', 'uncertainty',
      'risk', 'pressure', 'decrease', 'slow', 'issue', 'problem', 'loss',
      'below', 'miss', 'disappoint', 'struggle', 'threat'
    ];
    
    // Count sentiment words
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex) || [];
      positiveScore += matches.length;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex) || [];
      negativeScore += matches.length;
    });
    
    // Calculate sentiment score (0-100)
    const totalSentimentWords = positiveScore + negativeScore;
    let score = 50; // neutral baseline
    
    if (totalSentimentWords > 0) {
      const positiveRatio = positiveScore / totalSentimentWords;
      score = Math.round(positiveRatio * 100);
    }
    
    // Slight boost if certain very positive phrases are found
    if (text.includes('record revenue') || text.includes('exceeded expectations')) {
      score = Math.min(100, score + 10);
    }
    
    // Theme detection
    const themes: string[] = [];
    
    // Check for AI/ML themes
    if (text.includes('ai') || text.includes('artificial intelligence') || 
        text.includes('machine learning') || text.includes('neural')) {
      themes.push('AI/ML Growth');
    }
    
    // Data center themes
    if (text.includes('data center') || text.includes('datacenter') || 
        text.includes('cloud') || text.includes('hgx') || text.includes('dgx')) {
      themes.push('Data Center Expansion');
    }
    
    // Gaming themes
    if (text.includes('gaming') || text.includes('geforce') || 
        text.includes('rtx') || text.includes('game')) {
      themes.push('Gaming Revenue');
    }
    
    // Supply chain themes
    if (text.includes('supply') || text.includes('inventory') || 
        text.includes('manufacturing') || text.includes('production')) {
      themes.push('Supply Chain Management');
    }
    
    // Automotive themes
    if (text.includes('automotive') || text.includes('self-driving') || 
        text.includes('autonomous')) {
      themes.push('Automotive Innovation');
    }
    
    // Partnership themes
    if (text.includes('partner') || text.includes('collaboration') || 
        text.includes('customer')) {
      themes.push('Strategic Partnerships');
    }
    
    // Ensure we have at least one theme
    if (themes.length === 0) {
      themes.push('General Business Performance');
    }
    
    // Take top 5 themes
    const topThemes = themes.slice(0, 5);
    
    // Determine sentiment label
    let label: 'positive' | 'neutral' | 'negative';
    if (score >= 65) {
      label = 'positive';
    } else if (score >= 35) {
      label = 'neutral';
    } else {
      label = 'negative';
    }
    
    // Determine overall tone
    let overallTone: 'confident' | 'cautious' | 'mixed';
    if (score >= 70) {
      overallTone = 'confident';
    } else if (score <= 30) {
      overallTone = 'cautious';
    } else {
      overallTone = 'mixed';
    }
    
    // Generate summary
    const summary = `Management expressed ${label} sentiment with emphasis on ${topThemes[0]}`;
    
    return {
      managementSentiment: {
        score,
        label,
        summary
      },
      keyThemes: topThemes,
      overallTone
    };
    
  } catch (error) {
    console.error('Mock analysis error:', error);
    return null;
  }
}

// Optional: Analyze Q&A section separately
export async function analyzeQASection(qaText: string): Promise<AnalysisResult['managementSentiment']> {
  // Simple analysis for Q&A
  const text = qaText.toLowerCase();
  
  // Q&A specific words that indicate defensiveness or confidence
  const confidentWords = ['absolutely', 'definitely', 'certainly', 'clearly', 'obviously'];
  const defensiveWords = ['however', 'but', 'although', 'despite', 'challenging'];
  
  let score = 50;
  confidentWords.forEach(word => {
    if (text.includes(word)) score += 5;
  });
  defensiveWords.forEach(word => {
    if (text.includes(word)) score -= 5;
  });
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    label: score >= 65 ? 'positive' : score >= 35 ? 'neutral' : 'negative',
    summary: 'Q&A session analysis based on response patterns'
  };
}