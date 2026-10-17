// The nemesis in the story (Phase 4, upgrade 19): they get a map step of their own, a speech that remembers
// your past fights, and lines that get more unhinged every time you meet. Rules live in game/nemesis.ts.
//
// Tokens: {where} the place of your last fight with them, {round} its round, {hp} the winner's HP left,
// {beats} how often they have beaten you, {wins} how often you have beaten them in the story, {you} your name.

/** The map step (kept apart from the ported NODE table). */
export const NODE_MORE: Record<string, { e: string; n: string; d: string }> = {
  nemesis: { e: '😈', n: 'Nemesis', d: 'They came back. They brought a speech' },
};

export type TauntKind = 'first' | 'gloat' | 'streak' | 'revenge' | 'dodged' | 'final';

/** What they say before the fight, by what happened last and how many times you have met (1st, 2nd, 3rd+). */
export const NEM_TAUNTS: Record<TauntKind, [string[], string[], string[]]> = {
  // an old nemesis with no fights on record
  first: [
    ["We've met before. You lost. I'm here to make it a tradition.", "You don't remember me. That's fine. I remember enough for both of us."],
    ['Back again. Same face, same result, same disappointment.'],
    ["I'd say it's personal, but that would imply you're a person I think about. I do. Constantly."],
  ],
  // they won the last one
  gloat: [
    ['{where}, round {round}. I had {hp} HP left. I did not need them.', 'Remember {where}? I do. I had it framed.'],
    ["Round {round} in {where}. I've watched the replay so often the tape is see-through.", "I've told everyone about {where}. Everyone. My barber knows."],
    ['I named my cat after the round I beat you in. Her name is {round}. She bites.', '{where}, round {round}. I had it tattooed. Small font. Lots of room for more.'],
  ],
  // they have won three times or more
  streak: [
    ["That's {beats}. I'm getting you a loyalty card. Tenth beating is free."],
    ["{beats} wins. At this point you're not my nemesis, you're my hobby."],
    ['{beats}. My therapist says I should let you go. She has not seen the tapes.'],
  ],
  // you won the last one
  revenge: [
    ['{where}. Round {round}. You got lucky, and the wheel knows it.', "You beat me in {where} with {hp} HP left. I've been training. Mostly crying, but also training."],
    ["I haven't slept since {where}. I have, however, done a lot of push-ups.", '{where} was a fluke. I wrote forty pages proving it. Peer-reviewed by my mom.'],
    ['I sold my house to pay for a coach after {where}. The coach is a pigeon. It is working.', 'Since {where} I only eat raw onions. For focus. Fight me before I lose my nerve.'],
  ],
  // you walked past their step last time
  dodged: [
    ['You took the other path. I waited there for six hours. With snacks. For two.'],
    ['Avoiding me? Bold. Cowardly, but bold.'],
    ["I saw you sneak past. Everyone saw. There's a song about it now. It's catchy."],
  ],
  // you have beaten them twice in the story: this is their last shot
  final: [
    ["Twice you've beaten me. One more and I retire to a farm. A sad farm."],
    ['This is it, {you}. Win and I am gone. Lose and I am never, ever going away.'],
    ['Last dance. I wrote a speech for afterwards. Two speeches, actually. One is mostly screaming.'],
  ],
};

/** What they say after the fight. */
export const NEM_AFTER = {
  /** they won */
  won: [
    "'Same time next chapter?' It wasn't a question.",
    "'{beats} and counting.' They are already planning the next one.",
    "'Don't feel bad. Actually, do.'",
  ],
  /** they lost and will be back */
  lost: [
    "'Lucky spin.' They limp off to train and come back in two chapters.",
    "'I let you win. For morale.' Back in two chapters, angrier.",
    "'Fine. FINE.' They storm off. Back in two chapters with new gear and a worse attitude.",
  ],
  /** they lost for the third time and retire */
  retired: [
    '{name} retires. They open a bakery. Every loaf is shaped like your fist.',
    '{name} hangs up the gloves. They will tell this story wrong for the rest of their life.',
  ],
};
