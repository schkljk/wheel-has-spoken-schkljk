// Charisma in story events (Phase 4, upgrade 17): every encounter has one extra option that a charming enough
// fighter can take. `need` is in the charisma the card shows (the stat x5). Effects live in game/story.ts.

export interface TalkOption {
  need: number;
  /** the option, and what it does */
  l: string;
  s: string;
  cost?: number;
  /** what happens, in the event's voice */
  done: string;
}

export const EVENT_TALK: Record<string, TalkOption> = {
  promoter: { need: 45, l: 'Talk him into a real deal', s: '+25 coins, no strings attached', done: 'He pays you to win instead. Same sunglasses, new respect.' },
  doctor: { need: 35, l: 'Charm a discount', s: 'Free full treatment: full HP, injuries cured', done: 'The license is still suspicious. The treatment is free.' },
  street: { need: 50, l: 'Talk them down', s: '+4 fame and no fight', done: 'Turns out they just wanted someone to talk to. You leave with a new fan.' },
  mystery: { need: 55, l: 'Sweet-talk the wheel', s: 'A random blessing, no spin needed', done: 'You whisper something to the wheel. It blushes. Nobody spins anything.' },
  trainer: { need: 50, l: 'Ask for the secret technique', s: '+1 strength and +1 speed for good, lose 30% HP', done: 'He teaches you the move. You will never stop feeling it in your knees.' },
  gambler: { need: 40, l: 'Stare them down, then bet 10', s: '10 coins: a 70% chance to win 20', cost: 10, done: '' },
  shrine: { need: 30, l: 'Pray, but charmingly', s: 'Heal 40% HP', done: 'The shrine glows a little brighter for you. Flattery works on deities too.' },
  spy: { need: 45, l: 'Get the intel for free', s: 'Read your next opponent 25% better, no charge', done: 'They tell you everything. They also tell you about their divorce.' },
  fans: { need: 30, l: 'Work the crowd', s: '+12 coins and +5 fame, no HP lost', done: 'You wave, you pose, you leave. They will talk about this for weeks.' },
  ambush: { need: 60, l: 'Talk your way out', s: '+2 fame and no fight', done: 'They came for a fight. They leave with your autograph.' },
  smith: { need: 40, l: 'Haggle', s: '6 coins: +1 weapon mastery for good', cost: 6, done: 'Half price, full sharpness. The smith is still not sure how that happened.' },
  box: { need: 55, l: 'Ask the box politely', s: 'A loot spin with no chance of a bite', done: '' },
};
