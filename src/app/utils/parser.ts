import { ChatMessage, AnalysisResult } from '../types/types';

const categorizeMessages = (messages: ChatMessage[]) => {
  return messages.reduce((acc: { [key: string]: ChatMessage[] }, message) => {
    const type = message.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(message);
    return acc;
  }, {});
};

const analyzeTimeDistribution = (messages: ChatMessage[]) => {
  const dailyCount: { [key: string]: number } = {};
  
  messages.forEach(message => {
    const date = message.timestamp.toISOString().split('T')[0];
    dailyCount[date] = (dailyCount[date] || 0) + 1;
  });

  return Object.entries(dailyCount)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const determineMessageType = (content: string): ChatMessage['type'] => {
  const lowerContent = content.toLowerCase();
  
  if (content.includes('https://dribbble.com') || 
      content.includes('design inspiration:')) {
    return 'design_inspiration';
  }
  if (content.includes('stack research:') || 
      (content.includes('https://') && 
       (content.includes('docs.') || content.includes('/docs/')))) {
    return 'tech_stack';
  }
  if (lowerContent.includes('reading list:') || 
      lowerContent.includes('must read later:')) {
    return 'reading_list';
  }
  if (lowerContent.includes('journal entry:') || 
      lowerContent.includes('note to self:') || 
      lowerContent.includes('brain dump:')) {
    return 'note';
  }
  if (content.match(/".*?".*?-/)) {
    return 'quote';
  }
  if (content.includes('http')) {
    return 'link';
  }
  return 'other';
};

export const parseChat = (content: string): AnalysisResult => {
  const messages: ChatMessage[] = [];
  const lines = content.split('\n');
  let currentMessage: Partial<ChatMessage> = {};
  let messageContent: string[] = [];

  lines.forEach((line) => {
    const timestampMatch = line.match(/\[(.*?)\] you: (.*)/);
    
    if (timestampMatch) {
      // If we have a previous message, save it
      if (currentMessage.timestamp && messageContent.length > 0) {
        messages.push({
          timestamp: currentMessage.timestamp as Date,
          content: messageContent.join('\n'),
          type: determineMessageType(messageContent.join('\n'))
        });
      }
      
      // Start new message
      currentMessage = {
        timestamp: new Date(timestampMatch[1])
      };
      messageContent = [timestampMatch[2]];
    } else if (line.trim() && currentMessage.timestamp) {
      // Append content to current message
      messageContent.push(line.trim());
    }
  });

  // Don't forget the last message
  if (currentMessage.timestamp && messageContent.length > 0) {
    messages.push({
      timestamp: currentMessage.timestamp as Date,
      content: messageContent.join('\n'),
      type: determineMessageType(messageContent.join('\n'))
    });
  }

  const categories = categorizeMessages(messages);
  const timeAnalysis = analyzeTimeDistribution(messages);

  return { messages, categories, timeAnalysis };
};