import fs from "fs";
import { resolve } from "path";
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
