import fs from "fs";
import { Buffer } from 'node:buffer';
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardsJson, getCyclesJson, getFactionsJson, getMwlJson, getPackFilesJson, getPacksJson, getPrebuiltsJson, getRotationsJson, getSidesJson, getTypesJson } from "../../src/index";

import chai = require('chai');
const expect = chai.expect;

const ajv = new Ajv2020({ strict: true, allErrors: true });

function validateAgainstSchema(schema_file, data) {
  const schema_path = resolve(__dirname, "../../schema/v1", schema_file);
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  validate(data);
  if (validate.errors) {
    expect.fail(ajv.errorsText(validate.errors));
  }
}

describe('Sides', () => {
  const sides = getSidesJson();
  it('sides.json passes schema validation', () => {
    validateAgainstSchema('side_schema.json', sides);
  });
});

describe('Factions', () => {
  const factions = getFactionsJson();

  it('factions.json passes schema validation', () => {
    validateAgainstSchema('faction_schema.json', factions);
  });
});

describe('Cycles', () => {
  const cycles = getCyclesJson();

  it('cycles.json passes schema validation', () => {
    validateAgainstSchema('cycle_schema.json', cycles);
  });
});

describe('Packs', () => {
  const packs = getPacksJson();

  it('packs.json passes schema validation', () => {
    validateAgainstSchema('pack_schema.json', packs);
  });

  it('packs have valid cycle codes', () => {
    const cycleCodes = new Set<string>(getCyclesJson().map(a => a.code));
    packs.forEach(pack => {
      expect(cycleCodes).to.include(pack.cycle_code, `Pack ${pack.name} has bad cycle ${pack.cycle_code}`); 
    });
  });
});

describe('Types', () => {
  const types = getTypesJson();

  it('types.json passes schema validation', () => {
    validateAgainstSchema('type_schema.json', types);
  });
});

describe('Rotations', () => {
  const rotations = getRotationsJson();

  it('rotations.json passes schema validation', () => {
    validateAgainstSchema('rotations_schema.json', rotations);
  });

  it('rotations have valid cycle codes', () => {
    const cycleCodes = new Set<string>(getCyclesJson().map(a => a.code));
    rotations.forEach(rotation => {
      rotation.rotated.forEach(cycle_code => {
        expect(cycleCodes).to.include(cycle_code, `Rotation ${rotation.name} has bad cycle ${cycle_code}`); 
      });
    });
  });
});

describe('Cards', () => {
  const cards = getCardsJson();

  it('cards.json passes schema validation', () => {
    validateAgainstSchema('card_schema.json', cards);
  });

  it('cards have the same pack_code as the pack filename', () => {
    const packsByCode = getPackFilesJson();
    packsByCode.forEach((value, key) => {
      value.forEach(card => {
        expect(key).to.equal(card.pack_code, `${card.title} in pack/${key}.json has bad pack code ${card.pack_code}`);
      });
    });
  });

  it('cards have valid pack codes', () => {
    const packCodes = new Set<string>(getPacksJson().map(a => a.code));
    cards.forEach(card => {
      expect(packCodes).to.include(card.pack_code, `Card ${card.title} has bad pack ${card.pack_code}`); 
    });
  });

  function validateAttributeAcrossPrintings(cards, attribute, getter) {
    const map = new Map<string, Set<string>>();
    cards.forEach(card => {
      let set = map.get(card.title);
      if (typeof set === "undefined") {
        set = new Set<string>();
        map.set(card.title, set);
      }
      set.add(getter(card));
    });
  
    map.forEach((set, title) => {
      expect(set.size).to.equal(1, `card ${title} has varying ${attribute} across printings:\n\t${Array.from(set).join('\n\t')}`);
    });
  }

  it('cards with multiple printings have identical required attributes', () => {
    validateAttributeAcrossPrintings(cards, 'advancement_cost', function(card) { return card.advancement_cost });
    validateAttributeAcrossPrintings(cards, 'agenda_points', function(card) { return card.agenda_points });
    validateAttributeAcrossPrintings(cards, 'base_link', function(card) { return card.base_link });
    validateAttributeAcrossPrintings(cards, 'cost', function(card) { return card.cost });
    validateAttributeAcrossPrintings(cards, 'deck_limit', function(card) { return card.deck_limit });
    validateAttributeAcrossPrintings(cards, 'faction_code', function(card) { return card.faction_code });
    validateAttributeAcrossPrintings(cards, 'faction_cost', function(card) { return card.faction_cost });
    validateAttributeAcrossPrintings(cards, 'influence_limit', function(card) { return card.influence_limit });
    validateAttributeAcrossPrintings(cards, 'keywords', function(card) { return card.keywords });
    validateAttributeAcrossPrintings(cards, 'memory_cost', function(card) { return card.memory_cost });
    validateAttributeAcrossPrintings(cards, 'minimum_deck_size', function(card) { return card.minimum_deck_size });
    validateAttributeAcrossPrintings(cards, 'side_code', function(card) { return card.side_code });
    validateAttributeAcrossPrintings(cards, 'strength', function(card) { return card.strength });
    validateAttributeAcrossPrintings(cards, 'stripped_text', function(card) { return card.stripped_text });
    validateAttributeAcrossPrintings(cards, 'stripped_title', function(card) { return card.stripped_title });
    validateAttributeAcrossPrintings(cards, 'text', function(card) { return card.text });
    validateAttributeAcrossPrintings(cards, 'trash_cost', function(card) { return card.trash_cost });
    validateAttributeAcrossPrintings(cards, 'type_code', function(card) { return card.type_code });
    validateAttributeAcrossPrintings(cards, 'type_uniqueness', function(card) { return card.type_uniqueness });
  });

  it('stripped text and title are ascii only', () => {
    cards.forEach(card => {
      if (card.text) {
        expect(card.stripped_text, `${card.title} stripped_text missing`).to.exist; 
        expect(card.stripped_text, `${card.title} stripped_text should be ascii only`).to.equal(
            Buffer.from(card.stripped_text.toString()).toString("ascii"));
      }
      expect(card.stripped_title, `${card.title} stripped_title should be ascii only`).to.equal(
        Buffer.from(card.stripped_title.toString()).toString("ascii"));
    });
  });

  it('interface formatting is correct', () => {
    cards.forEach(card => {
      if (card.text) {
        const textMatches = card.text.match(/Interface(..)?/g);
        for (const m in textMatches) {
          expect(textMatches[m], `${card.title} has incorrect interface formatting in text`)
              .to.equal('Interface →');
        }
        const strippedTextMatches = card.stripped_text.match(/Interface(...)?/g);
        for (const m in strippedTextMatches) {
          expect(strippedTextMatches[m], `${card.title} has incorrect interface formatting in stripped_text`)
              .to.equal('Interface ->');
        }
      }
    });
  });

  it('interrupt formatting is correct', () => {
    cards.forEach(card => {
      if (card.text) {
        const textMatches = card.text.match(/\[interrupt\](..)?/g);
        for (const m in textMatches) {
          expect(textMatches[m], `${card.title} has incorrect interrupt formatting in text`)
              .to.equal('[interrupt] →');
        }
        const strippedTextMatches = card.stripped_text.match(/Interrupt(...)?/gi);
        for (const m in strippedTextMatches) {
          expect(strippedTextMatches[m], `${card.title} has incorrect interrupt formatting in stripped_text`)
              .to.equal('Interrupt ->');
        }
      }
    });
  });
});

describe('Translations', () => {
  const baseTranslationsPath = resolve(__dirname, "../../translations");
  const translationDirs =
    fs.readdirSync(baseTranslationsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  function checkTranslationsSimple(baseTranslationsPath, localeName, baseFileName) {
    const fileName = `${baseFileName}.${localeName}.json`;
    const filePath = resolve(baseTranslationsPath, localeName, fileName);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(json, `Translation JSON file ${filePath}`).to.exist;
  }

  function checkTranslationsPacks(baseTranslationsPath, localeName) {
    const packsTranslationsPath = resolve(baseTranslationsPath, localeName, 'pack');
    fs.readdirSync(packsTranslationsPath).forEach(file => {
      const json = JSON.parse(fs.readFileSync(resolve(packsTranslationsPath, file), 'utf-8'));
      expect(json, `Translation JSON pack file ${file}`).to.exist;
    });
  }

  it('check translations for basic JSON correctness.', () => {
    translationDirs.forEach((localeName) => {
      checkTranslationsSimple(baseTranslationsPath, localeName, 'cycles');
      checkTranslationsSimple(baseTranslationsPath, localeName, 'factions');
      checkTranslationsSimple(baseTranslationsPath, localeName, 'packs');
      checkTranslationsSimple(baseTranslationsPath, localeName, 'sides');
      checkTranslationsSimple(baseTranslationsPath, localeName, 'types');
      checkTranslationsPacks(baseTranslationsPath, localeName);
    });
  });
});

describe('Prebuilts', () => {
  it('prebuilts.json is correct JSON', () => {
    const prebuilts = getPrebuiltsJson();
    expect(prebuilts).to.exist; 
  });
});

describe('Mwl', () => {
  it('mwl.json is correct JSON', () => {
    const mwl = getMwlJson();
    expect(mwl).to.exist; 
  });
});
