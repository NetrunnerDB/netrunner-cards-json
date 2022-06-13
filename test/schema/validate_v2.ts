import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCyclesV2Json, getFactionsV2Json, getSidesV2Json } from "../../src/index";

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

// For Set types
//# Enforce the formatting on the values.
//        if t.get("name").replace(' ', '_').lower() != t.get("code"):
//            verbose_print(args, "ERROR\n",2)
//            verbose_print(args, "Validation error in set_type, code/name mismatch: (code: '%s' name: '%s')\n" % (t.get("code"), t.get("name")), 0)
//            validation_errors += 1
//            retval = False
//

