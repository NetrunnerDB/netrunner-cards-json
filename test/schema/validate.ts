import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCardsJson, getCyclesJson, getFactionsJson, getPacksJson, getRotationsJson, getSidesJson, getTypesJson } from "../../src/index";

const ajv = new Ajv2020({ strict: true, allErrors: true });

// Sides
const side_schema_path = resolve(__dirname, "../../schema/v1", "side_schema.json");
const side_schema = JSON.parse(fs.readFileSync(side_schema_path, "utf-8"));
export const validateSidesSchema: any = ajv.compile(side_schema);
const sides = getSidesJson();
if (!validateSidesSchema(sides)) {
  console.log(validateSidesSchema.errors);
  process.exit(1);
}

// Factions
const faction_schema_path = resolve(__dirname, "../../schema/v1", "faction_schema.json");
const faction_schema = JSON.parse(fs.readFileSync(faction_schema_path, "utf-8"));
export const validateFactionsSchema: any = ajv.compile(faction_schema);
const factions = getFactionsJson();
if (!validateFactionsSchema(factions)) {
  console.log(validateFactionsSchema.errors);
  process.exit(1);
}

const factionCodes = new Set<string>(factions.map(a => a.code));

// Cycles
const cycle_schema_path = resolve(__dirname, "../../schema/v1", "cycle_schema.json");
const cycle_schema = JSON.parse(fs.readFileSync(cycle_schema_path, "utf-8"));
export const validateCyclesSchema: any = ajv.compile(cycle_schema);
const cycles = getCyclesJson();
if (!validateCyclesSchema(cycles)) {
  console.log(validateCyclesSchema.errors);
  process.exit(1);
}

// Packs
const pack_schema_path = resolve(__dirname, "../../schema/v1", "pack_schema.json");
const pack_schema = JSON.parse(fs.readFileSync(pack_schema_path, "utf-8"));
export const validatePacksSchema: any = ajv.compile(pack_schema);
const packs = getPacksJson();
if (!validatePacksSchema(packs)) {
  console.log(validatePacksSchema.errors);
  process.exit(1);
}

const cycleCodes = new Set<string>(cycles.map(a => a.code));

const packCodes = new Set<string>(packs.map(a => a.code));

let numBadPackCycleCodes = 0;
packs.forEach(function(pack) {
  packCodes.add(pack.code);
  if (!cycleCodes.has(pack.cycle_code)) {
    console.log(`FAIL "${pack.cycle_code}" is not a valid cycle code.`);
    numBadPackCycleCodes++;
  }
});

if (numBadPackCycleCodes) {
  process.exit(1);
}

// Types 
const type_schema_path = resolve(__dirname, "../../schema/v1", "type_schema.json");
const type_schema = JSON.parse(fs.readFileSync(type_schema_path, "utf-8"));
export const validateTypesSchema: any = ajv.compile(type_schema);
const types = getTypesJson();
if (!validateTypesSchema(types)) {
  console.log(validateTypesSchema.errors);
  process.exit(1);
}

const corpTypeCodes = new Set<string>(types.filter(a => a.side_code == 'corp').map(a => a.code));
const runnerTypeCodes = new Set<string>(types.filter(a => a.side_code == 'runner').map(a => a.code));

// Rotations
const rotations_schema_path = resolve(__dirname, "../../schema/v1", "rotations_schema.json");
const rotations_schema = JSON.parse(fs.readFileSync(rotations_schema_path, "utf-8"));
export const validateRotationsSchema: any = ajv.compile(rotations_schema);
const rotations = getRotationsJson();
if (!validateRotationsSchema(rotations)) {
  console.log(validateRotationsSchema.errors);
  process.exit(1);
}

//    for r in rot_data:
//        for cycle in r["rotated"]:
//            if cycle not in [f["code"] for f in cycles_data]:
//                raise jsonschema.ValidationError("Cycle code '%s' of the rotation '%s' doesn't match any valid cycle code." % (cycle, r["code"]))
//

let numBadRotationCycleCodes = 0;
rotations.forEach(function(rotation) {
  console.log("Inspecting rotations for valid cycle codes...");
  console.log(`  ${rotation.name}...`);
  rotation.rotated.forEach(function(cycle_code) {
    if (!cycleCodes.has(cycle_code)) {
      console.log(`    ${cycle_code} is not a valid cycle code!`);
      numBadRotationCycleCodes++;
    }
  });
});

if (numBadRotationCycleCodes) {
  process.exit(1);
}

// Cards
const cards_schema_path = resolve(__dirname, "../../schema/v1", "card_schema.json");
const cards_schema = JSON.parse(fs.readFileSync(cards_schema_path, "utf-8"));
export const validateCardsSchema: any = ajv.compile(cards_schema);
const cards = getCardsJson();
if (!validateCardsSchema(cards)) {
  console.log(validateCardsSchema.errors);
  process.exit(1);
}

//    "Performs more in-depth sanity checks than jsonschema validator is capable of. Assumes that the basic schema validation has already completed successfully."
let numBadCardFactionCodes = 0;
let numBadCardPackCodes = 0;
let numBadCardTypeCodes = 0;

cards.forEach(function(card) {
  if (!factionCodes.has(card.faction_code)) {
    console.log(`FAIL "${card.faction_code}" is not a valid faction code for card "${card.title}".`);
    numBadCardFactionCodes++;
  }
  if (!packCodes.has(card.pack_code)) {
    console.log(`FAIL "${card.pack_code}" is not a valid pack code for card "${card.title}".`);
    numBadCardPackCodes++;
  }
  if (card.side_code == 'corp') {
    if (card.type_code != "identity" && !corpTypeCodes.has(card.type_code)) {
      console.log(`FAIL "${card.type_code}" is not a valid corp type code for card "${card.title}".`);
      numBadCardTypeCodes++;
    }  
  } else {
    if (card.type_code != "identity" && !runnerTypeCodes.has(card.type_code)) {
      console.log(`FAIL "${card.type_code}" is not a valid runner type code for card "${card.title}".`);
      numBadCardTypeCodes++;
    }  
  }
});

if (numBadCardPackCodes || numBadCardFactionCodes || numBadCardTypeCodes) {
  process.exit(1);
}

// Change this test to validate pack file by pack file.

// Pack in file matches pack file name
//     if card["pack_code"] != pack_code:
//        raise jsonschema.ValidationError("Pack code '%s' of the card '%s' doesn't match the pack code '%s' of the file it appears in." % (card["pack_code"], card["code"], pack_code))



