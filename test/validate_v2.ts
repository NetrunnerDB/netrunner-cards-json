import fs from "fs";
import { basename, resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardCyclesV2Json, getCardsV2Json, getCardSetsV2Json, getCardSetTypesV2Json, getCardSubtypesV2Json, getCardTypesV2Json, getCardLayoutsV2Json, getFactionsV2Json, getSidesV2Json, textToId } from "../src/index";
import { expect } from "chai";

const ajv = new Ajv2020({ strict: true, allErrors: true });

function validateAgainstSchema(schema_file, data) {
  const schema_path = resolve(__dirname, "../schema/v2", schema_file);
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  validate(data);
  if (validate.errors) {
    expect.fail(ajv.errorsText(validate.errors));
  }
}

// Gather all our data and do most of our file reads out here to avoid wasted work.
const sides = getSidesV2Json();
const factions = getFactionsV2Json();
const cardCycles = getCardCyclesV2Json();
const cardCycleIds = new Set(cardCycles.map(c => c.id));
const subtypes = getCardSubtypesV2Json();
const subtypeIds = new Set<string>(subtypes.map(c => c.id));
const cardSetTypes = getCardSetTypesV2Json();
const cardTypes = getCardTypesV2Json();
const cardLayouts = getCardLayoutsV2Json();
const cardSets = getCardSetsV2Json();
const cardSetIds = new Set<string>(cardSets.map(s => s.id));
const cards = getCardsV2Json();
const cardIds = new Set<string>(getCardsV2Json().map(c => c.id));

const formatPoolDir = resolve(__dirname, "../v2/formats");
const formatPoolFiles =
  fs.readdirSync(formatPoolDir, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
    .map(dirent => dirent.name);
const formatsByFilename = new Map<string, any>();
formatPoolFiles.forEach(file => {
  formatsByFilename.set(file, JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8')));
});
const formatIds = new Set<string>();
for (const format of formatsByFilename.values()) {
  formatIds.add(format.id);
}

const cardPoolDir = resolve(__dirname, "../v2/card_pools");
const cardPoolFiles =
  fs.readdirSync(cardPoolDir, { withFileTypes: true })
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
    .map(dirent => dirent.name);
const cardPoolsByFilename = new Map<string, any>();
const cardPoolIds = new Set<string>();
cardPoolFiles.forEach(file => {
  const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
  cardPoolsByFilename.set(file, cardPool);
  cardPool.forEach(p => {
    cardPoolIds.add(p.id);
  });
});

const restrictionsDir = resolve(__dirname, "../v2/restrictions");
const formatsForRestrictions =
  fs.readdirSync(restrictionsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const restrictionFiles = new Array<string>();
formatsForRestrictions.forEach(format => {
  fs.readdirSync(resolve(restrictionsDir, format), { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name).forEach(restriction => {
      restrictionFiles.push(resolve(restrictionsDir, format, restriction));
    });
});
const restrictionsByFilename = new Map<string, any>();
restrictionFiles.forEach(file => {
  restrictionsByFilename.set(file, JSON.parse(fs.readFileSync(file, 'utf-8')));
});
const restrictionIds = new Set<string>();
restrictionFiles.forEach(file => {
  const restriction = JSON.parse(fs.readFileSync(file, 'utf-8'));
  restrictionIds.add(restriction.id);
});

describe('Sides', () => {
  it('sides.json passes schema validation', () => {
    validateAgainstSchema('sides_schema.json', sides);
  });
});

describe('Factions', () => {
  it('factions.json passes schema validation', () => {
    validateAgainstSchema('factions_schema.json', factions);
  });

  it('have proper id format', () => {
    factions.forEach(f => {
      expect(f.id, `Faction ${f.name} has unexpected id ${f.id}`).to.equal(textToId(f.name));
    });
  });
});

describe('Cycles', () => {
  it('card_cycles.json passes schema validation', () => {
    validateAgainstSchema('card_cycles_schema.json', cardCycles);
  });
});

describe('SetTypes', () => {

  it('card_set_types.json passes schema validation', () => {
    validateAgainstSchema('card_set_types_schema.json', cardSetTypes);
  });

  it('cardSetTypes have proper name/id format', () => {
    cardSetTypes.forEach(function (st) {
      expect(st.id).to.equal(st.name.toLowerCase().replaceAll(' ', '_'));
    });
  });
});

describe('Types', () => {

  it('cardTypes.json passes schema validation', () => {
    validateAgainstSchema('card_types_schema.json', cardTypes);
  });

  it('cardTypes have proper name/id format', () => {
    cardTypes.forEach(function (t) {
      expect(t.id).to.equal(textToId(t.name));
    });
  });
});

describe('Card Subtypes', () => {

  it('subtypes.json passes schema validation', () => {
    validateAgainstSchema('card_subtypes_schema.json', subtypes);
  });

  it('subtypes have proper name/id format', () => {
    subtypes.forEach(function (s) {
      expect(s.id).to.equal(textToId(s.name));
    });
  });
});

describe('Card Layouts', () => {

  it('card_layouts.json passes schema validation', () => {
    validateAgainstSchema('card_layouts_schema.json', cardLayouts);
  });
});

describe('Card Sets', () => {
  it('sets.json passes schema validation', () => {
    validateAgainstSchema('card_sets_schema.json', cardSets);
  });

  it('has valid cycle ids', () => {
    cardSets.forEach(s => {
      expect(cardCycleIds, `Card set ${s.name} has invalid card_cycle_id ${s.card_cycle_id}`).to.include(s.card_cycle_id);
    });
  });
});

describe('Cards', () => {
  const schema_path = resolve(__dirname, "../schema/v2/cards_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);

  it('cards pass schema validation', () => {
    cards.forEach(card => {
      validate(card);
      if (validate.errors) {
        expect.fail(`card ${card.title}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('have valid subtypes', () => {
    cards.forEach(card => {
      card.subtypes?.forEach(s => {
        expect(subtypeIds.has(s), `Card '${card.id}' has invalid subtype '${s}'`).to.be.true;
      });
    });
  });
});

describe('Printings', () => {
  const printingDir = resolve(__dirname, "../v2/printings");
  const printingFiles =
    fs.readdirSync(printingDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => dirent.name);
  const printingsByFilename = new Map<string, any>();
  printingFiles.forEach(file => {
    const printing = JSON.parse(fs.readFileSync(resolve(printingDir, file), 'utf-8'));
    printingsByFilename.set(file, printing);
  });
  const cardsById = new Map<string, any>();
  getCardsV2Json().forEach(c => {
    cardsById.set(c.id, c);
  });

  const schema_path = resolve(__dirname, "../schema/v2/printings_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('printing files pass schema validation', () => {
    printingsByFilename.forEach((printing, filename) => {
      validate(printing);
      if (validate.errors) {
        expect.fail(`printing ${filename}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('printing files have valid ids', () => {
    const printingIds = new Set<string>();
    printingsByFilename.forEach((printing, file) => {
      const positions = new Set<number>();

      printing.forEach(p => {
        // Ensure that each printing id is unique
        expect(printingIds.has(p.id), `Printing ${file} has duplicate id ${p.id} for card ${p.card_id}`).to.be.false;
        printingIds.add(p.id);
        // Ensure that each card id is real
        expect(cardIds.has(p.card_id), `Printing ${file} has invalid card id ${p.card_id}`).to.be.true;
        // Ensure that each card set id is real
        expect(cardSetIds.has(p.card_set_id), `Printing ${file} has invalid card set id ${p.card_set_id}`).to.be.true;
        // Ensure that each printing in the file has a unique position
        expect(positions.has(p.position), `Printing ${file} has duplicate position ${p.position} for card ${p.card_id}`).to.be.false;
        positions.add(p.position);
      });
    });
  });

  it('printing files card_set_id match printing file names', () => {
    printingsByFilename.forEach((printing, file) => {
      const cardSetIdFromFile = basename(file).replace('.json', '');
      printing.forEach(p => {
        expect(cardSetIdFromFile, `card_set_id ${p.card_set_id} for ${p.card_id} / ${p.id} does not match file name of ${cardSetIdFromFile}`).to.equal(p.card_set_id);
      });
    });
  });

  it('printing files have valid copy_quantity attributes', () => {
    printingsByFilename.forEach(printing => {
      printing.filter(p => p.layout_id && p.layout_id == 'copy').forEach(p => {
        expect(p.copy_quantity + p.faces.reduce((count, s) => count + s.copy_quantity, 0), `copy_quantity properties of printing ${p.id} do not sum to its quantity property`).to.equal(p.quantity);
      });
    });
  });

  // if a layout_id is present in a card or printing, the other must either have the same layout_id or no layout_id
  it('printing files do not have conflicting layout_id with cards', () => {
    printingsByFilename.forEach(printing => {
      printing.forEach(p => {
        const card = cardsById.get(p.card_id);
        if ('layout_id' in p && 'layout_id' in card) {
          expect(p.layout_id, `layout_id ${p.layout_id} for ${p.card_id} / ${p.id} does not match card layout_id ${card.layout_id} for ${p.card_id}`).to.equal(card.layout_id);
        }
      });
    });
  });
});

describe('Card Pools', () => {
  const schema_path = resolve(__dirname, "../schema/v2/card_pools_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('card pool files pass schema validation', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      validate(cardPool);
      if (validate.errors) {
        expect.fail(`cardPool ${file}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('card pool files have valid ids', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      cardPool.forEach(p => {
        if (p.card_cycle_ids) {
          p.card_cycle_ids.forEach((cycle_id: string) => {
            expect(cardCycleIds.has(cycle_id), `Card pool file ${file}, pool ${p.name} has invalid cycle id ${cycle_id}`).to.be.true;
          });
        }
        if (p.card_set_ids) {
          p.card_set_ids.forEach((card_set_id: string) => {
            expect(cardSetIds.has(card_set_id), `Card pool file ${file}, pool ${p.name} has invalid card_set_id ${card_set_id}`).to.be.true;
          });
        }
      });
    });
  });

  it('card pool files have unique ids', () => {
    const cardPoolIds = new Set<string>();
    cardPoolsByFilename.forEach((cardPool, file) => {
      cardPool.forEach(p => {
        expect(cardPoolIds.has(p.id), `Printing ${file} has duplicate id ${p.id}`).to.be.false;
        cardPoolIds.add(p.id);
      });
    });
  });

  it('card pool files have unique names within each format', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      const names = new Set<string>();
      cardPool.forEach(p => {
        expect(names.has(p.name), `Printing ${file} has duplicate name ${p.name}`).to.be.false;
        names.add(p.name);
      });
    });
  });

  it('card pool format_ids match the name of their file', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      const expected_id = file.replace('.json', '')
      cardPool.forEach(p => {
        expect(p.format_id, `Card pool file ${file}, pool ${p.name} has invalid format id ${p.format_id}`).to.equal(expected_id);
      });
    });
  });

  it('card pool card_cycle_ids is sorted', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      cardPool.forEach(p => {
        if (p.card_cycle_ids) {
          expect(p.card_cycle_ids, `card_cycle_ids should be sorted for card pool ${p.id} in ${file}`).to.deep.equal(p.card_cycle_ids.map((e) => e).sort());
        }
      });
    });
  });

  it('card pool card_set_ids is sorted', () => {
    cardPoolsByFilename.forEach((cardPool, file) => {
      cardPool.forEach(p => {
        if (p.card_set_ids) {
          expect(p.card_set_ids, `card_set_ids should be sorted for card pool ${p.id} in ${file}`).to.deep.equal(p.card_set_ids.map((e) => e).sort());
        }
      });
    });
  });

  it('have all sets for specified cycles explicitly.', () => {
    const cardSetsByCycleId = new Map<string, Set<string>>();
    cardSets.forEach(set => {
      if (!cardSetsByCycleId.has(set.card_cycle_id)) {
        cardSetsByCycleId.set(set.card_cycle_id, new Set<string>());
      }
      cardSetsByCycleId.get(set.card_cycle_id)?.add(set.id);
    });
    cardPoolsByFilename.forEach((cardPool, file) => {
      cardPool.forEach(p => {
        p.card_cycle_ids?.forEach(card_cycle_id => {
          cardSetsByCycleId.get(card_cycle_id)?.forEach(card_set_id => {
            expect(p.card_set_ids, `card_set_ids for card pool ${p.id} in ${file} should have set ${card_set_id} for cycle ${card_cycle_id}`).includes(card_set_id);
          });
        });
      });
    });
  });
});

describe('Restrictions', () => {
  const schema_path = resolve(__dirname, "../schema/v2/restrictions_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);

  it('restriction files pass schema validation', () => {
    restrictionsByFilename.forEach((restriction, file) => {
      validate(restriction);
      if (validate.errors) {
        expect.fail(`Restriction file ${basename(file)} for ${restriction.format_id} format: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('restriction files have unique ids and names', () => {
    const ids = new Set<string>();
    const restrictionNames = new Set<string>();
    restrictionsByFilename.forEach((restriction, file) => {
      expect(restrictionNames.has(restriction.name), `Restriction ${basename(file)} for format ${restriction.format_id} has duplicate name ${restriction.name}`).to.be.false;
      restrictionNames.add(restriction.name);
      expect(ids.has(restriction.id), `Restriction ${basename(file)} for format ${restriction.format_id} has duplicate id ${restriction.id}`).to.be.false;
      ids.add(restriction.id);
    });
  });

  it('restriction files have valid ids', () => {
    for (const restriction of restrictionsByFilename.values()) {
      expect(formatIds.has(restriction.format_id), `Restriction ${restriction.name} has invalid format ${restriction.format_id}`).to.be.true;

      // TODO(plural): Ensure that banned contains all cards with the given subtypes.
      if (restriction.subtypes) {
        restriction.subtypes.banned.forEach(s => {
          expect(subtypeIds.has(s), `Restriction ${restriction.name} has invalid subtype ${s}`).to.be.true;
        });
      }

      if (restriction.banned) {
        restriction.banned.forEach(c => {
          expect(cardIds.has(c), `Restriction ${restriction.name} has invalid card ${c} in banned`).to.be.true;
        });
      }
      if (restriction.restricted) {
        restriction.restricted.forEach(c => {
          expect(cardIds.has(c), `Restriction ${restriction.name} has invalid card ${c} in restricted`).to.be.true;
        });
      }
      if (restriction.universal_faction_cost) {
        for (const cost in restriction.universal_faction_cost) {
          restriction.universal_faction_cost[cost].forEach(card => {
            expect(cardIds.has(card), `Restriction ${restriction.name} has invalid card ${card} in universal_faction_cost["${cost}"]`).to.be.true;
          });
        }
      }
      if (restriction.global_penalty) {
        for (const cost in restriction.global_penalty) {
          restriction.global_penalty[cost].forEach(card => {
            expect(cardIds.has(card), `Restriction ${restriction.name} has invalid card ${card} in global_penalty["${cost}"]`).to.be.true;
          });
        }
      }
      if (restriction.points) {
        for (const cost in restriction.points) {
          restriction.points[cost].forEach(card => {
            expect(cardIds.has(card), `Restriction ${restriction.name} has invalid card ${card} in points["${cost}"]`).to.be.true;
          });
        }
      }
    }
  });

  it('have sorted lists', () => {
    restrictionsByFilename.forEach((restriction, file) => {
      // banned
      if ('banned' in restriction) {
        expect(restriction.banned, `banned list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.banned.map((e) => e).sort());
      }
      // subtypes.banned
      if ('subtype' in restriction && 'banned' in restriction.subtype) {
        expect(restriction.subtype.banned, `subtype.banned list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.subtype.banned.map((e) => e).sort());
      }
      // global_penalty.1
      if ('global_penalty' in restriction && '1' in restriction.global_penalty) {
        expect(restriction.global_penalty['1'], `global_penalty['1'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.global_penalty['1'].map((e) => e).sort());
      }
      // universal_faction_cost.{1,3}
      if ('universal_faction_cost' in restriction && '1' in restriction.universal_faction_cost) {
        expect(restriction.universal_faction_cost['1'], `universal_faction_cost['1'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.universal_faction_cost['1'].map((e) => e).sort());
      }
      if ('universal_faction_cost' in restriction && '3' in restriction.universal_faction_cost) {
        expect(restriction.universal_faction_cost['3'], `universal_faction_cost['3'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.universal_faction_cost['3'].map((e) => e).sort());
      }
      // points.{1,2,3}
      if ('points' in restriction && '1' in restriction.points) {
        expect(restriction.points['1'], `points['1'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.points['1'].map((e) => e).sort());
      }
      if ('points' in restriction && '2' in restriction.points) {
        expect(restriction.points['2'], `points['2'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.points['2'].map((e) => e).sort());
      }
      if ('points' in restriction && '3' in restriction.points) {
        expect(restriction.points['3'], `points['3'] list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.points['3'].map((e) => e).sort());
      }
      // restricted
      if ('restricted' in restriction) {
        expect(restriction.restricted, `restricted list should be sorted for restriction ${restriction.name} in ${file}`).to.deep.equal(restriction.restricted.map((e) => e).sort());
      }
    });
  });

  it('are present in format files', () => {
    const restrictionIdsFromFormats = new Set<string>();

    // Get all formats and their listed snapshots.
    formatsByFilename.forEach((format) => {
      format.snapshots.forEach(snapshot => {
        if ('restriction_id' in snapshot) {
          restrictionIdsFromFormats.add(snapshot.restriction_id);
        }
      });
    });

    // Put any startup banlists for NRDB Classic in here.
    const ignoreRestrictions = new Set<string>(
      ['startup_ban_list_24_01_for_classic_only', 'startup_ban_list_24_09_for_classic_only']);

    restrictionIds.forEach((restrictionId) => {
      if (ignoreRestrictions.has(restrictionId)) {
        return;
      }

      expect(restrictionIdsFromFormats, `Restriction ${restrictionId} is not specified in any format snapshots.`).to.include(restrictionId);
    });
  });
});

describe('Formats', () => {
  const schema_path = resolve(__dirname, "../schema/v2/formats_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('format files pass schema validation', () => {
    formatsByFilename.forEach((format, file) => {
      validate(format);
      if (validate.errors) {
        expect.fail(`formatPool ${file}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('format files have a single active snapshot', () => {
    for (const format of formatsByFilename.values()) {
      let activeSnapshot = "";
      format.snapshots.forEach(s => {
        if (s.active) {
          expect(activeSnapshot, `Format ${format.name} can only have one active snapshot. ${activeSnapshot} was seen before ${s.date_start} but both are marked active.`).to.be.empty;
          activeSnapshot = s.date_start;
        }
      });
    }
  });

  it('format files have unique date_start fields', () => {
    for (const format of formatsByFilename.values()) {
      const dateStart = new Set<string>();
      format.snapshots.forEach(s => {
        expect(dateStart, `Format ${format.name} has a snapshot with a duplicate date_start: ${s.date_start}.`).to.not.include(s.date_start);
        dateStart.add(s.date_start);
      });
    }
  });

  it('format files have valid card pools and restrictions', () => {
    for (const format of formatsByFilename.values()) {
      format.snapshots?.forEach(s => {
        expect(cardPoolIds, `Snapshot ${format.name} has invalid card pool ${s.card_pool_id}`).includes(s.card_pool_id);
        if (s.restriction_id) {
          expect(restrictionIds, `Snapshot ${format.name} has invalid restriction id ${s.restriction_id}`).includes(s.restriction_id);
        }
      });
    }
  });
});
