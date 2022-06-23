import fs from "fs";
import { basename, resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardsV2Json, getCardSetsV2Json, getCardSubtypesV2Json, getCyclesV2Json, getFactionsV2Json, getSetTypesV2Json, getSidesV2Json, getTypesV2Json, textToId } from "../src/index";
import chai = require('chai');
const expect = chai.expect;

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

  it('set_types have proper name/code format', () => {
    set_types.forEach(function(st) {
      expect(st.code).to.equal(st.name.toLowerCase().replaceAll(' ', '_'));
    });
  });
});

describe('Types', () => {
  const types = getTypesV2Json();

  it('types.json passes schema validation', () => {
    validateAgainstSchema('type_schema.json', types);
  });

  it('types have proper name/code format', () => {
    types.forEach(function(t) {
      expect(t.code).to.equal(textToId(t.name));
    });
  });
});

describe('Card Subtypes', () => {
  const subtypes = getCardSubtypesV2Json();

  it('subtypes.json passes schema validation', () => {
    validateAgainstSchema('card_subtypes_schema.json', subtypes);
  });

  it('subtypes have proper name/code format', () => {
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
    const cardCycleIds = new Set(getCyclesV2Json().map(c => c.code));
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
    const cardCycleIds = new Set<string>(getCyclesV2Json().map(c => c.code));
    const cardSetIds = new Set<string>(getCardSetsV2Json().map(s => s.id));

    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        if (p.cycles) {
          p.cycles.forEach((cycle_id: string) => {
            expect(cardCycleIds.has(cycle_id), `Card pool file ${file}, pool ${p.name} has invalid cycle code ${cycle_id}`).to.be.true;
          });
        }
        if (p.packs) {
          p.packs.forEach((pack_id: string) => {
            expect(cardSetIds.has(pack_id), `Card pool file ${file}, pool ${p.name} has invalid pack id ${pack_id}`).to.be.true;
          });
        }
      });
    });
  });

  it('card pool files have unique codes', () => {
    const cardPoolCodes = new Set<string>();
    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        expect(cardPoolCodes.has(p.code), `Printing ${file} has duplicate id ${p.code}`).to.be.false;
        cardPoolCodes.add(p.code);
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

describe('MWLs', () => {
  const mwlsDir = resolve(__dirname, "../v2/mwls");
  const formatsForMwls =
    fs.readdirSync(mwlsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

  const mwlFiles = new Array<string>();
  formatsForMwls.forEach(format => {
    fs.readdirSync(resolve(mwlsDir, format), { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name).forEach(mwl => {
        mwlFiles.push(resolve(mwlsDir, format, mwl));
      });
  });

  // TODO(plural): de-dupe this with the format code.
  const formats =
    fs.readdirSync(resolve(__dirname, "../v2/formats"), { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => dirent.name);
  const formatCodes = new Set<string>();
  formats.forEach(f => {
    const format = JSON.parse(fs.readFileSync(resolve(__dirname, "../v2/formats", f), 'utf-8'));
    formatCodes.add(format.code);
  });

  const cardIds = new Set<string>(getCardsV2Json().map(c => c.id));
  const subtypes = new Set<string>(getCardSubtypesV2Json().map(c => c.id));

  const schema_path = resolve(__dirname, "../schema/v2/mwl_schema.json");
  const schema = JSON.parse(fs.readFileSync(schema_path, "utf-8"));
  const validate: any = ajv.compile(schema);

  it('MWL files pass schema validation', () => {
    mwlFiles.forEach(file => {
      const mwl = JSON.parse(fs.readFileSync(file, 'utf-8'));
      validate(mwl);
      if (validate.errors) {
        expect.fail(`MWL file ${basename(file)} for ${mwl.format} format: ${ajv.errorsText(validate.errors)}`);
      }
    });
  });

  it('MWL files have unique codes and names', () => {
    const mwlCodes = new Set<string>();
    const mwlNames = new Set<string>();
    mwlFiles.forEach(file => {
      const mwl = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(mwlNames.has(mwl.name), `Mwl ${basename(file)} for format ${mwl.format} has duplicate name ${mwl.name}`).to.be.false;
      mwlNames.add(mwl.name);
      expect(mwlCodes.has(mwl.code), `Mwl ${basename(file)} for format ${mwl.format} has duplicate code ${mwl.name}`).to.be.false;
      mwlCodes.add(mwl.code);
    });
  });

  it('MWL files have valid ids', () => {
    mwlFiles.forEach(file => {
      const mwl = JSON.parse(fs.readFileSync(file, 'utf-8'));
      expect(formatCodes.has(mwl.format), `Mwl ${mwl.name} has invalid format ${mwl.format}`).to.be.true;

      // TODO(plural): Ensure that banned contains all cards with the given subtypes.
      if (mwl.subtypes) {
        mwl.subtypes.banned.forEach(s => {
          expect(subtypes.has(s), `Mwl ${mwl.name} has invalid subtype ${s}`).to.be.true;
        });
      }

      if (mwl.banned) {
        mwl.banned.forEach(c => {
          expect(cardIds.has(c), `Mwl ${mwl.name} has invalid card ${c} in banned`).to.be.true;
        });
      }
      if (mwl.restricted) {
        mwl.restricted.forEach(c => {
          expect(cardIds.has(c), `Mwl ${mwl.name} has invalid card ${c} in restricted`).to.be.true;
        });
      }
      if (mwl.universal_faction_cost) {
        for (const cost in mwl.universal_faction_cost) {
          mwl.universal_faction_cost[cost].forEach(card => {
            expect(cardIds.has(card), `Mwl ${mwl.name} has invalid card ${card} in universal_faction_cost["${cost}"]`).to.be.true;
          });
        }
      }
      if (mwl.global_penalty) {
        for (const cost in mwl.global_penalty) {
          mwl.global_penalty[cost].forEach(card => {
            expect(cardIds.has(card), `Mwl ${mwl.name} has invalid card ${card} in global_penalty["${cost}"]`).to.be.true;
          });
        }
      }
      if (mwl.points) {
        for (const cost in mwl.points) {
          mwl.points[cost].forEach(card => {
            expect(cardIds.has(card), `Mwl ${mwl.name} has invalid card ${card} in points["${cost}"]`).to.be.true;
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

  it('format files have valid card pools and mwls', () => {
    const cardPoolDir = resolve(__dirname, "../v2/card_pools");
    const cardPoolFiles =
      fs.readdirSync(cardPoolDir, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
        .map(dirent => dirent.name);
    const cardPoolIds = new Set<string>();
    cardPoolFiles.forEach(file => {
      const cardPool = JSON.parse(fs.readFileSync(resolve(cardPoolDir, file), 'utf-8'));
      cardPool.forEach(p => {
        cardPoolIds.add(p.code);
      });
    });
    formatPoolFiles.forEach(file => {
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      if (format.snapshots) {
        format.snapshots.forEach(s => {
          expect(cardPoolIds, `Snapshot ${format.name} has invalid card pool ${s.card_pool}`).includes(s.card_pool);
        });
      }
    });

    const mwlsDir = resolve(__dirname, "../v2/mwls");
    const formatsForMwls =
      fs.readdirSync(mwlsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const mwlFiles = new Array<string>();
    formatsForMwls.forEach(format => {
      fs.readdirSync(resolve(mwlsDir, format), { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name).forEach(mwl => {
          mwlFiles.push(resolve(mwlsDir, format, mwl));
        });
    });
    const mwlCodes = new Set<string>();
    mwlFiles.forEach(file => {
      const mwl = JSON.parse(fs.readFileSync(file, 'utf-8'));
      mwlCodes.add(mwl.code);
    });
    formatPoolFiles.forEach(file => {
      const format = JSON.parse(fs.readFileSync(resolve(formatPoolDir, file), 'utf-8'));
      if (format.snapshots) {
        format.snapshots.forEach(s => {
          if (s.mwl) {
            expect(mwlCodes, `Snapshot ${format.name} has invalid mwl code ${s.mwl}`).includes(s.mwl);
          }
        });
      }
    });

  });
});
