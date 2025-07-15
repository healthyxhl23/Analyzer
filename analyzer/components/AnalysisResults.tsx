//Displays analysis results with sentiment and themes

import { AnalysisResult } from '@/lib/types';

interface AnalysisDisplayProps {
  analysis: AnalysisResult | null;
  loading: boolean;
}

export default function AnalysisDisplay({ analysis, loading }: AnalysisDisplayProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Analyzing transcript...</div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold">Analysis Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Management Sentiment</h3>
          <div className={`text-3xl font-bold ${getSentimentColor(analysis.managementSentiment.label)}`}>
            {analysis.managementSentiment.score}%
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {analysis.managementSentiment.summary}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Overall Tone</h3>
          <div className="text-2xl font-bold capitalize">
            {analysis.overallTone}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-3">Key Strategic Themes</h3>
        <div className="flex flex-wrap gap-2">
          {analysis.keyThemes.map((theme, idx) => (
            <span 
              key={idx} 
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}