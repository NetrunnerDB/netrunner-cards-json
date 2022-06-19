import fs from "fs";
import {resolve} from "path";

function makeV1Reader(filename: string) {
  let json: Record<string, any>[] = [];

  return function(): Record<string, any>[] {
    if (json.length === 0) {
      const path = resolve(__dirname, '..', filename + '.json');
      json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
    return json;
  }
}

function makeV2Reader(filename: string) {
  let json: Record<string, any>[] = [];

  return function(): Record<string, any>[] {
    if (json.length === 0) {
      const path = resolve(__dirname, '../v2', filename + '.json');
      json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
    return json;
  }
}

export function textToId(text) {
  return text
    .toLowerCase()
    // Unicode Canonical Decomposition - switching single code points to multiple code points.
    .normalize('NFD')
    // remove non-ASCII
    .replace(/\P{ASCII}/u, '')
    // replace 's followed by a space or end-of-line with s and the space/end match.
    .replace(/'s(\s|$)/gu, 's$1')
    // split along space or punction.
    .split(/[\s\p{P}]+/u)
    // exclude any elements that are empty when trimmed to avoid trailing _ for the join.
    .filter(x => x.trim() != '')
    // Finally join back with underscores.
    .join('_');
}

export const getCardSubtypesV2Json = makeV2Reader('subtypes');
export const getCyclesJson = makeV1Reader('cycles');
export const getCyclesV2Json = makeV2Reader('cycles');
export const getPacksJson = makeV1Reader('packs');
export const getFactionsJson = makeV1Reader('factions');
export const getFactionsV2Json = makeV2Reader('factions');
export const getMwlJson = makeV1Reader('mwl');
export const getPrebuiltsJson = makeV1Reader('prebuilts');
export const getRotationsJson = makeV1Reader('rotations');
export const getSetTypesV2Json = makeV2Reader('set_types');
export const getSidesJson = makeV1Reader('sides');
export const getSidesV2Json = makeV2Reader('sides');
export const getTypesJson = makeV1Reader('types');
export const getTypesV2Json = makeV2Reader('types');

export function getPackFilesJson(): Map<string, Record<string, any>[]> {
  const PACKS_JSON = new Map<string, Record<string, any>[]>();

  if (PACKS_JSON.size === 0) {
    const directory = resolve(__dirname, '..', 'pack');
    fs.readdirSync(directory).forEach(file => {
      if (file.endsWith('.json')) {
        const path = resolve(directory, file);
        const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
                                PACKS_JSON.set(file.replace(".json", ""), json);
      }
    });
  }
  return PACKS_JSON;
}

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
