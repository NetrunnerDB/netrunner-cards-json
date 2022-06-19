import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardSetsV2Json, getCardSubtypesV2Json, getCyclesV2Json, getFactionsV2Json, getSetTypesV2Json, getSidesV2Json, getTypesV2Json, textToId } from "../src/index";
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
});


