type Lines = { correct: string[]; wrong: string[]; taunts: string[] };

const COMMENTARY: Record<string, Lines> = {
  tralalero: {
    correct: ['Tralalero tralala! 🦈', 'Too easy for me!', 'Shark brain activated.', 'Did you expect less?', 'Tralala and correct!'],
    wrong:   ['Ugh... tralalero...', 'Even the shark knew that.', 'My fins are disappointed.', 'Tralala... try harder.', 'The ocean weeps for you.'],
    taunts:  ['Think you can beat a shark?', 'Tralala... let\'s see...', 'The ocean is watching.', 'Sharks don\'t miss. Do you?', 'Tralalero is ready for you.'],
  },
  bombardilocrocodilo: {
    correct: ['BOOM. Correct. 🐊', 'Crocodile never misses.', 'BOMBARDILO!', 'Calculated. Lethal. Right.', 'The swamp approves.'],
    wrong:   ['PATHETIC.', 'Even a croc got that one.', 'The bomb... exploded on YOU.', 'Bombardilo is disgusted.', 'Wrong. Again. Naturally.'],
    taunts:  ['BOMBARDILO.', 'Prepare to be destroyed.', 'The croc is hungry.', 'This will hurt.', 'You cannot escape the swamp.'],
  },
  bombardinigusini: {
    correct: ['Goose energy: CORRECT 🪿', 'HONK of victory!', 'The gusini approves.', 'Bombing with brains!', 'HONK HONK! Right!'],
    wrong:   ['The goose is appalled.', 'HONK... (that means wrong)', 'Gusini shakes its head.', 'Even geese know this one.', 'Flock rejected your answer.'],
    taunts:  ['HONK.', 'The geese are circling.', 'You face the gusini now.', 'Wings spread. Ready.', 'HONK HONK HONK.'],
  },
  capuccinoasesino: {
    correct: ['Smooth. Like espresso. ☕', 'The assassin approves.', 'Precise. Deadly. Correct.', 'Cappuccino never misses.', 'That answer? Perfetto.'],
    wrong:   ['...I expected better.', 'The espresso grows cold.', 'Assassinated by ignorance.', 'Not very cappuccino of you.', 'The café is disappointed.'],
    taunts:  ['The assassin awaits.', 'Sip. Think. Then fail.', 'Espresso. Then oblivion.', 'You can\'t hide from caffeine.', 'The blade is sharpened.'],
  },
  tungtungsahur: {
    correct: ['TungTung! Correct! 🪵', '*bangs drum in victory*', 'SAHUR! You got it!', 'The drum celebrates you.', 'Tung tung tung! YES!'],
    wrong:   ['*sad drum roll*', 'Tung... tung... tung...', 'The drum weeps.', 'SAHUR but make it wrong.', '*single tung of shame*'],
    taunts:  ['*ominous drumming*', 'Tung... tung... tung...', 'The rhythm doesn\'t lie.', 'SAHUR approaches.', 'Can you hear the drum?'],
  },
  lirililarila: {
    correct: ['Lirili larila! 🐘', 'The elephant remembers!', 'Correct — as predicted.', 'Larila dance incoming!', 'Trunk raised in victory!'],
    wrong:   ['Lirili... larila... no.', 'Even elephants know this.', 'The trunk droops sadly.', 'Larila is let down.', 'Lirili? More like lirili-wrong.'],
    taunts:  ['Lirili larila...', 'The elephant never forgets.', 'Trunk raised. Ready.', 'Lirili is watching you.', 'The plains fall silent.'],
  },
  brrprrpatapim: {
    correct: ['brr brr... 🌿 (that means right)', 'patapim! correct!', 'brr brr brr brr brr!', 'The creature is pleased.', '...brr. (good job)'],
    wrong:   ['brr brr brr... (oof)', 'patapim disagrees.', 'brr... (not quite)', 'even brr brr got that.', '...pata. not pim.'],
    taunts:  ['brr brr brr...', '...patapim.', 'brr.', 'the creature stirs.', 'brr brr brr brr...'],
  },
  trippitroppi: {
    correct: ['Trippi troppi! Yes! 🦐', 'The shrimp is correct.', 'Too trippi for this quiz.', 'Troppi points for you!', 'Shrimp brain = big brain.'],
    wrong:   ['Trippi troppi... no.', 'The shrimp is baffled.', 'Not troppi enough.', 'Even a shrimp knew that.', 'Trippi disappointed in you.'],
    taunts:  ['Too trippi for you?', 'The shrimp is ready.', 'Trippi troppi incoming.', 'Small but deadly.', 'The crustacean awaits.'],
  },
  chimpanzinibananini: {
    correct: ['BANANA BRAIN! 🍌 Correct!', 'Chimpanzini approves!', 'Big monkey energy.', 'Bananini of genius!', 'The jungle celebrates!'],
    wrong:   ['The banana wilts.', 'Even chimps get this one.', 'Chimpanzini face-palms.', 'No banana for you.', 'Bananini of shame.'],
    taunts:  ['🍌 ...', 'The jungle is watching.', 'Chimpanzini is ready.', 'Bananini of destruction.', 'OOOOH OOOH AH AH.'],
  },
  lavacasaturnosaturnita: {
    correct: ['Saturn sees all. Correct. 🪐', 'The cow from space knew it.', 'MOOOO of victory!', 'Cosmic bovine approves.', 'La Vaca has spoken.'],
    wrong:   ['Even Saturn\'s cow knew that.', 'The rings of Saturn weep.', 'Mooo... (that\'s a no)', 'La Vaca is disappointed.', 'Back to orbit with you.'],
    taunts:  ['From orbit, I judge you.', 'The cosmos watches.', 'MOOOO...', 'La Vaca sees everything.', 'Saturn\'s rings demand an answer.'],
  },
};

const FALLBACK: Lines = {
  correct: ['Correct! 🍕', 'Nice one!', 'That\'s right!', 'Get in! 🔥', 'Boom!'],
  wrong:   ['Wrong! 💀',   'Not quite.', 'Nope!',          'Ouch.',      'Try harder.'],
  taunts:  ['Think carefully...', 'Here it comes.', 'Can you handle this?', 'Ready?', 'Focus.'],
};

export function getCommentary(characterId: string, correct: boolean): string {
  const lines = COMMENTARY[characterId] ?? FALLBACK;
  const pool  = correct ? lines.correct : lines.wrong;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTaunt(characterId: string): string {
  const lines = COMMENTARY[characterId] ?? FALLBACK;
  return lines.taunts[Math.floor(Math.random() * lines.taunts.length)];
}
