import { PracticeObjective, PracticeTopic } from '@/types';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  prompt: string;
}

export const topicOptions: SelectOption<PracticeTopic>[] = [
  { value: 'daily-conversation', label: 'Daily conversation', prompt: 'everyday conversations, routines, simple opinions, and practical social situations' },
  { value: 'work', label: 'Work', prompt: 'realistic workplace communication, tasks, schedules, and collaboration' },
  { value: 'travel', label: 'Travel', prompt: 'transportation, hotels, directions, airports, and trip planning' },
  { value: 'job-interview', label: 'Job interview', prompt: 'job interview questions, skills, experience, and professional introductions' },
  { value: 'emails', label: 'Emails', prompt: 'clear professional email language, requests, follow-ups, and updates' },
  { value: 'meetings', label: 'Meetings', prompt: 'meeting agendas, updates, decisions, questions, and action items' },
  { value: 'engineering', label: 'Engineering', prompt: 'engineering work, systems, code, incidents, design, testing, and deployment' },
  { value: 'maintenance', label: 'Maintenance', prompt: 'maintenance tasks, inspections, repairs, safety checks, and equipment status' },
  { value: 'automation', label: 'Automation', prompt: 'automation workflows, scripts, monitoring, alerts, pipelines, and repeated tasks' },
  { value: 'technical-vocabulary', label: 'Technical vocabulary', prompt: 'technical vocabulary used naturally in a practical explanation or scenario' },
];

export const objectiveOptions: SelectOption<PracticeObjective>[] = [
  { value: 'vocabulary', label: 'Vocabulary', prompt: 'introduce and repeat useful vocabulary naturally without sounding robotic' },
  { value: 'reading-fluency', label: 'Reading fluency', prompt: 'create smooth connected sentences that are comfortable to type and read aloud' },
  { value: 'spelling-accuracy', label: 'Spelling accuracy', prompt: 'include clear words with common spelling patterns and avoid confusing punctuation' },
  { value: 'common-verbs', label: 'Common verbs', prompt: 'use frequent English verbs in meaningful context' },
  { value: 'technical-english', label: 'Technical English', prompt: 'use technical English naturally with accessible explanations' },
  { value: 'weak-words-review', label: 'Weak words review', prompt: 'review the learner weak words naturally in a coherent passage' },
  { value: 'business-english', label: 'Business English', prompt: 'use professional business English for realistic communication' },
];

export function getTopicLabel(topic: PracticeTopic): string {
  return topicOptions.find(option => option.value === topic)?.label ?? topic;
}

export function getObjectiveLabel(objective: PracticeObjective): string {
  return objectiveOptions.find(option => option.value === objective)?.label ?? objective;
}

export function getTopicPrompt(topic: PracticeTopic): string {
  return topicOptions.find(option => option.value === topic)?.prompt ?? topic;
}

export function getObjectivePrompt(objective: PracticeObjective): string {
  return objectiveOptions.find(option => option.value === objective)?.prompt ?? objective;
}

export function requiresTechnicalVocabulary(topic: PracticeTopic, objective: PracticeObjective): boolean {
  return (
    topic === 'engineering' ||
    topic === 'maintenance' ||
    topic === 'automation' ||
    topic === 'technical-vocabulary' ||
    objective === 'technical-english'
  );
}
