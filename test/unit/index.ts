import {
	getCyclesJson,
	getPacksJson,
	getMwlJson,
	getSidesJson,
	getFactionsJson,
	getRotationsJson,
	getCardsJson,
} from "../../src/index";
import { expect } from "chai";

describe("example test", function() {
	it("getCyclesJson", function() {
		const files = getCyclesJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys("code", "name", "position", "rotated", "size");
		}
	});

	it("getPacksJson", function() {
		const files = getPacksJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys("code", "cycle_code", "date_release", "ffg_id", "name", "position", "size");
		}
	});

	it("getMwlJson", function() {
		const files = getMwlJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys("cards", "code", "date_start", "name");
		}
	});

	it("getSidesJson", function() {
		const files = getSidesJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys("code", "name");
		}
	});

	it("getFactionsJson", function() {
		const files = getFactionsJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys(
				"code",
				"color",
				"color_xterm",
				"is_mini",
				"name",
				"side_code",
			);
		}
	});

	it("getRotationsJson", function() {
		const files = getRotationsJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
		for (const file of files) {
			expect(file).to.have.keys("code", "cycles", "date_start", "name");
		}
	});

	it("getCardsJson", function() {
		const files = getCardsJson();
		expect(files).to.be.an.instanceof(Array);
		expect(files).to.have.length.greaterThan(0);
	});
});
