import { CEFRLevel, GeneratedContent, Length, PracticeObjective, PracticeTopic } from '@/types';
import { getObjectiveLabel, getTopicLabel, requiresTechnicalVocabulary } from '@/config/ai-generation/personalizationConfig';

interface FallbackParams {
  cefrLevel: CEFRLevel;
  topic: PracticeTopic;
  objective: PracticeObjective;
  length: Length;
  weakWords?: string[];
}

const technicalVocabularyByTopic: Partial<Record<PracticeTopic, string[]>> = {
  engineering: ['system', 'deploy', 'review', 'debug', 'release', 'pipeline'],
  maintenance: ['inspect', 'repair', 'equipment', 'schedule', 'safety', 'issue'],
  automation: ['script', 'workflow', 'trigger', 'monitor', 'alert', 'pipeline'],
  'technical-vocabulary': ['process', 'configure', 'monitor', 'optimize', 'system', 'status'],
};

const topicBanks: Record<PracticeTopic, Record<CEFRLevel, string>> = {
  'daily-conversation': {
    A1: 'Every morning, I make coffee and check my bag. I say hello to my neighbor. We talk about the weather and our plans for the day.',
    A2: 'Maya meets her friend after work. They choose a small cafe near the station and talk about food, music, and weekend plans.',
    B1: 'After a busy day, Daniel calls his sister and tells her about a small problem at work. She listens carefully and gives him simple advice.',
    B2: 'During lunch, two friends discuss how their routines have changed since they started working from home three days a week.',
    C1: 'The conversation moved from ordinary weekend plans to how small daily habits can quietly shape confidence, discipline, and long-term motivation.',
  },
  work: {
    A1: 'I start work at nine. I read my list and open my email. My team is friendly, and we help each other every day.',
    A2: 'The team has a short meeting in the morning. Everyone shares one task, one question, and one update before they start work.',
    B1: 'At work, Laura prepares a report for her manager. She checks the numbers, writes clear notes, and sends the file before lunch.',
    B2: 'The project team reviews the deadline, compares two options, and agrees to reduce the scope so the most important work can ship on time.',
    C1: 'The manager encouraged the team to clarify ownership, document decisions, and communicate risks before small delays became expensive problems.',
  },
  travel: {
    A1: 'I go to the airport with my small bag. I show my ticket and ask for the gate. The flight is on time.',
    A2: 'Nina arrives at the hotel and asks for a quiet room. The receptionist gives her a map and explains the breakfast time.',
    B1: 'When the train is delayed, Omar checks the schedule and asks a staff member which platform he should use next.',
    B2: 'The travelers changed their route after heavy rain closed the mountain road, but they still reached the city before evening.',
    C1: 'Although the itinerary was carefully planned, the best moments came from unexpected conversations in stations, markets, and quiet side streets.',
  },
  'job-interview': {
    A1: 'I am ready for my interview. I can talk about my work, my skills, and why I want the job.',
    A2: 'Sara practices her answers before the interview. She explains her experience and asks one clear question about the role.',
    B1: 'During the interview, Mateo describes a project where he solved a problem, helped his team, and learned from feedback.',
    B2: 'The candidate explains how she prioritizes tasks, communicates blockers early, and stays calm when a deadline changes suddenly.',
    C1: 'Rather than listing responsibilities, the candidate connected each achievement to measurable impact, team alignment, and thoughtful decision-making.',
  },
  emails: {
    A1: 'Hello Ana, thank you for your message. I can meet on Friday at ten. Please send me the address.',
    A2: 'Hi team, I finished the first task today. I will check the document tomorrow and send an update before noon.',
    B1: 'Dear Alex, I reviewed the proposal and added comments to the document. Could you check the budget section before our meeting?',
    B2: 'Hello team, the client approved the timeline, but they asked for a clearer summary of the risks before we confirm the final date.',
    C1: 'Dear colleagues, after reviewing the latest requirements, I suggest that we confirm priorities before committing to a revised delivery schedule.',
  },
  meetings: {
    A1: 'The meeting starts at ten. We talk about work for today. I write two notes and ask one question.',
    A2: 'In the meeting, each person gives a short update. The team chooses the next task and confirms the deadline.',
    B1: 'The meeting begins with a quick review of last week. Then the team discusses blockers and assigns two action items.',
    B2: 'During the planning meeting, the team compares customer feedback with technical effort and decides which feature should come first.',
    C1: 'The meeting was useful because the team challenged assumptions, clarified trade-offs, and left with decisions instead of vague intentions.',
  },
  engineering: {
    A1: 'The app has a small bug. I check the code and ask my team for help. We fix it today.',
    A2: 'The engineer tests the page before release. She finds one error, fixes the code, and deploys the update.',
    B1: 'The team reviews a service that sometimes fails at night. They add logs, test the fix, and monitor the system after deploy.',
    B2: 'After the deployment, the engineers noticed higher latency, checked the pipeline, and rolled back one change while they investigated the logs.',
    C1: 'The architecture review focused on reliability, observability, and the cost of adding complexity before the product had clear traffic patterns.',
  },
  maintenance: {
    A1: 'The machine is loud today. I stop it and call the maintenance team. They check the part.',
    A2: 'Before work starts, the technician inspects the equipment, cleans the filter, and writes a short safety note.',
    B1: 'The maintenance team follows a weekly checklist. They inspect each pump, record the pressure, and replace worn parts quickly.',
    B2: 'A small vibration warning helped the team schedule maintenance before the equipment failed during a critical production shift.',
    C1: 'Preventive maintenance reduced downtime because technicians used inspection data to predict failures instead of reacting to emergencies.',
  },
  automation: {
    A1: 'The script saves time. It opens the file, checks the name, and sends a message.',
    A2: 'The team uses automation for simple reports. A script collects data every morning and sends an alert if something is wrong.',
    B1: 'The automation workflow checks new orders, updates the spreadsheet, and notifies the team when a payment needs review.',
    B2: 'The pipeline runs tests automatically, creates a report, and blocks the release when a critical check fails.',
    C1: 'Good automation removes repeated work, but it also needs monitoring, clear ownership, and safe recovery when an edge case appears.',
  },
  'technical-vocabulary': {
    A1: 'A system is a group of parts. A status tells us if something is ready, slow, or broken.',
    A2: 'A developer can configure a tool, monitor the result, and update the settings when the process changes.',
    B1: 'The team uses a dashboard to monitor system status. When an alert appears, they check logs and decide what to fix first.',
    B2: 'Clear technical vocabulary helps engineers describe failures, compare solutions, and explain why a configuration should change.',
    C1: 'Precise terminology matters because vague descriptions hide risk, slow diagnosis, and make technical decisions harder to challenge.',
  },
};

function expandForLength(text: string, length: Length, level: CEFRLevel, topicLabel: string, objectiveLabel: string): string {
  if (length === 'short') {
    return text;
  }

  const medium = `${text} This practice focuses on ${objectiveLabel.toLowerCase()} in a ${topicLabel.toLowerCase()} context. Type each sentence carefully and notice the important words.`;
  if (length === 'medium') {
    return medium;
  }

  const extra = level === 'A1' || level === 'A2'
    ? 'Use a steady rhythm. Read one sentence, type it, and then move to the next sentence without rushing.'
    : 'The passage is designed to feel natural while still giving you repeated exposure to useful patterns, accurate spelling, and practical vocabulary.';

  return `${medium} ${extra}`;
}

export function createFallbackPracticeText(params: FallbackParams): GeneratedContent {
  const topicLabel = getTopicLabel(params.topic);
  const objectiveLabel = getObjectiveLabel(params.objective);
  const weakWords = (params.weakWords ?? []).slice(0, 6);
  const technicalVocabulary = requiresTechnicalVocabulary(params.topic, params.objective)
    ? technicalVocabularyByTopic[params.topic] ?? technicalVocabularyByTopic['technical-vocabulary'] ?? []
    : [];
  const weakWordsSentence = weakWords.length > 0
    ? ` Review words: ${weakWords.join(', ')}.`
    : '';
  const text = expandForLength(
    `${topicBanks[params.topic][params.cefrLevel]}${weakWordsSentence}`,
    params.length,
    params.cefrLevel,
    topicLabel,
    objectiveLabel
  );
  const keywordsUsed = [...technicalVocabulary.slice(0, 6), ...weakWords].slice(0, 10);

  return {
    id: crypto.randomUUID(),
    title: `${topicLabel} Practice`,
    text,
    cefrLevel: params.cefrLevel,
    topic: params.topic,
    objective: params.objective,
    length: params.length,
    keyVocabulary: keywordsUsed,
    keywordsUsed,
    suggestedBlankWords: weakWords,
    estimatedDifficulty: `${params.cefrLevel} ${objectiveLabel}`,
    generationSource: 'fallback',
    weakWordsUsed: weakWords,
    technicalVocabularyUsed: technicalVocabulary,
    createdAt: new Date(),
  };
}
