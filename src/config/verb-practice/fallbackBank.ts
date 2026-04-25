import { VerbPracticeItem, VerbPracticeTrack } from '@/types';

export const verbPracticeTracks = [
  'A1',
  'A2',
  'B1',
  'B2',
  'C1',
  'technical-engineering',
] as const satisfies readonly VerbPracticeTrack[];

export const MIN_VERB_COUNT = 1;
export const MAX_VERB_COUNT = 30;

const items = {
  A1: [
    ['be', 'ser / estar', 'I want to be ready.'],
    ['have', 'tener', 'I have a question.'],
    ['go', 'ir', 'We go home.'],
    ['come', 'venir', 'They come here.'],
    ['make', 'hacer', 'I make coffee.'],
    ['do', 'hacer', 'Please do the task.'],
    ['see', 'ver', 'I see the answer.'],
    ['like', 'gustar', 'I like this book.'],
    ['want', 'querer', 'They want water.'],
    ['need', 'necesitar', 'We need help.'],
  ],
  A2: [
    ['bring', 'traer', 'Bring your notes.'],
    ['choose', 'elegir', 'Choose the correct word.'],
    ['forget', 'olvidar', 'Do not forget the key.'],
    ['remember', 'recordar', 'Remember the meeting.'],
    ['travel', 'viajar', 'They travel by train.'],
    ['wait', 'esperar', 'Wait for the bus.'],
    ['learn', 'aprender', 'We learn English.'],
    ['explain', 'explicar', 'Explain the rule.'],
    ['invite', 'invitar', 'Invite your friend.'],
    ['finish', 'terminar', 'Finish the exercise.'],
  ],
  B1: [
    ['improve', 'mejorar', 'Practice can improve fluency.'],
    ['manage', 'gestionar', 'She manages the schedule.'],
    ['compare', 'comparar', 'Compare both options.'],
    ['develop', 'desarrollar', 'They develop new skills.'],
    ['reduce', 'reducir', 'Reduce the number of errors.'],
    ['increase', 'aumentar', 'Increase your typing speed.'],
    ['support', 'apoyar', 'The team supports the plan.'],
    ['prepare', 'preparar', 'Prepare before the interview.'],
    ['solve', 'resolver', 'Solve the problem step by step.'],
    ['avoid', 'evitar', 'Avoid repeated mistakes.'],
  ],
  B2: [
    ['achieve', 'lograr', 'They achieved better results.'],
    ['assess', 'evaluar', 'Assess the current process.'],
    ['negotiate', 'negociar', 'We negotiated the deadline.'],
    ['prioritize', 'priorizar', 'Prioritize the urgent tasks.'],
    ['recommend', 'recomendar', 'I recommend a simpler approach.'],
    ['resolve', 'resolver', 'Resolve the conflict clearly.'],
    ['maintain', 'mantener', 'Maintain consistent progress.'],
    ['coordinate', 'coordinar', 'Coordinate the release plan.'],
    ['adapt', 'adaptar', 'Adapt the message to the audience.'],
    ['clarify', 'aclarar', 'Clarify the expected outcome.'],
  ],
  C1: [
    ['acknowledge', 'reconocer', 'Acknowledge the trade-off openly.'],
    ['undermine', 'socavar', 'Poor feedback can undermine trust.'],
    ['streamline', 'optimizar', 'Streamline the approval process.'],
    ['anticipate', 'anticipar', 'Anticipate possible objections.'],
    ['articulate', 'articular / expresar', 'Articulate the strategy precisely.'],
    ['mitigate', 'mitigar', 'Mitigate the operational risk.'],
    ['scrutinize', 'examinar detenidamente', 'Scrutinize the final contract.'],
    ['sustain', 'sostener', 'Sustain momentum over time.'],
    ['convey', 'transmitir', 'Convey the message clearly.'],
    ['reconcile', 'conciliar', 'Reconcile the two perspectives.'],
  ],
  'technical-engineering': [
    ['deploy', 'desplegar', 'Deploy the service after review.'],
    ['debug', 'depurar', 'Debug the failing request.'],
    ['compile', 'compilar', 'Compile the project locally.'],
    ['refactor', 'refactorizar', 'Refactor the duplicated logic.'],
    ['configure', 'configurar', 'Configure the environment variables.'],
    ['optimize', 'optimizar', 'Optimize the database query.'],
    ['encrypt', 'cifrar', 'Encrypt sensitive payloads.'],
    ['authenticate', 'autenticar', 'Authenticate the current user.'],
    ['serialize', 'serializar', 'Serialize the response safely.'],
    ['validate', 'validar', 'Validate input before saving.'],
    ['rollback', 'revertir', 'Rollback the failed deployment.'],
    ['provision', 'aprovisionar', 'Provision the cloud resources.'],
  ],
} as const satisfies Record<VerbPracticeTrack, readonly (readonly [string, string, string])[]>;

export const fallbackVerbBank: Record<VerbPracticeTrack, VerbPracticeItem[]> = Object.fromEntries(
  Object.entries(items).map(([track, entries]) => [
    track,
    entries.map(([text, translationEs, example], index) => ({
      id: `${track.toLowerCase()}-${index + 1}`,
      text,
      translationEs,
      example,
      track: track as VerbPracticeTrack,
    })),
  ])
) as Record<VerbPracticeTrack, VerbPracticeItem[]>;
