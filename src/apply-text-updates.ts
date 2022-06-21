// Apply text updates from a JSON file containining entries like:
// {
//   "name": "Museum of History",
//   "stripped_text": "This asset costs 0 influence if you have 50 or more cards in your deck. When your turn begins, you may shuffle 1 card from Archives into R&D.",
//   "text": "This asset costs 0 influence if you have 50 or more cards in your deck.\nWhen your turn begins, you may shuffle 1 card from Archives into R&D."
// }
// Run npm run format after this script to ensure the files are properly formatted and the diffs are minimal.

import fs from "fs";
import { resolve } from "path";
import commandLineArgs = require('command-line-args');

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
      if (uppies.has(c.title) && ((c.text != uppies.get(c.title).text) || (c.stripped_text != uppies.get(c.title).stripped_text)) ) {
        needsUpdates = true;
        console.log(`V1 Pack: Need to update ${c.title} in ${file}`);
        c.text = uppies.get(c.title).text;
        c.stripped_text = uppies.get(c.title).stripped_text;
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
    if (uppies.has(card.title) && ((card.text != uppies.get(card.title).text) || (card.stripped_text != uppies.get(card.title).stripped_text)) ) {
        needsUpdates = true;
        console.log(`V2 Card: Need to update ${card.title} in ${file}`);
        card.text = uppies.get(card.title).text;
        card.stripped_text = uppies.get(card.title).stripped_text;
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
