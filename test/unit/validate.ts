import "mocha";
import { expect } from "chai";
import { getCyclesJson } from "../../src/index";
import { validateCycle } from "../../src/validate";

describe("validates", function() {
	specify("cycles", function() {
		const cycles = getCyclesJson();
		validateCycle(cycles);
		expect(validateCycle.errors).to.be.null;
	});
});
