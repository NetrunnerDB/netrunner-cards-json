// Create a new banlist based on an existing banlist and additions/deletions.
//
// Currently only handles standard implicitly.
// Example usage:
//   npm run build
//   npx ts-node dist/new-banlist.js -s standard-ban-list-23-09 -n "Standard Banlist 24.03" --effective_date="2024-03-18" -c standard-ban-list-24-03 -a formicary

import fs from "fs";
import { resolve } from "path";
import commandLineArgs = require('command-line-args');
import prettier from "prettier";
import { getMwlJson, getRestrictionsV2Json, textToId, getPrintingsV2Json } from "./index";

async function formatJSON(text: any) {
  const data = JSON.stringify(text);
  return await prettier.format(data, {
    parser: 'json',
    plugins: ['prettier-plugin-sort-json'],
    // Note: the recursive sort is not actually working yet due to an issue with the plugin.
    jsonRecursiveSort: true,
  });
}

const optionDefinitions = [
  { name: 'source_code', description: 'Source code for the new banlist.', alias: 's', type: String },
  { name: 'name', description: 'Name for the new banlist.', alias: 'n', type: String },
  { name: 'effective_date', description: 'Effective date for the new banlist.', alias: 'd', type: String },
  { name: 'new_code', description: 'New code for the new banlist.', alias: 'c', type: String },
  { name: 'add_cards', description: 'Comma-separated list of V2 card IDs to add to the MWL.', alias: 'a', type: String },
  { name: 'remove_cards', description: 'Comma-separated list of V2 card IDs to remove from the MWL.', alias: 'r', type: String },
];
const options = commandLineArgs(optionDefinitions);

if (!options.source_code) {
  console.error("You must provide the code for an existing MWL to base this one on with --source_code or -s.");
  process.exit(1);
}
if (!options.name) {
  console.error("You must provide the name for the new MWL with --name or -n.");
  process.exit(1);
}
if (!options.effective_date) {
  console.error("You must provide the effective_date for the new MWL with --effective_date or -d.");
  process.exit(1);
}
if (!options.new_code) {
  console.error("You must provide the code for the new MWL with --new_code or -c.");
  process.exit(1);
}

const cardsToPrintings = new Map<string, Array<string>>();
const printings = getPrintingsV2Json();
printings.forEach(p => {
  if (!cardsToPrintings.has(p.card_id)) {
    cardsToPrintings.set(p.card_id, new Array<string>());
  }
  cardsToPrintings.get(p.card_id)?.push(p.id);
});
let addCards = new Array<string>();
if (options.add_cards) {
  addCards = options.add_cards.split(',');
}
const addPrintings = new Array<string>();
addCards.forEach(c => {
  addPrintings.push(cardsToPrintings[c]);
});
let removeCards = new Array<string>();
if (options.remove_cards) {
  removeCards = options.remove_cards.split(',');
}
const removePrintings = new Array<string>();
removeCards.forEach(c => {
  removePrintings.push(...(cardsToPrintings.get(c) || []));
});


let srcMwl: any = null;
const mwls = getMwlJson();
mwls.forEach(m => {
  if (m.code == options.source_code) {
    srcMwl = JSON.parse(JSON.stringify(m));
  }
});

console.log(`Found mwl ${JSON.stringify(srcMwl)}`);

srcMwl.code = options.new_code;
srcMwl.name = options.name;
srcMwl.date_start = options.effective_date;
addCards.forEach(c => {
  cardsToPrintings.get(c)?.forEach(p => {
    srcMwl.cards[p] = { "deck_limit": 0 };
  });
});

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

srcMwl.cards = convertMapToObject(filterMapKeys(convertObjectToMap(srcMwl.cards), removePrintings));

mwls.push(srcMwl);

formatJSON(mwls).then((content) => {
    fs.writeFile(
        resolve("mwl.json"),
        content,
        function (err) {
            if (err) {
                console.log(`Could not write updated mwls.json: ${err}`);
            }
        },
    );
});

// Handle the V2 restriction format.
const restrictions = getRestrictionsV2Json();

const standardRestrictions = restrictions['standard'];

let srcRestriction: any = null;

standardRestrictions.forEach((v) => {
  console.log(`${v.id}`);
  if (textToId(options.source_code) == v.id) {
    srcRestriction = v;
  }
});

srcRestriction.date_start = options.effective_date;
srcRestriction.name = options.name;
srcRestriction.id = textToId(options.new_code);
srcRestriction.banned.push(...addCards);
srcRestriction.banned = srcRestriction.banned.filter((c: string) => !removeCards.includes(c));
// TODO(plural): Remove this when prettier's jsonRecursiveSort is fixed.
srcRestriction.banned = srcRestriction.banned.sort();

const output_restriction = `v2/restrictions/standard/${textToId(options.new_code)}.json`;
formatJSON(srcRestriction).then((content) => {
    fs.writeFile(
        resolve(output_restriction),
        content,
        function (err) {
            if (err) {
                console.log(`Could not write ${output_restriction}: ${err}`);
            }
        },
    );
});
