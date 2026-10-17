// Chapter-themed story encounters (Phase 4, upgrade 20): two per chapter, mixed in with the 12 classic ones.
// Everything an option does is data (`fx`), and the mechanics line under each option is written from it
// (game/story.ts `fxText`), so the line can't drift from what happens. `txt` is the joke you get after.

/** What an option does. Numbers are flat: coins, % of story HP (negative hurts), fame. */
export interface EventFx {
  coins?: number;
  heal?: number;
  fame?: number;
  /** +1 to this stat for good */
  stat?: 'str' | 'spd' | 'dur' | 'iq' | 'wm' | 'pm' | 'cha';
  /** next fight: read the opponent this much better, start with this much energy, damage multiplier, get back up with this much HP */
  readB?: number;
  en?: number;
  dmgX?: number;
  revive?: number;
  /** a free bag item */
  item?: string;
  /** injuries healed */
  cure?: 1;
  /** chance of picking up an injury */
  injury?: number;
  /** a random shrine blessing */
  blessing?: 1;
}

export interface ChapterOpt {
  /** the option, in the event's voice */
  l: string;
  cost?: number;
  /** a fight instead (an elite has loot), the mystery wheel, or a loot spin that bites 40% of the time for `risk`% HP */
  fight?: 'fight' | 'elite';
  wheel?: 1;
  loot?: 'treasure';
  risk?: number;
  fx?: EventFx;
  txt?: string;
  /** a gamble: `fx` and `txt` with this chance, otherwise `no` and `noTxt` */
  p?: number;
  no?: EventFx;
  noTxt?: string;
}

export interface ChapterEvent {
  k: string;
  ch: number;
  e: string;
  t: string;
  d: string;
  o: ChapterOpt[];
  /** the charisma option (upgrade 17): `need` is the charisma on the card */
  talk: { need: number; l: string; fx: EventFx; txt: string; cost?: number };
}

export const CH_EVENTS: ChapterEvent[] = [
  // 1 Back Alley Brawls
  {
    k: 'c1_dumpster',
    ch: 1,
    e: '🗑️',
    t: 'Dumpster diving',
    d: 'A dumpster behind the laundromat glows faintly. It smells like opportunity. And soup.',
    o: [
      {
        l: 'Dive in',
        p: 0.6,
        fx: { coins: 6, item: 'bandage' },
        txt: 'Six damp coins and a roll of bandages. Worth it.',
        no: { heal: -10 },
        noTxt: 'You find a raccoon. The raccoon finds you first.',
      },
      { l: 'Walk past', txt: 'Some treasures are better left marinating.' },
    ],
    talk: { need: 35, l: 'Ask the raccoon nicely', fx: { coins: 10, item: 'bandage' }, txt: 'The raccoon respects you. It hands over its stash. Do not ask where the bandage has been.' },
  },
  {
    k: 'c1_laundromat',
    ch: 1,
    e: '🧺',
    t: 'Spin cycle',
    d: 'The laundromat owner says you can train on the dryers if you fold her towels first.',
    o: [
      { l: 'Fold the towels', fx: { heal: 20 }, txt: 'Warm towels, warm hands. You feel almost human.' },
      { l: 'Ride the big dryer', fx: { stat: 'spd', heal: -15 }, txt: 'Forty minutes on the hottest setting. You can now dodge anything, including your feelings.' },
    ],
    talk: { need: 30, l: 'Charm her', fx: { heal: 35, coins: 5 }, txt: 'She folds YOUR towels and slips you five coins for the bus.' },
  },
  // 2 The Night Market
  {
    k: 'c2_skewers',
    ch: 2,
    e: '🍢',
    t: 'Mystery skewers',
    d: 'A stall sells skewers of "meat". The vendor will not say which animal. The vendor will not make eye contact.',
    o: [
      {
        l: 'Eat three',
        cost: 4,
        p: 0.7,
        fx: { heal: 30 },
        txt: 'Delicious. You decide not to know.',
        no: { heal: -10 },
        noTxt: 'Your stomach files a formal complaint.',
      },
      { l: 'Just one, to be polite', fx: { heal: 10 }, txt: 'Crunchy. That is all we will say.' },
    ],
    talk: { need: 40, l: 'Ask what is in them', fx: { heal: 25, dmgX: 1.1 }, txt: 'The vendor whispers the answer. You eat four more out of pure spite.' },
  },
  {
    k: 'c2_noodles',
    ch: 2,
    e: '🍜',
    t: 'The noodle challenge',
    d: 'A sign at Mama Gnocchi’s stall: FINISH THE BOWL, WIN THE POT. The bowl is the size of a bathtub.',
    o: [
      {
        l: 'Enter',
        cost: 5,
        p: 0.5,
        fx: { coins: 20, fame: 3 },
        txt: 'You finish the bowl. The crowd chants your name. Your stomach chants something else.',
        no: { heal: -15 },
        noTxt: 'You tap out halfway. The noodles win. The noodles always win.',
      },
      { l: 'Watch from a stool', fx: { heal: 15 }, txt: 'Watching someone else suffer is very restorative.' },
    ],
    talk: { need: 45, l: 'Charm Mama Gnocchi', fx: { heal: 40, fame: 2 }, txt: 'She pinches your cheek and feeds you by hand. Nobody laughs. Nobody dares.' },
  },
  // 3 The City Circuit
  {
    k: 'c3_rooftop',
    ch: 3,
    e: '🏙️',
    t: 'Rooftop shortcut',
    d: 'A gap between two rooftops. On the other side: a shortcut and a crowd that loves a show.',
    o: [
      {
        l: 'Jump it',
        p: 0.7,
        fx: { fame: 4, coins: 6 },
        txt: 'You stick the landing. Someone throws coins. Someone else throws a shoe.',
        no: { heal: -20 },
        noTxt: 'You make it. Mostly. Your shins did not.',
      },
      { l: 'Take the stairs', txt: 'Forty-two floors. Character building.' },
    ],
    talk: { need: 40, l: 'Get the crowd to carry you over', fx: { fame: 6 }, txt: 'They pass you across on their hands, chanting. Best commute of your life.' },
  },
  {
    k: 'c3_garage',
    ch: 3,
    e: '🅿️',
    t: 'Parking garage pit',
    d: 'Fighters circle a pit on level B3. The ticket machine takes bets.',
    o: [
      { l: 'Jump in the pit', fight: 'fight' },
      {
        l: 'Bet on a stranger',
        cost: 8,
        p: 0.5,
        fx: { coins: 18 },
        txt: 'Your stranger wins. You hug them. They did not ask for that.',
        noTxt: 'Your stranger trips on a parking cone. Money gone.',
      },
    ],
    talk: { need: 50, l: 'Get a tip from the bookie', fx: { coins: 15 }, txt: '"The one in the hat." The one in the hat wins. Nobody is surprised but the hat.' },
  },
  // 4 Harbor Docks
  {
    k: 'c4_fish',
    ch: 4,
    e: '🐟',
    t: 'A fish for luck',
    d: 'A fishmonger offers you a fish "for luck". It is still moving.',
    o: [
      {
        l: 'Eat it raw',
        p: 0.6,
        fx: { stat: 'dur' },
        txt: 'It fights the whole way down. You win.',
        no: { heal: -15 },
        noTxt: 'It wins.',
      },
      { l: 'Slap someone with it', fx: { fame: 3 }, txt: 'The harbor approves. The fish does not.' },
    ],
    talk: { need: 35, l: 'Haggle for the whole crate', fx: { coins: 12 }, txt: 'You resell the crate to a sushi place. Business!' },
  },
  {
    k: 'c4_crates',
    ch: 4,
    e: '📦',
    t: 'Smugglers’ crates',
    d: 'Unmarked crates, unguarded, on a quiet pier. Probably fine.',
    o: [
      { l: 'Pry one open', loot: 'treasure', risk: 25 },
      { l: 'Tell the harbor master', fx: { coins: 8, fame: -2 }, txt: 'He pays well. The docks remember better.' },
    ],
    talk: { need: 55, l: 'Pose as a buyer', fx: { coins: 10, item: 'salts' }, txt: 'They throw in a free sample. You do not ask what of.' },
  },
  // 5 National League
  {
    k: 'c5_sponsor',
    ch: 5,
    e: '💼',
    t: 'Sponsor meeting',
    d: 'An energy drink wants you in its ad. The drink is called FURY. It is beige.',
    o: [
      { l: 'Sign the deal', fx: { coins: 20, heal: -20 }, txt: 'You film forty takes of drinking it. Contractually, you are now beige.' },
      { l: 'Turn it down', fx: { fame: 3 }, txt: 'Integrity: worth exactly three fame.' },
    ],
    talk: { need: 45, l: 'Negotiate royalties', fx: { coins: 30 }, txt: 'You get a percentage. FURY sells one can. It was you. You bought it.' },
  },
  {
    k: 'c5_presser',
    ch: 5,
    e: '🎤',
    t: 'Press conference',
    d: 'Reporters want a quote before your next match.',
    o: [
      { l: 'Talk trash', fx: { fame: 6, heal: -10 }, txt: 'You talk so long you forget to stretch.' },
      { l: '"No comment."', fx: { readB: 0.15 }, txt: 'Nobody learns anything about you. You learn a lot about them.' },
    ],
    talk: { need: 35, l: 'Charm the room', fx: { fame: 6, coins: 8 }, txt: 'They laugh at all your jokes. One of them is funny.' },
  },
  // 6 The Haunted Highlands
  {
    k: 'c6_ghost',
    ch: 6,
    e: '👻',
    t: 'A ghost with a grudge',
    d: 'A ghost wants you to finish its fight. It died mid-punch in 1743 and has been holding it ever since.',
    o: [
      { l: 'Fight on its behalf', fight: 'elite' },
      { l: 'Offer condolences', fx: { heal: 15 }, txt: 'It sighs through you. Weirdly refreshing.' },
    ],
    talk: { need: 50, l: 'Talk it into resting', fx: { blessing: 1, fame: 3 }, txt: 'It finally lets go and leaves you its blessing. And, unfortunately, its wardrobe.' },
  },
  {
    k: 'c6_grave',
    ch: 6,
    e: '🪦',
    t: 'A sword in a grave',
    d: 'A fresh grave with a sword sticking out of it. The sword looks expensive. The grave looks occupied.',
    o: [
      {
        l: 'Take the sword',
        p: 0.5,
        fx: { stat: 'wm' },
        txt: 'It comes out clean. Nobody complains. Yet.',
        no: { heal: -20, injury: 0.5 },
        noTxt: 'The occupant takes it back. With interest.',
      },
      { l: 'Leave flowers', fx: { heal: 10, fame: 2 }, txt: 'Someone appreciates it. Possibly from below.' },
    ],
    talk: { need: 45, l: 'Ask the occupant politely', fx: { stat: 'wm' }, txt: 'A bony hand gives you a thumbs up. The sword is yours.' },
  },
  // 7 World Stage
  {
    k: 'c7_exchange',
    ch: 7,
    e: '🌐',
    t: 'Technique exchange',
    d: 'A fighter from far away offers to swap secrets. They have a notebook. It is very thick.',
    o: [
      { l: 'Trade secrets', fx: { stat: 'iq' }, txt: 'You learn three new ways to say "ow" and one way to avoid it.' },
      { l: 'Spar instead', fx: { stat: 'str', heal: -20 }, txt: 'They hit like a postcard from a very angry country.' },
    ],
    talk: { need: 40, l: 'Teach them your trash talk', fx: { stat: 'iq', fame: 2 }, txt: 'They write it all down. You are now required reading.' },
  },
  {
    k: 'c7_luggage',
    ch: 7,
    e: '🧳',
    t: 'Lost luggage',
    d: 'The airline lost your bag. They offer a voucher, or a suitcase from the unclaimed pile.',
    o: [
      { l: 'Take the voucher', fx: { coins: 12 }, txt: 'Twelve coins and a sincere apology, printed.' },
      { l: 'Take a mystery suitcase', loot: 'treasure', risk: 15 },
    ],
    talk: { need: 50, l: 'Demand both', fx: { coins: 12, item: 'charm' }, txt: 'The suitcase has a lucky charm in it. The voucher has a typo in your name.' },
  },
  // 8 Neon Megacity
  {
    k: 'c8_implant',
    ch: 8,
    e: '🦾',
    t: 'Back-alley implant',
    d: 'A ripperdoc offers a "mostly legal" reflex chip. Mostly.',
    o: [
      {
        l: 'Install it',
        cost: 15,
        p: 0.75,
        fx: { stat: 'spd' },
        txt: 'Your reflexes are now faster than your thoughts. This was already true, but now it is official.',
        no: { heal: -25, injury: 1 },
        noTxt: 'It reboots during the install. So do you.',
      },
      { l: 'Just buy the warranty', txt: 'Smart. The warranty is the only part that works.' },
    ],
    talk: { need: 55, l: 'Get the friends-and-family price', fx: { stat: 'spd' }, txt: 'Free install. The doc says you remind them of their first cyborg.' },
  },
  {
    k: 'c8_arcade',
    ch: 8,
    e: '🕹️',
    t: 'The arcade',
    d: 'A fighting game cabinet. The high score belongs to SAMURAI. It has for nine years.',
    o: [
      {
        l: 'Go for the high score',
        cost: 3,
        p: 0.4,
        fx: { fame: 6, readB: 0.2 },
        txt: 'NEW HIGH SCORE. Somewhere, a chrome samurai feels a chill.',
        noTxt: 'GAME OVER. The cabinet laughs at you in 8-bit.',
      },
      { l: 'Play for fun', cost: 3, fx: { readB: 0.1 }, txt: 'You learn combos by mashing. Some of them are real.' },
    ],
    talk: { need: 40, l: 'Sweet-talk the owner into free credits', fx: { fame: 4, readB: 0.2 }, txt: 'Unlimited credits. You beat the high score on your ninetieth try.' },
  },
  // 9 The Hive
  {
    k: 'c9_jelly',
    ch: 9,
    e: '🍯',
    t: 'Royal jelly',
    d: 'A drip of royal jelly glows on the wall. The workers are busy. Mostly.',
    o: [
      {
        l: 'Lick it',
        p: 0.6,
        fx: { stat: 'pm' },
        txt: 'Your power hums at a new frequency. So do your teeth.',
        no: { heal: -25 },
        noTxt: 'Every bee within a mile takes it personally.',
      },
      { l: 'Leave it', txt: 'The wall keeps glowing. You keep walking. Growth.' },
    ],
    talk: { need: 60, l: 'Apply to the queen’s secretary', fx: { stat: 'pm', heal: 20 }, txt: 'Your application is approved in triplicate. Free jelly, no stings.' },
  },
  {
    k: 'c9_drone',
    ch: 9,
    e: '🐝',
    t: 'A lost drone',
    d: 'A worker bee the size of a dog is lost and buzzing sadly.',
    o: [
      { l: 'Walk it home', fx: { coins: 10, fame: 3, heal: -10 }, txt: 'The hive tips well. The drone stings you once, out of habit.' },
      { l: 'Ride it', fx: { en: 100 }, txt: 'You arrive everywhere early and slightly sticky.' },
    ],
    talk: { need: 35, l: 'Calm it down', fx: { item: 'drink', fame: 2 }, txt: 'It gives you a jar of something. It is an energy drink. Bees have energy drinks.' },
  },
  // 10 The Wheel's Domain
  {
    k: 'c10_carny',
    ch: 10,
    e: '🎪',
    t: 'A wheel inside the wheel',
    d: 'A carny offers you a spin on a small wheel, inside the big wheel. It is wheels all the way down.',
    o: [
      { l: 'Spin it', wheel: 1 },
      { l: 'Ask about the odds', fx: { readB: 0.15 }, txt: 'He lies for twenty minutes. You learn exactly how liars blink.' },
    ],
    talk: { need: 45, l: 'Ask for a rigged spin', fx: { blessing: 1 }, txt: 'He winks. The wheel winks. You win.' },
  },
  {
    k: 'c10_echo',
    ch: 10,
    e: '🪞',
    t: 'Echo of yourself',
    d: 'You meet the version of you who landed different wheels. They look happier.',
    o: [
      { l: 'Fight your echo', fight: 'elite' },
      { l: 'Ask for advice', fx: { stat: 'iq' }, txt: '"Defend more." You were never going to listen. You listen anyway.' },
    ],
    talk: { need: 50, l: 'Hug it out', fx: { heal: 40, fame: 2 }, txt: 'Awkward, then nice. You both agree never to mention it.' },
  },
  // 11 Sky Islands
  {
    k: 'c11_bridge',
    ch: 11,
    e: '🌉',
    t: 'Rope bridge toll',
    d: 'A pirate charges a toll for the only rope bridge. The bridge is mostly knots.',
    o: [
      { l: 'Pay the toll', cost: 8, fx: { heal: 10 }, txt: 'The pirate throws in a stale sandwich. The bridge creaks your name the whole way.' },
      {
        l: 'Climb across underneath',
        p: 0.6,
        fx: { stat: 'spd' },
        txt: 'Hand over hand, over nothing. Your grip will never be the same.',
        no: { heal: -25 },
        noTxt: 'A cloud breaks your fall. Clouds are not soft.',
      },
    ],
    talk: { need: 45, l: 'Recruit the pirate', fx: { coins: 15 }, txt: 'He joins your fan club and refunds everyone who ever crossed. Pirates love a charmer.' },
  },
  {
    k: 'c11_cloud',
    ch: 11,
    e: '☁️',
    t: 'A cloud you can lie on',
    d: 'A cloud drifts by at knee height. It looks soft. It looks like a trap.',
    o: [
      {
        l: 'Nap on it',
        p: 0.8,
        fx: { heal: 40 },
        txt: 'The best sleep of your life, at altitude.',
        no: { heal: -15 },
        noTxt: 'It was steam. From what, nobody knows.',
      },
      { l: 'Bottle some', fx: { item: 'ration' }, txt: 'A jar of cloud. It counts as rations. Do not ask how.' },
    ],
    talk: { need: 40, l: 'Ask the cloud to stay', fx: { heal: 50 }, txt: 'It stays. It hums. You wake up with your problems mostly solved.' },
  },
  // 12 The Underworld
  {
    k: 'c12_contract',
    ch: 12,
    e: '📜',
    t: 'A contract in brimstone',
    d: 'A demon offers power for "something small". The fine print is on fire.',
    o: [
      { l: 'Sign it', fx: { stat: 'pm', heal: -20, fame: -3 }, txt: 'The something small was your good name. Fair, honestly.' },
      { l: 'Read the fine print', fx: { readB: 0.2 }, txt: 'All of it. Your next opponent will be easy to read after that.' },
    ],
    talk: { need: 55, l: 'Renegotiate', fx: { stat: 'pm' }, txt: 'You talk the demon down to a handshake. It now owes YOU. It is furious.' },
  },
  {
    k: 'c12_springs',
    ch: 12,
    e: '♨️',
    t: 'Lava hot springs',
    d: 'A pool of something orange. One sign says RELAXING. Another says DEATH.',
    o: [
      {
        l: 'Take a dip',
        p: 0.5,
        fx: { heal: 60 },
        txt: 'Relaxing. The first sign was right.',
        no: { heal: -20 },
        noTxt: 'The second sign was also right, a little.',
      },
      { l: 'Warm your hands', fx: { heal: 15 }, txt: 'Toasty. Your eyebrows are a memory.' },
    ],
    talk: { need: 40, l: 'Ask the lifeguard for the safe end', fx: { heal: 60 }, txt: 'The lifeguard is a demon in a whistle. It points. You soak.' },
  },
  // 13 Clockwork Citadel
  {
    k: 'c13_tinker',
    ch: 13,
    e: '🔧',
    t: 'The tinker’s upgrade',
    d: 'A tiny inventor offers to "improve" your weapon. She is already holding it.',
    o: [
      {
        l: 'Let her',
        cost: 10,
        p: 0.7,
        fx: { stat: 'wm' },
        txt: 'It is lighter, sharper and now has a clock in it. For some reason.',
        noTxt: 'It now plays music when swung. That is the whole upgrade.',
      },
      { l: 'Snatch it back', txt: 'She looks hurt. She also looks like she is measuring you.' },
    ],
    talk: { need: 50, l: 'Praise her designs', fx: { stat: 'wm' }, txt: 'Flattery works on geniuses too. Free upgrade, and a blueprint of your face.' },
  },
  {
    k: 'c13_gears',
    ch: 13,
    e: '⚙️',
    t: 'Between the gears',
    d: 'The fastest way across is through the giant gears. Timing is everything.',
    o: [
      {
        l: 'Time the jump',
        p: 0.65,
        fx: { en: 100, fame: 3 },
        txt: 'Perfect timing. You arrive pumped and slightly greased.',
        no: { heal: -25 },
        noTxt: 'The gears time you instead.',
      },
      { l: 'Take the long way', fx: { heal: 10 }, txt: 'A nice walk. The gears are disappointed in you.' },
    ],
    talk: { need: 45, l: 'Ask a cog to wait', fx: { en: 100, fame: 3 }, txt: 'It waits. Nothing in this citadel has ever waited before.' },
  },
  // 14 The Sunken Kingdom
  {
    k: 'c14_clam',
    ch: 14,
    e: '🦪',
    t: 'The giant clam',
    d: 'A clam the size of a car, slightly open. A pearl glows inside.',
    o: [
      {
        l: 'Reach in',
        p: 0.5,
        fx: { coins: 30 },
        txt: 'A pearl the size of your fist. Shiny. Sellable.',
        no: { heal: -30, injury: 0.5 },
        noTxt: 'The clam closes. You learn what a hug means to a clam.',
      },
      { l: 'Knock first', fx: { coins: 8 }, txt: 'It opens a crack and slides you some loose change to leave.' },
    ],
    talk: { need: 45, l: 'Compliment the clam', fx: { coins: 25 }, txt: 'Nobody ever compliments the clam. It cries a pearl.' },
  },
  {
    k: 'c14_market',
    ch: 14,
    e: '🧜',
    t: 'Merfolk market',
    d: 'Everything is wet. The prices are wetter.',
    o: [
      { l: 'Buy a bubble helmet', cost: 10, fx: { en: 100, heal: 20 }, txt: 'You can breathe! Down here, that is basically cheating.' },
      { l: 'Trade gossip', fx: { readB: 0.2 }, txt: 'Merfolk know everything that sinks. Your next opponent sank once.' },
    ],
    talk: { need: 40, l: 'Haggle in bubbles', fx: { en: 100, heal: 20 }, txt: 'You blow the right bubbles. They throw in the helmet for free.' },
  },
  // 15 Carnival of Nightmares
  {
    k: 'c15_bell',
    ch: 15,
    e: '🔔',
    t: 'Test your strength',
    d: 'Ring the bell, win a prize. The hammer is warm. The bell is screaming.',
    o: [
      {
        l: 'Swing',
        cost: 3,
        p: 0.5,
        fx: { coins: 15, fame: 3 },
        txt: 'DING. The bell stops screaming. Everyone stares at you instead.',
        noTxt: 'The bell laughs. You will hear it in your sleep.',
      },
      { l: 'Walk away', txt: 'The bell keeps screaming. Not your problem.' },
    ],
    talk: { need: 35, l: 'Convince the operator you already won', fx: { coins: 12 }, txt: 'He pays out. He does not remember why. Nobody here remembers anything.' },
  },
  {
    k: 'c15_mirrors',
    ch: 15,
    e: '🎭',
    t: 'House of mirrors',
    d: 'Every reflection is you, but worse at fighting. One of them winks.',
    o: [
      { l: 'Study them', fx: { readB: 0.25 }, txt: 'You see every mistake you make, from twelve angles.' },
      { l: 'Fight the one that winked', fight: 'fight' },
    ],
    talk: { need: 50, l: 'Talk to the winker', fx: { stat: 'iq' }, txt: 'It tells you your tells. You will never blink before a jab again.' },
  },
  // 16 The Glacier Court
  {
    k: 'c16_bow',
    ch: 16,
    e: '🎩',
    t: 'Etiquette lesson',
    d: 'A butler made of ice insists you learn how to bow before the queen.',
    o: [
      { l: 'Learn it', fx: { stat: 'cha', heal: -10 }, txt: 'Three hours of bowing. Your back is frozen. Your manners are flawless.' },
      { l: 'Refuse', fx: { fame: 3 }, txt: 'The court is scandalized. The commoners love it.' },
    ],
    talk: { need: 40, l: 'Out-polite the butler', fx: { stat: 'cha' }, txt: 'You bow lower. He bows lower. It takes an hour. You win.' },
  },
  {
    k: 'c16_fishing',
    ch: 16,
    e: '🎣',
    t: 'Ice fishing',
    d: 'A hole in the ice, a rod, and a sign: ANYTHING YOU CATCH IS YOURS.',
    o: [
      { l: 'Fish', loot: 'treasure', risk: 20 },
      { l: 'Warm up by the fire', fx: { heal: 25 }, txt: 'The fire is also made of ice. It still helps, somehow.' },
    ],
    talk: { need: 50, l: 'Ask the locals for their spot', fx: { item: 'medkit' }, txt: 'They share their spot. You catch a med kit. Nobody asks how it got down there.' },
  },
  // 17 The Dream Realm
  {
    k: 'c17_nightmare',
    ch: 17,
    e: '😱',
    t: 'Your worst nightmare',
    d: 'It is a test you forgot to study for. During a fight. In your underwear.',
    o: [
      {
        l: 'Face it',
        p: 0.6,
        fx: { stat: 'dur' },
        txt: 'You pass. In your underwear. Nothing can hurt you now.',
        no: { heal: -20 },
        noTxt: 'You fail. The proctor is your old coach. He is so disappointed.',
      },
      { l: 'Wake up', fx: { heal: 20 }, txt: 'You wake up inside another dream. This one is a nap.' },
    ],
    talk: { need: 45, l: 'Talk your way through the exam', fx: { stat: 'dur' }, txt: 'You argue every answer until the test gives up. Full marks.' },
  },
  {
    k: 'c17_sand',
    ch: 17,
    e: '⏳',
    t: 'A bag of sleep sand',
    d: 'The Sandman dropped a bag of sand. It is very, very sleepy sand.',
    o: [
      { l: 'Keep it', fx: { dmgX: 1.15 }, txt: 'A pinch in your next opponent’s eyes. They will be fighting half asleep.' },
      { l: 'Return it', fx: { coins: 10, fame: 4 }, txt: 'The Sandman tips you and tucks you in. It is unsettling.' },
    ],
    talk: { need: 55, l: 'Ask the Sandman for a favor', fx: { dmgX: 1.15, heal: 30 }, txt: 'He lets you keep the sand and gives you a nap. Everyone wins but your opponent.' },
  },
  // 18 The Void
  {
    k: 'c18_nothing',
    ch: 18,
    e: '⬛',
    t: 'A whole lot of nothing',
    d: 'There is nothing here. The nothing is looking at you.',
    o: [
      {
        l: 'Stare back',
        p: 0.5,
        fx: { stat: 'iq' },
        txt: 'The nothing blinks first. You understand something you cannot explain.',
        no: { heal: -30 },
        noTxt: 'The nothing stares harder. Part of you is now also nothing.',
      },
      { l: 'Blink first', txt: 'You lose the staring contest. Nobody tells anyone.' },
    ],
    talk: { need: 60, l: 'Make small talk with the nothing', fx: { stat: 'iq', heal: 20 }, txt: 'It has been lonely for a very long time. You are now its favorite something.' },
  },
  {
    k: 'c18_lost',
    ch: 18,
    e: '🧦',
    t: 'Lost and found',
    d: 'Everything that ever went missing ends up here. You see a lot of single socks.',
    o: [
      { l: 'Look for your stuff', fx: { coins: 20, item: 'medkit' }, txt: 'Twenty coins you lost years ago, and a med kit you never owned. Finders keepers.' },
      { l: 'Leave something behind', fx: { blessing: 1 }, txt: 'You leave one sock. The Void is moved.' },
    ],
    talk: { need: 50, l: 'Ask the clerk for the good shelf', fx: { coins: 30, item: 'medkit' }, txt: 'The clerk is a single sock. It knows where everything is.' },
  },
  // 19 The Pantheon
  {
    k: 'c19_trial',
    ch: 19,
    e: '⚡',
    t: 'A minor god’s trial',
    d: 'The god of mild inconvenience wants to test you. Your shoelace is already untied.',
    o: [
      { l: 'Accept the trial', fight: 'elite' },
      { l: 'Make an offering', cost: 15, fx: { blessing: 1, heal: 20 }, txt: 'The god accepts and ties your shoelace. Big of them.' },
    ],
    talk: { need: 50, l: 'Flatter a minor god', fx: { blessing: 1, heal: 20 }, txt: 'Nobody ever flatters the minor gods. It blesses you twice, by accident.' },
  },
  {
    k: 'c19_ambrosia',
    ch: 19,
    e: '🍷',
    t: 'Ambrosia tasting',
    d: 'Food of the gods, free samples. A tiny sign: NOT FOR MORTALS.',
    o: [
      {
        l: 'Taste it',
        p: 0.5,
        fx: { stat: 'str', heal: 30 },
        txt: 'You feel divine. Briefly. The strength stays.',
        no: { heal: -40 },
        noTxt: 'Your mortal stomach reads the sign, too late.',
      },
      { l: 'Just smell it', fx: { heal: 25 }, txt: 'Even the smell heals. The gods have it so easy.' },
    ],
    talk: { need: 55, l: 'Ask for the mortal recipe', fx: { stat: 'str', heal: 30 }, txt: 'They water it down for you. It still tastes like winning.' },
  },
  // 20 The First Wheel
  {
    k: 'c20_hermit',
    ch: 20,
    e: '🛞',
    t: 'The spoke hermit',
    d: 'An old hermit lives inside one of the Wheel’s spokes. They know how it thinks.',
    o: [
      { l: 'Listen', fx: { readB: 0.3 }, txt: 'The Wheel is lonely. The Wheel is bored. The Wheel favors the bold. Noted.' },
      { l: 'Spin the hermit', wheel: 1 },
    ],
    talk: { need: 45, l: 'Ask what the Wheel wants', fx: { readB: 0.3, blessing: 1 }, txt: '"Something interesting." The hermit blesses you. Be interesting.' },
  },
  {
    k: 'c20_first',
    ch: 20,
    e: '👣',
    t: 'The first fighter',
    d: 'Footprints on the rim lead to the first fighter the Wheel ever spun. They are very tired.',
    o: [
      { l: 'Spar with a legend', fx: { stat: 'str', heal: -25, fame: 5 }, txt: 'They are slow, old and still better than you. You learn anyway.' },
      { l: 'Ask for their story', fx: { heal: 30 }, txt: 'It is long. It is sad. It ends with "and then I spun again".' },
    ],
    talk: { need: 60, l: 'Ask them to pass it on', fx: { stat: 'str', fame: 5 }, txt: 'They hand you their old wraps. They still smell like the first fight ever.' },
  },
];
