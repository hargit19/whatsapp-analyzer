export interface ChatMessage {
    timestamp: Date;
    content: string;
    type: 'link' | 'quote' | 'note' | 'reading_list' | 'design_inspiration' | 'tech_stack' | 'personal_reflection' | 'motivation' | 'other';
  }
  
  export interface AnalysisResult {
    messages: ChatMessage[];
    categories: {
      [key: string]: ChatMessage[];
    };
    timeAnalysis: {
      date: string;
      count: number;
    }[];
  }