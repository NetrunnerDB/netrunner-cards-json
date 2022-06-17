import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardsJson, getCyclesJson, getFactionsJson, getPackFilesJson, getPacksJson, getRotationsJson, getSidesJson, getTypesJson } from "../../src/index";

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
//def verify_stripped_text_is_ascii(args, card, pack_code):
//    global validation_errors
//    stripped_text = card.get('stripped_text', '')
//    try:
//        stripped_text.encode('ascii')
//    except UnicodeEncodeError:
//        verbose_print(args, "ERROR\n", 2)
//        verbose_print(
//            args,
//            "Stripped text contains non-ascii characters in card: (pack code: '{}' title: '{}' stripped_text '{}')\n".format(
//                pack_code,
//                card['title'],
//                stripped_text,
//            ),
//            0,
//        )
//        validation_errors += 1
//
  });

  it('text is fancy', () => {
//def verify_text_has_fancy_text(args, card, pack_code):
//    global validation_errors
//
//    text = card.get('text', '')
//    if ('[interrupt]' in text) and ('[interrupt] →' not in text):
//        verbose_print(args, "ERROR\n", 2)
//        verbose_print(
//            args,
//            "Incorrect interrupt text in card: (pack code: '{}' title: '{}' text '{}')\n".format(
//                pack_code,
//                card['title'],
//                text,
//            ),
//            0,
//        )
//        validation_errors += 1
//    if ('Interface' in text) and (('Interface ->' in text) or ('Interface →' not in text)):
//        verbose_print(args, "ERROR\n", 2)
//        verbose_print(
//            args,
//            "Incorrect interface text in card: (pack code: '{}' title: '{}' text '{}')\n".format(
//                pack_code,
//                card['title'],
//                text,
//            ),
//            0,
//        )
//        validation_errors += 1
  });
});
