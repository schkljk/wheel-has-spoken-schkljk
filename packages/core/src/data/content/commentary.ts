// Hall of fame exhibitions (Phase 4, upgrade 24): two commentators call the fight. Rex does play-by-play and
// shouts; Brenda does colour and has seen it all. {x} is the fighter it's about, {y} the other one, {w} and
// {l} the winner and loser at the end.

export const COMMENTATORS = [
  { n: 'Rex Thundermic', e: '🎙️' },
  { n: 'Dr. Brenda Kneecap', e: '🩺' },
] as const;

export type CallKind = 'intro' | 'ult' | 'crit' | 'revive' | 'lowhp' | 'lead' | 'big' | 'dodge' | 'heal' | 'read' | 'quiet' | 'ko' | 'outro';

/** [Rex's lines, Brenda's lines] for each kind of moment. */
export const CALLS: Record<CallKind, [string[], string[]]> = {
  intro: [
    ['Welcome to the hall of fame! {x} versus {y}! I have been waiting all YEAR for this!', 'Legends only tonight, folks! {x}! {y}! Somebody hold my headset!'],
    ['I was told there would be snacks. There are no snacks.', 'Two retirees punching each other for free. Beautiful. Tragic. Mostly tragic.'],
  ],
  ult: [
    ['HERE IT COMES! {x} pulls out the signature!', 'THE SIGNATURE MOVE! {x} has been saving that since the Bronze Age!', 'Signature time! {x} goes for the big one!'],
    ['I felt that one in the booth.', 'That is going in the highlight reel. And probably a lawsuit.', 'They have been rehearsing that in a mirror. You can tell.'],
  ],
  crit: [
    ['OH! {x} found the soft spot!', 'CRITICAL! {x} hits {y} right where the warranty ends!'],
    ['Textbook. If the textbook was about pain.', 'Medically speaking, that was a lot.'],
  ],
  revive: [
    ['{x} REFUSES TO GO DOWN! Get this fighter a contract!', 'NOT TODAY! {x} gets back up!'],
    ['Plot armor. I filed a complaint about it in 2019.', 'Somebody check the script, because that was not in it.'],
  ],
  lowhp: [
    ['{x} is hanging on by a thread!', '{x} is running on fumes and spite!'],
    ['The thread is also injured.', 'I would not insure {x} right now. I would not insure anyone in this building.'],
  ],
  lead: [
    ['WHAT A SWING! {x} takes the lead!', 'And just like that, {x} is in front!'],
    ['Momentum is a fickle thing. Like my ex.', 'Everyone who bet on {y} just went very quiet.'],
  ],
  big: [
    ['{x} lands a HAYMAKER on {y}!', 'Big shot from {x}! {y} felt that in their ancestors!', 'BOOM! {x} connects clean!'],
    ['That will leave a mark. Several, actually.', '{y} is reconsidering several life choices.', 'I have notes for {y}. The first note is: duck.'],
  ],
  dodge: [
    ['{x} was not there! Ghost-like!', 'Whiff! {y} swings at pure air!', 'Slippery! {x} slips it!'],
    ['Nobody home.', 'Footwork. Remember footwork? {x} does.', '{y} just punched the concept of {x}.'],
  ],
  heal: [
    ['{x} catches a second wind!', '{x} is patching up mid-fight!', '{x} is back on their feet, sort of!'],
    ['A snack break, apparently.', 'Is that allowed? I am told that is allowed.', 'Healing in the middle of a fight. The audacity. I love it.'],
  ],
  read: [
    ['{x} READ IT! Saw it coming a mile away!', '{x} is in {y}\'s head!', 'Called it! {x} called it!'],
    ['Chess, not checkers. Violent chess.', '{x} knew. {x} always knew.', '{y} keeps telegraphing. Somebody tell them.'],
  ],
  quiet: [
    ['A feeling-out round here, folks!', 'Both fighters circling, looking for an opening!', 'Nobody wants to blink first!'],
    ['Riveting. I am going to check my phone.', 'My grandmother throws harder. She is a lamp now. Long story.', 'This is the part they cut from the highlights.'],
  ],
  ko: [
    ['AND IT IS OVER! {w} WINS IT!', 'DOWN GOES {l}! {w} TAKES THE EXHIBITION!'],
    ['{l} will be fine. Medically speaking, eventually.', 'Nothing was on the line and {w} still made it personal. Respect.'],
  ],
  outro: [
    ['That is all from the hall of fame! Goodnight!', 'What a night! Same time next legend!'],
    ['I am still owed snacks.', 'I will be at the hospital, for once as a visitor.'],
  ],
};
