import fs from "fs";
import { basename, resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardsV2Json, getCardSetsV2Json, getCardSubtypesV2Json, getCyclesV2Json, getFactionsV2Json, getSetTypesV2Json, getSidesV2Json, getTypesV2Json, textToId } from "../src/index";
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

describe('Sides', () => {
  const sides = getSidesV2Json();
  it('sides.json passes schema validation', () => {
    validateAgainstSchema('side_schema.json', sides);
  });
});

describe('Factions', () => {
  const factions = getFactionsV2Json();
  it('factions.json passes schema validation', () => {
    validateAgainstSchema('faction_schema.json', factions);
  });

  it('have proper id format', () => {
    factions.forEach(f => {
      expect(f.id, `Faction ${f.name} has unexpected id ${f.id}`).to.equal(textToId(f.name));
    });
  });
});

describe('Cycles', () => {
  const cycles = getCyclesV2Json();

  it('cycles.json passes schema validation', () => {
    validateAgainstSchema('cycle_schema.json', cycles);
  });
});

describe('SetTypes', () => {
  const set_types = getSetTypesV2Json();

  it('set_types.json passes schema validation', () => {
    validateAgainstSchema('set_types_schema.json', set_types);
  });

  it('set_types have proper name/id format', () => {
    set_types.forEach(function(st) {
      expect(st.id).to.equal(st.name.toLowerCase().replaceAll(' ', '_'));
    });
  });
});

describe('Types', () => {
  const types = getTypesV2Json();

  it('types.json passes schema validation', () => {
    validateAgainstSchema('type_schema.json', types);
  });

  it('types have proper name/id format', () => {
    types.forEach(function(t) {
      expect(t.id).to.equal(textToId(t.name));
    });
  });
});

describe('Card Subtypes', () => {
  const subtypes = getCardSubtypesV2Json();

  it('subtypes.json passes schema validation', () => {
    validateAgainstSchema('card_subtypes_schema.json', subtypes);
  });

  it('subtypes have proper name/id format', () => {
    subtypes.forEach(function(s) {
      expect(s.id).to.equal(textToId(s.name));
    });
  });
});

describe('Card Sets', () => {
  const sets = getCardSetsV2Json();

  it('sets.json passes schema validation', () => {
    validateAgainstSchema('card_set_schema.json', sets);
  });

  it('has valid cycle ids', () => {
    const cardCycleIds = new Set(getCyclesV2Json().map(c => c.id));
    sets.forEach(s => {
     expect(cardCycleIds, `Card set ${s.name} has invalid card_cycle_id ${s.card_cycle_id}`).to.include(s.card_cycle_id);
    });
  });
});

describe('Cards', () => {
  const cardDir = resolve(__dirname, "../v2/cards");
  const cardFiles =
    fs.readdirSync(cardDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => dirent.name);

  const schema_path = resolve(__dirname, "../schema/v2/card_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('card files pass schema validation', () => {
    cardFiles.forEach(file => {
      const json = JSON.parse(fs.readFileSync(resolve(cardDir, file), 'utf-8'));
      validate(json);
      if (validate.errors) {
        expect.fail(`card ${json.title}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });
});

describe('Printings', () => {
  const printingDir = resolve(__dirname, "../v2/printings");
  const printingFiles =
    fs.readdirSync(printingDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => dirent.name);

  const schema_path = resolve(__dirname, "../schema/v2/printings_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('printing files pass schema validation', () => {
    printingFiles.forEach(file => {
      const json = JSON.parse(fs.readFileSync(resolve(printingDir, file), 'utf-8'));
      validate(json);
      if (validate.errors) {
        expect.fail(`printing ${file}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('printing files have valid ids', () => {
    const cardIds = new Set<string>(getCardsV2Json().map(c => c.id));
    const cardSetIds = new Set<string>(getCardSetsV2Json().map(s => s.id));
    const printingIds = new Set<string>();
    printingFiles.forEach(file => {
      const printing = JSON.parse(fs.readFileSync(resolve(printingDir, file), 'utf-8'));
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
    printingFiles.forEach(file => {
      const cardSetIdFromFile = basename(file).replace('.json', ''); 
      const printing = JSON.parse(fs.readFileSync(resolve(printingDir, file), 'utf-8'));
      printing.forEach(p => {
        expect(cardSetIdFromFile, `card_set_id ${p.card_set_id} for ${p.card_id} / ${p.id} does not match file name of ${cardSetIdFromFile}`).to.equal(p.card_set_id);
      });
    });
  });
});

describe('Card Pools', () => {
  const cardPoolDir = resolve(__dirname, "../v2/card_pools");
  const cardPoolFiles =
    fs.readdirSync(cardPoolDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => dirent.name);

  const schema_path = resolve(__dirname, "../schema/v2/card_pool_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('card pool files pass schema validation', () => {
    cardPoolFiles.forEach(file => {
      const json = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      validate(json);
      if (validate.errors) {
        expect.fail(`cardPool ${file}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('card pool files have valid ids', () => {
    const cardCycleIds = new Set<string>(getCyclesV2Json().map(c => c.id));
    const cardSetIds = new Set<string>(getCardSetsV2Json().map(s => s.id));

    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
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
    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        expect(cardPoolIds.has(p.id), `Printing ${file} has duplicate id ${p.id}`).to.be.false;
        cardPoolIds.add(p.id);
      });
    });
  });

  it('card pool files have unique names within each format', () => {
    cardPoolFiles.forEach(file => {
      const names = new Set<string>();
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        expect(names.has(p.name), `Printing ${file} has duplicate name ${p.name}`).to.be.false;
        names.add(p.name);
      });
    });
  });
});

describe('Restrictions', () => {
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

  // TODO(plural): de-dupe this with the format id.
  const formats =
    fs.readdirSync(resolve(__dirname, "../v2/formats"), { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);
  const formatIds = new Set<string>();
  formats.forEach(f => {
    const format = JSON.parse(fs.readFileSync(resolve(__dirname, "../v2/formats", f), 'utf-8'));
    formatIds.add(format.id);
  });

  const cardIds = new Set<string>(getCardsV2Json().map(c => c.id));
  const subtypes = new Set<string>(getCardSubtypesV2Json().map(c => c.id));

  const schema_path = resolve(__dirname, "../schema/v2/restriction_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);

  it('restriction files pass schema validation', () => {
    restrictionFiles.forEach(file => {
      const restriction = JSON.parse(fs.readFileSync(file, 'utf-8'));
      validate(restriction);
      if (validate.errors) {
        expect.fail(`Restriction file ${basename(file)} for ${restriction.format_id} format: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('restriction files have unique ids and names', () => {
    const restrictionIds = new Set<string>();
    const restrictionNames = new Set<string>();
    restrictionFiles.forEach(file => {
      const restriction = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(restrictionNames.has(restriction.name), `Restriction ${basename(file)} for format ${restriction.format_id} has duplicate name ${restriction.name}`).to.be.false;
      restrictionNames.add(restriction.name);
      expect(restrictionIds.has(restriction.id), `Restriction ${basename(file)} for format ${restriction.format_id} has duplicate id ${restriction.id}`).to.be.false;
      restrictionIds.add(restriction.id);
    });
  });

  it('restriction files have valid ids', () => {
    restrictionFiles.forEach(file => {
      const restriction = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(formatIds.has(restriction.format_id), `Restriction ${restriction.name} has invalid format ${restriction.format_id}`).to.be.true;

      // TODO(plural): Ensure that banned contains all cards with the given subtypes.
      if (restriction.subtypes) {
        restriction.subtypes.banned.forEach(s => {
          expect(subtypes.has(s), `Restriction ${restriction.name} has invalid subtype ${s}`).to.be.true;
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
    });
  });
});

describe('Formats', () => {
  const formatPoolDir = resolve(__dirname, "../v2/formats");
  const formatPoolFiles =
    fs.readdirSync(formatPoolDir, { withFileTypes: true })
      .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
      .map(dirent => dirent.name);

  const schema_path = resolve(__dirname, "../schema/v2/format_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);
  it('format files pass schema validation', () => {
    formatPoolFiles.forEach(file => {
      const json = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      validate(json);
      if (validate.errors) {
        expect.fail(`formatPool ${file}: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('format files have a single active snapshot', () => {
    formatPoolFiles.forEach(file => {
      let activeSnapshot = "";
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      format.snapshots.forEach(s => {
        if (s.active) {
          expect(activeSnapshot, `Format ${format.name} can only have one active snapshot. ${activeSnapshot} was seen before ${s.date_start} but both are marked active.`).to.be.empty;
          activeSnapshot = s.date_start;
        }
      });
    });
  });

  it('format files have unique date_start fields', () => {
    formatPoolFiles.forEach(file => {
      const dateStart = new Set<string>();
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      format.snapshots.forEach(s => {
          expect(dateStart, `Format ${format.name} has a snapshot with a duplicate date_start: ${s.date_start}.`).to.not.include(s.date_start);
          dateStart.add(s.date_start);
      });
    });
  });

  it('format files have valid card pools and restrictions', () => {
    const cardPoolDir = resolve(__dirname, "../v2/card_pools");
    const cardPoolFiles =
      fs.readdirSync(cardPoolDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
        .map(dirent => dirent.name);
    const cardPoolIds = new Set<string>();
    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        cardPoolIds.add(p.id);
      });
    });
    formatPoolFiles.forEach(file => {
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      if (format.snapshots) {
        format.snapshots.forEach(s => {
          expect(cardPoolIds, `Snapshot ${format.name} has invalid card pool ${s.card_pool_id}`).includes(s.card_pool_id);
        });
      }
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
    const restrictionIds = new Set<string>();
    restrictionFiles.forEach(file => {
      const restriction = JSON.parse(fs.readFileSync(file, 'utf-8'));
      restrictionIds.add(restriction.id);
    });
    formatPoolFiles.forEach(file => {
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      if (format.snapshots) {
        format.snapshots.forEach(s => {
          if (s.restriction_id) {
            expect(restrictionIds, `Snapshot ${format.name} has invalid restriction id ${s.restriction_id}`).includes(s.restriction_id);
          }
        });
      }
    });

  });
});
