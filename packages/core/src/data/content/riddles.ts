// Synergy riddles (review F6): an undiscovered synergy shows a riddle in the collection instead of nothing.
// Each one points at the picks without naming them. Set bonuses get theirs from the set (see `riddleOf`).

export const RIDDLES: Record<string, string> = {
  inferno: 'Burns from the inside. The sword burns from the outside. The insurance company burns from both.',
  zero: 'Cold hands, colder blade. Nobody moves. Nobody can.',
  storm: 'The sky in one hand, a shocking piece of metal in the other. Thunder applauds.',
  crusader: 'Righteous, armored, and holy all the way down. Bad news for anything that crawled out of a grave.',
  blood: 'Thirsty by birth, and the blade is thirsty too. Dinner is served twice.',
  backstab: 'Trained to vanish, armed with something pointy. You never see the second hit either.',
  bonelord: 'A pile of bones that commands the dead. It gets up first, and it gets up angry.',
  immovable: 'Built like a wall, or simply is one. Shoving is not an option.',
  pure: 'Made of the elements, and it casts the elements. No translation needed.',
  speed: 'Born to strike first, and fast enough to strike again before you blink.',
  brain: 'A mind too big for one head: a genius who casts, or a genius who takes over yours.',
  glass: 'Hits like a truck. Built like a wine glass. Both are true.',
  feral: 'Howls at the moon and loses their temper early. The rage arrives sooner than usual.',
  pack: 'Part wolf, and they brought a wolf. Two is a pack if you believe in yourself.',
  dragonheart: 'Breathes one element, casts the same one. The scales line up.',
  lich: 'Bones that refuse to stay dead, and powers that should not exist. Necromancy, but make it personal.',
  mega: 'A bird of the city, grown to the size of a bus. Feed it nothing.',
  comedy: 'Born ridiculous and gloriously unhinged. Sometimes the bit lands three times harder.',
  destiny: 'Chosen by fate, protected by the script. Every hero line in the trailer.',
  horror: 'From beyond the stars, and it bends what is real. Your eyes will not survive the description.',
  fists: 'A fighter who trusts their hands, and brought nothing but their hands.',
  selfown: "Their weapon is exactly what they're allergic to. This one you will regret finding.",
  merking: 'Lives under the sea and carries the sea god\'s fork.',
  rocker: 'Six strings and a scream that cracks windows. The encore is mandatory.',
  forge: 'Short, bearded, and very serious about heavy metal tools.',
  foxfire: 'A fox with many tails and a trick of fire, or a trick of the eye.',
  toast: 'A kitchen appliance that throws fire. It finally makes sense.',
  wizard: 'Robes, a pointy hat, and the stick that every wizard is legally required to carry.',
  tank2: 'Already a wall, and it fights like one too: feet planted, shield up.',
  storm2: 'The wind at their back and a blade that moves just as fast.',
  gymbro: 'Lives at the gym and punches with nothing but gains.',
  owlnight: 'Up all night, and the night is their native habitat: fangs, sheets or shadows.',
  hypetrain: 'Their own biggest fan, posing at every opportunity. The finisher gets extra sauce.',
  twinpower: 'There is another one of them somewhere, and they can reach into minds.',
  samurai_katana: 'Bound by an old code, armed with the blade the code was written for.',
  ninja_stars: 'Dressed in black, throwing small sharp things in circles.',
  chef_pan: 'Yes, chef. With the pan. The one from the kitchen.',
  bard_guitar: 'A storyteller who plugged in. The tavern will never be quiet again.',
  pirate_parrot: 'Sails the seas with a weapon of the sea, or the sea itself in their hands.',
  druid_vines: 'Talks to trees, or is one, and makes the ground fight for them.',
  gunslinger_draw: 'High noon, a quick hand, and something that shoots from far away.',
  alch_poison: 'Mixes potions all day and has a poison of their own. Immune to the fumes.',
  wrestler_fists: 'Steps into the ring with nothing in their hands but bad intentions.',
  gambler_luck: 'Bets on everything, and the dice keep loving them back.',
  streamer_crowd: 'Always live, and the chat adores them: a star, or a crowd darling.',
  cat_nine: 'Lands on their feet, and already has a way to get back up. Counting lives is for dogs.',
  shark_water: 'Smells blood from a mile away, with water in their power or their weapon.',
  robot_laser: 'Part machine or all machine, aiming the weapon from the future.',
  snow_ice: 'Made of snow or covered in fur, and they cast the cold.',
  mummy_tomb: 'Wrapped up and very old, with shadows or poison seeping out.',
  djinn_wish: 'Lives in a lamp, and either bends reality or blinks across the room.',
  clown_chicken: 'Big shoes, red nose, and a weapon that squeaks, wobbles or tastes like cherry.',
  bee_swarm: 'Striped and buzzing, and they call in friends or bring the sting.',
  duck_debug: 'A bath toy with a very big brain. Explain your problem to it.',
  ogre_club: 'Big, green, and swinging something blunt. Layers, like an onion.',
  tamer_dragon: 'Tames beasts or descends from them, and has a very small dragon on a very big leash.',
  squire_knight: 'Holy or heavy, with an eager helper carrying the spare shield.',
  coach_gym: 'Someone yelling encouragement at a fighter who lives at the gym, or used to teach there.',
  goose_rematch: 'Lost to a bird with a honk, and never got over it.',
  timeloop_reader: 'Has lived this exact day before, and was clever enough to take notes.',
  glasscannon_title: 'Wears the fragile title and fights with no brakes at all.',
  nightowl_shadow: 'Built for the dark by birth and by habit, wings or whiskers included.',
  phoenix_fire: 'Fire in their hands and something of the firebird in their wardrobe.',
  fullset_mythic: 'Wearing the gear of legends, twice over.',
  junk_pile: 'Dressed head to toe in trash, and proud of it.',
  speedster_boots: 'Already fast as lightning, and their boots make it worse.',
  h_bgchar: 'Nobody remembers their name. That is exactly the advantage.',
  h_underdog: 'Nobody, holding nothing serious. The kind of story that gets a sequel.',
  h_irony: 'A weapon that should not be a weapon. Somehow that is the point.',
  h_comic: 'A race that is a punchline. The crowd is in on the joke and on their side.',
  h_dumpster: 'Three pieces of junk, worn with conviction.',
  h_trashking: 'Five pieces of junk. A crown made of rubbish is still a crown.',
};

const COUNT: Record<string, string> = { '2': 'Two pieces', '4': 'Four pieces', '6': 'The whole outfit' };

/** The riddle for a synergy that hasn't been found yet. */
export function riddleOf(k: string): string {
  if (RIDDLES[k]) return RIDDLES[k]!;
  const m = /^set_([a-z]+)(\d)$/.exec(k);
  if (m) {
    const full = (m[1] === 'clown' && m[2] === '4') || (m[1] === 'chef' && m[2] === '4');
    return `${full ? 'The whole outfit' : COUNT[m[2]!]} of the ${m[1]} set. Fashion is a stat now.`;
  }
  return 'Some picks just belong together. Keep spinning.';
}
