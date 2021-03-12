import fs from "fs";
import {resolve} from "path";

function makeReader(filename: string) {
	let json: Record<string, any>[] = [];

	return function(): Record<string, any>[] {
		if (json.length === 0) {
			let path = resolve(__dirname, '..', filename + '.json');
			json = JSON.parse(fs.readFileSync(path, 'utf-8'));
		}
		return json;
	}
}

export const getCyclesJson = makeReader('cycles');
export const getPacksJson = makeReader('packs');
export const getFactionsJson = makeReader('factions');
export const getMwlJson = makeReader('mwl');
export const getRotationsJson = makeReader('rotations');
export const getSidesJson = makeReader('sides');

export function getCardsJson(): Record<string, any>[] {
	const CARDS_JSON: Record<string, any>[] = [];

	if (CARDS_JSON.length === 0) {
		const directory = resolve(__dirname, '..', 'pack');
		fs.readdirSync(directory).forEach(file => {
			if (file.endsWith('.json')) {
				const path = resolve(directory, file);
				const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
				json.forEach((c: Record<string, any>) => CARDS_JSON.push(c));
			}
		});
	}
	return CARDS_JSON;
}
