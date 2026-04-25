// AI Mock Service - CEFR-based generation with rich content
// This service provides practice text with metadata for learning support

import { CEFRLevel, PracticeGoal, Length, GeneratedContent } from '@/types';

// Template structure with rich metadata
interface PracticeTemplate {
  text: string;
  title?: string;
  keyVocabulary: string[];
  suggestedBlankWords?: string[];
}

// Template content organized by CEFR level + Practice Goal
// Using optional chaining for partial data
const templates: Record<CEFRLevel, Record<PracticeGoal, PracticeTemplate[]>> = {
  // A1 - Beginner
  A1: {
    'daily-life': [
      { text: "I wake up at seven every morning. I have breakfast at seven thirty. Then I brush my teeth and get dressed. I leave for work at eight.", title: "My Morning Routine", keyVocabulary: ['wake up', 'breakfast', 'brush', 'teeth', 'work'], suggestedBlankWords: ['wake up', 'breakfast'] },
      { text: "My name is Sarah. I live in a small town. I work at a bookstore. I love reading books and drinking coffee.", title: "About Me", keyVocabulary: ['name', 'live', 'work', 'love', 'reading'], suggestedBlankWords: ['name', 'work'] },
      { text: "The weather is nice today. The sun is shining. I want to go for a walk in the park. Maybe I will have a picnic.", title: "Nice Weather", keyVocabulary: ['weather', 'sun', 'shining', 'walk', 'park'], suggestedBlankWords: ['weather', 'park'] },
    ],
    'daily-conversations': [
      { text: "Hello! How are you? I am fine, thank you. What is your name? My name is Tom. Nice to meet you!", title: "Meeting Someone", keyVocabulary: ['hello', 'how are you', 'fine', 'thank you', 'name'], suggestedBlankWords: ['hello', 'name'] },
      { text: "A: Good morning! Can I help you? B: Yes, please. I would like a coffee. A: Would you like milk? B: No, thank you. Just black coffee.", title: "At a Coffee Shop", keyVocabulary: ['help', 'would like', 'coffee', 'milk', 'black'], suggestedBlankWords: ['help', 'coffee'] },
    ],
    'common-verbs': [
      { text: "I go to the park every day. I like to run. My dog runs with me. We play ball. Then we go home.", title: "At the Park", keyVocabulary: ['go', 'run', 'play', 'home', 'like'], suggestedBlankWords: ['go', 'run'] },
    ],
    'question-answer': [
      { text: "Q: What is your name? A: My name is Sarah. Q: Where do you live? A: I live in London. Q: What do you do? A: I am a teacher.", title: "Basic Interview", keyVocabulary: ['what', 'name', 'live', 'do', 'teacher'], suggestedBlankWords: ['name', 'teacher'] },
    ],
    'office': [],
    'technology': [],
    'travel': [],
    'stories': [],
    'general': [],
    'work-vocabulary': [],
    'professional-emails': [],
    'technical-texts': [],
  },

  // A2 - Elementary
  A2: {
    'daily-life': [
      { text: "I usually have breakfast at home. Sometimes I eat cereal or toast. I drink orange juice. Then I brush my teeth and get dressed for work.", title: "Breakfast Time", keyVocabulary: ['usually', 'sometimes', 'cereal', 'toast', 'orange juice'], suggestedBlankWords: ['usually', 'cereal'] },
      { text: "I live in a small apartment near the city center. It has two bedrooms, a living room, and a kitchen. The apartment is on the third floor.", title: "My Apartment", keyVocabulary: ['apartment', 'center', 'bedrooms', 'living room', 'kitchen'], suggestedBlankWords: ['apartment', 'center'] },
    ],
    'daily-conversations': [
      { text: "A: Excuse me, where is the train station? B: The station? It is straight ahead, then turn left. A: Thank you very much! B: You are welcome!", title: "Directions", keyVocabulary: ['excuse me', 'straight ahead', 'turn left', 'thank you', 'welcome'], suggestedBlankWords: ['excuse me', 'turn left'] },
      { text: "A: Hi! Do you have a table for two? B: Yes, of course. Follow me. A: Thank you. B: Here are the menus.", title: "At a Restaurant", keyVocabulary: ['table', 'follow me', 'menus', 'thank you'], suggestedBlankWords: ['table', 'menus'] },
    ],
    'common-verbs': [
      { text: "I can swim very well. I learned when I was ten. Now I swim every weekend at the pool. My brother can swim too, but he prefers running.", title: "Swimming", keyVocabulary: ['can', 'swim', 'learned', 'weekend', 'prefers'], suggestedBlankWords: ['can', 'swim'] },
    ],
    'work-vocabulary': [
      { text: "I work at a bookstore. My job is to help customers find books. I also organize the shelves and work at the register.", title: "My Part-Time Job", keyVocabulary: ['work', 'bookstore', 'customers', 'help', 'organize', 'shelves'], suggestedBlankWords: ['work', 'help'] },
    ],
    'question-answer': [
      { text: "Q: What do you do on weekends? A: On weekends, I usually visit my family. We have lunch together. Sometimes we go for a walk.", title: "Weekend Activities", keyVocabulary: ['weekends', 'visit', 'family', 'lunch', 'together'], suggestedBlankWords: ['weekends', 'visit'] },
    ],
    'office': [],
    'technology': [],
    'travel': [],
    'stories': [],
    'general': [],
    'professional-emails': [],
    'technical-texts': [],
  },

  // B1 - Intermediate
  B1: {
    'daily-life': [
      { text: "Unlike most of my friends, I've always been an early bird. I tend to be most productive in the morning hours when the house is quiet.", title: "Morning Person", keyVocabulary: ['unlike', 'early bird', 'productive', 'morning hours', 'quiet', 'adjust'], suggestedBlankWords: ['early bird', 'productive'] },
      { text: "Living in the city has its advantages and disadvantages. While there's always something happening, the noise and crowds can be overwhelming.", title: "City Living", keyVocabulary: ['advantages', 'disadvantages', 'entertainment', 'overwhelming', 'tranquility', 'hometown'], suggestedBlankWords: ['advantages', 'tranquility'] },
      { text: "My daily commute takes about forty-five minutes by train. I usually read books or listen to podcasts to make productive use of the journey.", title: "My Daily Commute", keyVocabulary: ['commute', 'productive', 'journey', 'crowded', 'rush hour', 'regular commuters'], suggestedBlankWords: ['commute', 'productive'] },
    ],
    'office': [
      { text: "As a project coordinator, I'm responsible for ensuring team collaboration and meeting deadlines. This requires excellent communication skills.", title: "My Role", keyVocabulary: ['project coordinator', 'team collaboration', 'deadlines', 'communication', 'multitask'], suggestedBlankWords: ['deadlines', 'communication'] },
      { text: "Effective workplace communication goes beyond sending emails. It involves active listening and providing constructive feedback.", title: "Workplace Communication", keyVocabulary: ['workplace', 'active listening', 'constructive feedback', 'misunderstandings', 'colleagues'], suggestedBlankWords: ['feedback', 'colleagues'] },
    ],
    'professional-emails': [
      { text: "Dear Ms. Johnson, Thank you for your email regarding the meeting scheduled for next Tuesday. I am confirming my attendance.", title: "Email Confirmation", keyVocabulary: ['regarding', 'scheduled', 'confirming', 'attendance', 'agenda'], suggestedBlankWords: ['regarding', 'agenda'] },
      { text: "Dear Team, I wanted to follow up on our discussion from yesterday's meeting. After reviewing the requirements, I believe we need more time.", title: "Follow-Up Email", keyVocabulary: ['follow up', 'discussion', 'review', 'requirements', 'deadline'], suggestedBlankWords: ['follow up', 'deadline'] },
    ],
    'technology': [
      { text: "Artificial intelligence is transforming industries across the board. From healthcare to finance, AI applications are enabling innovations that seemed impossible.", title: "AI Revolution", keyVocabulary: ['transforming', 'industries', 'streamlining', 'innovations', 'ethical'], suggestedBlankWords: ['transforming', 'ethical'] },
    ],
    'travel': [
      { text: "Backpacking through Southeast Asia was a transformative experience. The region's rich cultural diversity and stunning landscapes make it ideal for travelers.", title: "Southeast Asia Adventure", keyVocabulary: ['backpacking', 'transformative', 'cultural diversity', 'stunning landscapes', 'budget travelers'], suggestedBlankWords: ['diversity', 'landscapes'] },
    ],
    'question-answer': [
      { text: "Q: What do you enjoy most about your job? A: What I enjoy most is the variety of projects. Every day brings new challenges and opportunities to learn.", title: "Job Satisfaction", keyVocabulary: ['enjoy', 'variety', 'projects', 'challenges', 'opportunities', 'team'], suggestedBlankWords: ['variety', 'challenges'] },
    ],
    'daily-conversations': [],
    'common-verbs': [],
    'stories': [],
    'general': [],
    'work-vocabulary': [],
    'technical-texts': [],
  },

  // B2 - Upper Intermediate
  B2: {
    'daily-life': [
      { text: "The philosophy of minimalism challenges our assumptions about success and fulfillment. Rather than pursuing endless accumulation, minimalists advocate for intentional curation of one's possessions and commitments.", title: "The Minimalist Philosophy", keyVocabulary: ['minimalism', 'assumptions', 'fulfillment', 'accumulation', 'intentional', 'curation'], suggestedBlankWords: ['minimalism', 'curation'] },
      { text: "Intergenerational relationships have evolved dramatically in recent decades. Extended lifespans mean four generations may coexist, each bringing distinct perspectives.", title: "Generations Together", keyVocabulary: ['intergenerational', 'coexist', 'distinct perspectives', 'wisdom', 'adaptability'], suggestedBlankWords: ['wisdom', 'adaptability'] },
    ],
    'professional-emails': [
      { text: "Dear Mr. Williams, I am writing to follow up on our conversation from last week's conference. I have attached the proposal document for your review.", title: "Conference Follow-Up", keyVocabulary: ['follow up', 'conference', 'attached', 'proposal', 'review', 'clarification'], suggestedBlankWords: ['attached', 'clarification'] },
      { text: "Dear Hiring Manager, I am writing to express my strong interest in the Senior Project Manager position. With over seven years of experience leading cross-functional teams...", title: "Job Application", keyVocabulary: ['express interest', 'cross-functional teams', 'comprehensive skill set', 'deliverables', 'high quality standards'], suggestedBlankWords: ['deliverables', 'quality'] },
    ],
    'technical-texts': [
      { text: "Blockchain technology's potential extends far beyond cryptocurrency applications. Its decentralized nature offers solutions for supply chain transparency and identity verification.", title: "Blockchain Beyond Crypto", keyVocabulary: ['decentralized', 'immutable', 'supply chain', 'transparency', 'scalability', 'regulatory'], suggestedBlankWords: ['decentralized', 'scalability'] },
      { text: "The concentration of power among technology giants represents an unprecedented challenge to democratic institutions. These corporations control critical infrastructure.", title: "Big Tech and Democracy", keyVocabulary: ['concentration', 'unprecedented', 'democratic institutions', 'critical infrastructure', 'antitrust'], suggestedBlankWords: ['infrastructure', 'antitrust'] },
    ],
    'office': [],
    'technology': [],
    'travel': [],
    'stories': [],
    'general': [],
    'daily-conversations': [],
    'common-verbs': [],
    'work-vocabulary': [],
    'question-answer': [],
  },

  // C1 - Advanced
  C1: {
    'daily-life': [
      { text: "The paradox of modern existence lies in our unprecedented connectivity alongside profound isolation. Despite technological advancements enabling instant communication, many experience disconnection.", title: "The Modern Paradox", keyVocabulary: ['paradox', 'unprecedented connectivity', 'profound isolation', 'disconnection', 'communities'], suggestedBlankWords: ['paradox', 'disconnection'] },
      { text: "Consumer culture has insidiously redefined happiness as acquisition rather than experience. This reification of material possessions creates a perpetual state of dissatisfaction.", title: "Consumer Culture Critique", keyVocabulary: ['consumer culture', 'insidiously', 'reification', 'perpetual dissatisfaction', 'hedonic treadmill'], suggestedBlankWords: ['hedonic treadmill', 'dissatisfaction'] },
    ],
    'professional-emails': [
      { text: "Dear stakeholders, As we approach the conclusion of this quarter, I want to address the organizational restructuring that has been underway. These adjustments are precisely calibrated to enhance operational efficiency.", title: "Organizational Restructuring", keyVocabulary: ['stakeholders', 'organizational restructuring', 'precisely calibrated', 'operational efficiency', 'meticulous analysis', 'downstream implications'], suggestedBlankWords: ['calibrated', 'downstream'] },
    ],
    'technical-texts': [
      { text: "The acceleration of artificial intelligence development raises fundamental questions about creativity, consciousness, and ultimately what it means to be human.", title: "AI and Human Uniqueness", keyVocabulary: ['acceleration', 'creativity', 'consciousness', 'sophisticated capabilities', 'fundamental revision', 'human uniqueness'], suggestedBlankWords: ['consciousness', 'uniqueness'] },
    ],
    'office': [],
    'technology': [],
    'travel': [],
    'stories': [],
    'general': [],
    'daily-conversations': [],
    'common-verbs': [],
    'work-vocabulary': [],
    'question-answer': [],
  },
};

// Get templates with fallback
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTemplates(cefr: CEFRLevel, goal: PracticeGoal, length: Length): PracticeTemplate[] {
  const goalTemplates = templates[cefr]?.[goal];
  
  if (goalTemplates && goalTemplates.length > 0) {
    return goalTemplates;
  }
  
  // Fallback to 'general' goal
  const generalFallback = templates[cefr]?.['general'];
  if (generalFallback && generalFallback.length > 0) {
    return generalFallback;
  }
  
  // Fallback to daily-life
  const dailyLifeFallback = templates[cefr]?.['daily-life'];
  if (dailyLifeFallback && dailyLifeFallback.length > 0) {
    return dailyLifeFallback;
  }
  
  // Fallback to B1 as default
  return templates.B1?.['daily-life'] || [];
}

// Difficulty estimation based on CEFR
const difficultyMap: Record<CEFRLevel, number> = {
  A1: 2,
  A2: 4,
  B1: 6,
  B2: 7,
  C1: 9,
};

/**
 * Generate practice text with rich metadata
 * Ready to be replaced with real AI API
 */
export async function generatePracticeText(params: {
  cefrLevel: CEFRLevel;
  practiceGoal: PracticeGoal;
  length: Length;
}): Promise<GeneratedContent> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const { cefrLevel, practiceGoal, length } = params;
  
  // Get templates for the combination
  const availableTemplates = getTemplates(cefrLevel, practiceGoal, length);
  
  // Pick random template
  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
  
  // Fallback content if no template exists
  const fallbackText = getFallbackContent(cefrLevel, practiceGoal, length);
  const finalTemplate = template || fallbackText;
  
  return {
    id: `ai_${Date.now()}`,
    title: finalTemplate.title,
    text: finalTemplate.text,
    cefrLevel,
    practiceGoal,
    length,
    keyVocabulary: finalTemplate.keyVocabulary,
    suggestedBlankWords: finalTemplate.suggestedBlankWords,
    estimatedDifficulty: `${cefrLevel} difficulty ${difficultyMap[cefrLevel]}/10`,
    createdAt: new Date(),
  };
}

// Fallback content generator
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFallbackContent(_cefr: CEFRLevel, _goal: PracticeGoal, _length: Length): PracticeTemplate {
  const fallbacks: Record<CEFRLevel, string> = {
    A1: "This is a simple practice text for beginners. It uses basic vocabulary and short sentences. You can practice typing common words and phrases.",
    A2: "This practice text is designed for elementary learners. It includes everyday vocabulary and straightforward grammar structures to help you improve your typing skills.",
    B1: "This intermediate-level text provides good practice for learners who are progressing beyond basic English. The content includes varied vocabulary and more complex sentence structures.",
    B2: "This upper-intermediate text challenges advanced learners with sophisticated vocabulary and complex grammatical constructions. Focus on accuracy while maintaining your typing speed.",
    C1: "This advanced text is designed for proficient users seeking to refine their skills. It incorporates nuanced expressions, abstract concepts, and high-level vocabulary.",
  };
  
  return {
    text: fallbacks[_cefr],
    title: `${_cefr} Practice`,
    keyVocabulary: ['practice', 'typing', 'vocabulary', 'learn', 'improve'],
    suggestedBlankWords: ['practice', 'vocabulary'],
  };
}

// Legacy function for backward compatibility
export async function generateLegacyPracticeText(params: {
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  length: Length;
}): Promise<GeneratedContent> {
  const cefrMap: Record<string, CEFRLevel> = {
    beginner: 'A2',
    intermediate: 'B1',
    advanced: 'C1',
  };
  
  const cefr = cefrMap[params.level] || 'B1';
  
  const goalMap: Record<string, PracticeGoal> = {
    'daily-life': 'daily-life',
    'office': 'office',
    'technology': 'technology',
    'travel': 'travel',
    'stories': 'stories',
    'general': 'general',
  };
  
  const practiceGoal = goalMap[params.category] || 'general';
  
  return generatePracticeText({ cefrLevel: cefr, practiceGoal, length: params.length });
}
