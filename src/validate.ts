import fs from "fs";
import { resolve } from "path";
import Ajv2020 from "ajv/dist/2020"
import { getCyclesJson } from ".";

const ajv = new Ajv2020({ strict: true });

const path = resolve(__dirname, "../schema", "cycle_schema.json");
const schema = JSON.parse(fs.readFileSync(path, "utf-8"));
export const validateCycle: any = ajv.compile(schema);

const cycles = getCyclesJson();
if (!validateCycle(cycles)) {
	console.log(validateCycle.errors);

	process.exit(1);
}
