export interface SentimentAnalysis {
    score: number; // 0-100
    label: 'positive' | 'neutral' | 'negative';
    summary: string;
  }
  
  export interface AnalysisResult {
    managementSentiment: SentimentAnalysis;
    qaSentiment?: SentimentAnalysis;
    keyThemes: string[];
    overallTone: 'confident' | 'cautious' | 'mixed';
    quarter?: string;
  }
  
  export interface TranscriptSection {
    managementRemarks: string;
    qaSection: string;
  }