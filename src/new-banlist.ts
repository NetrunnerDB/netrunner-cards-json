// Create a new banlist based on an existing banlist and additions/deletions.
//
// Currently only handles standard implicitly.
// Example usage:
//   npm run build
//   npx ts-node dist/new-banlist.js -s standard-ban-list-23-09 -n "Standard Banlist 24.03" --effective_date="2024-03-18" -c standard-ban-list-24-03 -a formicary

import fs from 'fs';
import { resolve } from 'path';
import commandLineArgs from 'command-line-args';
import prettier from 'prettier';
import { getMwlJson, getRestrictionsV2Json, textToId, getPrintingsV2Json } from './index';

const optionDefinitions = [
  { name: 'source_code', description: 'Source code for the new banlist.', alias: 's', type: String, defaultValue: '' },
  { name: 'name', description: 'Name for the new banlist.', alias: 'n', type: String, defaultValue: '' },
  { name: 'effective_date', description: 'Effective date for the new banlist.', alias: 'd', type: String, defaultValue: '' },
  { name: 'new_code', description: 'New code for the new banlist.', alias: 'c', type: String, defaultValue: '' },
  { name: 'add_cards', description: 'Comma-separated list of V2 card IDs to add to the MWL.', alias: 'a', type: String, defaultValue: '' },
  { name: 'remove_cards', description: 'Comma-separated list of V2 card IDs to remove from the MWL.', alias: 'r', type: String, defaultValue: '' },
];
const options = commandLineArgs(optionDefinitions);

function validateArgs(options: any) {
  if (!options.source_code) {
    console.error('You must provide the code for an existing MWL to base this one on with --source_code or -s.');
    process.exit(1);
  }
  if (!options.name) {
    console.error('You must provide the name for the new MWL with --name or -n.');
    process.exit(1);
  }
  if (!options.effective_date) {
    console.error('You must provide the effective_date for the new MWL with --effective_date or -d.');
    process.exit(1);
  }
  if (!options.new_code) {
    console.error('You must provide the code for the new MWL with --new_code or -c.');
    process.exit(1);
  }
}

async function formatJSON(text: any) {
  const data = JSON.stringify(text);
  return prettier.format(data, {
    parser: 'json',
    plugins: ['prettier-plugin-sort-json'],
    // Note: the recursive sort is not actually working yet due to an issue with the plugin.
    jsonRecursiveSort: true,
  });
}

function writeJsonToFile(obj, filename) {
  formatJSON(obj).then((content) => {
      fs.writeFile(
          resolve(filename),
          content,
          function (err) {
              if (err) {
                  console.log(`Could not write to ${filename}: ${err}`);
                  process.exit(1);
              }
          },
      );
  });
}

function buildCardsToPrintings() {
  const printings = getPrintingsV2Json();
  const cardsToPrintings = new Map<string, Array<string>>();
  printings.forEach(p => {
    if (!cardsToPrintings.has(p.card_id)) {
      cardsToPrintings.set(p.card_id, new Array<string>());
    }
    cardsToPrintings.get(p.card_id)?.push(p.id);
  });
  return cardsToPrintings;
}

function findMwlByCode(mwls: any, code: string): any {
  for (let i = 0; i < mwls.length; i++) {
    if (mwls[i].code == code) {
      return JSON.parse(JSON.stringify(mwls[i]));
    }
  }
  console.error(`Could not find MWL with code ${code}`);
  process.exit(1);
}

// Helpers to deal with the fact that the MWL cards entry is a map-like object.
function convertObjectToMap<T>(obj: { [key: number]: T }): Map<string, T> {
  const map = new Map<string, T>();
  for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
          map.set(key, obj[key]);
      }
  }
  return map;
}

function filterMapKeys<T, U>(sourceMap: Map<T, U>, keysToFilterOut: T[]): Map<T, U> {
  const filteredMap = new Map<T, U>();
  for (const [key, value] of sourceMap) {
      if (!keysToFilterOut.includes(key)) {
          filteredMap.set(key, value);
      }
  }
  return filteredMap;
}

function convertMapToObject<T>(map: Map<string, T>): { [key: number]: T } {
  const obj: { [key: number]: T } = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

function getRestrictionById(restrictions: any, id: string) {
  for (let i = 0; i < restrictions.length; i++) {
    if (restrictions[i].id == id) {
      return JSON.parse(JSON.stringify(restrictions[i]));
    }
  }
  console.error(`Could not find restriction with id ${id}`);
  process.exit(1);
}

validateArgs(options);
const cardsToPrintings = buildCardsToPrintings();

const addCards = options.add_cards.split(',');

const addPrintings = new Array<string>();
addCards.forEach(c => {
  addPrintings.push(...(cardsToPrintings.get(c) || []));
});

const removeCards = options.remove_cards.split(',');
const removePrintings = new Array<string>();
removeCards.forEach(c => {
  removePrintings.push(...(cardsToPrintings.get(c) || []));
});

const mwls = getMwlJson();
const srcMwl = findMwlByCode(mwls, options.source_code);

console.log(`Found mwl ${JSON.stringify(srcMwl)}`);

srcMwl.code = options.new_code;
srcMwl.name = options.name;
srcMwl.date_start = options.effective_date;
addCards.forEach(c => {
  cardsToPrintings.get(c)?.forEach(p => {
    srcMwl.cards[p] = { 'deck_limit': 0 };
  });
});

srcMwl.cards = convertMapToObject(filterMapKeys(convertObjectToMap(srcMwl.cards), removePrintings));

mwls.push(srcMwl);

writeJsonToFile(mwls, 'mwl.json');

// Handle the V2 restriction format.
const restrictions = getRestrictionsV2Json();
const standardRestrictions = restrictions['standard'];

const restriction: any = getRestrictionById(standardRestrictions, textToId(options.source_code));
restriction.date_start = options.effective_date;
restriction.name = options.name;
restriction.id = textToId(options.new_code);
restriction.banned.push(...addCards);
restriction.banned = restriction.banned.filter((c: string) => !removeCards.includes(c));
// TODO(plural): Remove this when prettier's jsonRecursiveSort is fixed.
restriction.banned.sort();

const restriction_filename = `v2/restrictions/standard/${textToId(options.new_code)}.json`;
writeJsonToFile(restriction, restriction_filename);
