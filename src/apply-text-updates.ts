// Apply text updates from a JSON file containining entries like:
// {
//   "name": "Museum of History",
//   "stripped_text": "This asset costs 0 influence if you have 50 or more cards in your deck. When your turn begins, you may shuffle 1 card from Archives into R&D.",
//   "text": "This asset costs 0 influence if you have 50 or more cards in your deck.\nWhen your turn begins, you may shuffle 1 card from Archives into R&D.",
//   "subtypes": "New - Sub - Type",
//   "last_change_label": "CTU12.2022"
// }
// subtypes is an optional value and last_change_label is purely for debugging.
// Run npm run format after this script to ensure the files are properly formatted and the diffs are minimal.

import fs from "fs";
import { resolve } from "path";
import * as commandLineArgs from 'command-line-args';
import { textToId } from "./index";

const optionDefinitions = [
  { name: 'updates_file', description: 'Input file containing the text updates to apply.', alias: 'u', type: String }
];
const options = commandLineArgs(optionDefinitions);

if (!options.updates_file) {
  console.error("You must provide a path to the JSON file with the text updates to this script with --updates_file or -u .");
  process.exit(1);
}
const updates = JSON.parse(fs.readFileSync(options.updates_file, "utf-8"));

const uppies = new Map<string, any>();
updates.forEach(u => {
  uppies.set(u.name, u);
});

// Update v1 pack file cards.
const packDir = resolve(__dirname, '..', 'pack');
fs.readdirSync(packDir).forEach(file => {
  if (file.endsWith('.json')) {
    let needsUpdates = false;
    const path = resolve(packDir, file);
    const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    json.forEach(c => {
      if (uppies.has(c.title)) {
        const u = uppies.get(c.title);
        if (((c.text != u.text) || (c.stripped_text != u.stripped_text) || (u.subtypes && (c.keywords != u.subtypes))) ) {
          needsUpdates = true;
          console.log(`V1 Pack: Need to update ${c.title} in ${file}`);
          c.text = u.text;
          c.stripped_text = u.stripped_text;
          if (u.subtypes && (c.keywords != u.subtypes)) {
            console.log(`  updating subtypes for "${c.title}" to "${u.subtypes}"`)
            c.keywords = u.subtypes;
          }
        }
      }
    });
    if (needsUpdates) {
      fs.writeFile(resolve(__dirname, '..', 'pack', file), JSON.stringify(json), err => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
});

const cardIdToName = new Map<string, string>();
// Update v2 card files.
const cardsDir = resolve(__dirname, '..', 'v2/cards');
fs.readdirSync(cardsDir).forEach(file => {
  if (file.endsWith('.json')) {
    let needsUpdates = false;
    const path = resolve(cardsDir, file);
    const card = JSON.parse(fs.readFileSync(path, 'utf-8'));
    cardIdToName.set(card.id, card.title);
    const u = uppies.get(card.title);
    if (uppies.has(card.title) && ((card.text != u.text) || (card.stripped_text != u.stripped_text) || u.subtypes)) {
        needsUpdates = true;
        console.log(`V2 Card: Need to update ${card.title} in ${file}`);
        card.text = u.text;
        card.stripped_text = u.stripped_text;
        if (u.subtypes) {
          console.log(`  updating subtypes for "${card.title}" to "${u.subtypes}"`)
          card.subtypes = u.subtypes.split(' - ').map((s: string) => textToId(s));
        }
    }
    if (needsUpdates) {
      fs.writeFile(resolve(cardsDir, file), JSON.stringify(card), err => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
});

// Update v2 printing files.
const printingsDir = resolve(__dirname, '..', 'v2/printings');
fs.readdirSync(printingsDir).forEach(file => {
  if (file.endsWith('.json')) {
    let needsUpdates = false;
    const path = resolve(printingsDir, file);
    const printing = JSON.parse(fs.readFileSync(path, 'utf-8'));
    printing.forEach(p => {
      const cardName = cardIdToName.get(p.card_id);
      if (cardName !== undefined) {
        if (uppies.has(cardName) && ((p.printed_text != uppies.get(cardName).text) || (p.stripped_printed_text != uppies.get(cardName).stripped_text)) ) {
            needsUpdates = true;
            console.log(`V2 Printing: Need to update ${cardIdToName.get(p.card_id)} in ${file}`);
            p.printed_text = uppies.get(cardName).text;
            p.stripped_printed_text = uppies.get(cardName).stripped_text;
        }
      }
    });
    if (needsUpdates) {
      fs.writeFile(resolve(printingsDir, file), JSON.stringify(printing), err => {
        if (err) {
          console.error(err);
        }
      });
    }
  }
});
