import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCyclesV2Json, getFactionsV2Json, getSetTypesV2Json, getSidesV2Json, getTypesV2Json } from "../../src/index";

const ajv = new Ajv2020({ strict: true, allErrors: true });

// Sides
const side_schema_path = resolve(__dirname, "../../schema/v2", "side_schema.json");
const side_schema = JSON.parse(fs.readFileSync(side_schema_path, "utf-8"));
export const validateSidesSchema: any = ajv.compile(side_schema);
const sides = getSidesV2Json();
if (!validateSidesSchema(sides)) {
  console.log(validateSidesSchema.errors);
  process.exit(1);
}

// Factions
const faction_schema_path = resolve(__dirname, "../../schema/v2", "faction_schema.json");
const faction_schema = JSON.parse(fs.readFileSync(faction_schema_path, "utf-8"));
export const validateFactionsSchema: any = ajv.compile(faction_schema);
const factions = getFactionsV2Json();
if (!validateFactionsSchema(factions)) {
  console.log(validateFactionsSchema.errors);
  process.exit(1);
}

const path = resolve(__dirname, "../../schema/v2", "cycle_schema.json");
const schema = JSON.parse(fs.readFileSync(path, "utf-8"));
export const validateCycle: any = ajv.compile(schema);

const cycles = getCyclesV2Json();
if (!validateCycle(cycles)) {
  console.log(validateCycle.errors);

  process.exit(1);
}

// Set Types
const set_types_schema_path = resolve(__dirname, "../../schema/v2", "set_types_schema.json");
const set_types_schema = JSON.parse(fs.readFileSync(set_types_schema_path, "utf-8"));
export const validateSetTypesSchema: any = ajv.compile(set_types_schema);
const set_types = getSetTypesV2Json();
if (!validateSetTypesSchema(set_types)) {
  console.log(validateSetTypesSchema.errors);
  process.exit(1);
}

let numSetTypeFormatErrors = 0;
set_types.forEach(function(st) {
  if (st.code != st.name.toLowerCase().replaceAll(" ", "_")) {
    console.log(`"${st.code}" is not the proper code for "${st.name}"`);
    numSetTypeFormatErrors++;
  }
});
if (numSetTypeFormatErrors) {
  process.exit(1);
}

// Types 
const type_schema_path = resolve(__dirname, "../../schema/v2", "type_schema.json");
const type_schema = JSON.parse(fs.readFileSync(type_schema_path, "utf-8"));
export const validateTypesSchema: any = ajv.compile(type_schema);
const types = getTypesV2Json();
if (!validateTypesSchema(types)) {
  console.log(validateTypesSchema.errors);
  process.exit(1);
}


