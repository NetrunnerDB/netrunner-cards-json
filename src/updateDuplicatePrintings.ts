// Given a v1 pack, update all other printings of cards in that pack to the
// values in the specified pack.
// Quiet a lint warning up since we know our data exists.
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import fs from "fs";
import { resolve } from "path";
import commandLineArgs = require('command-line-args');
import prettier from "prettier";

const optionDefinitions = [
    { name: 'source_printing_file', description: 'Path to the source pack to use for the updates.', alias: 'p', type: String }
];
const options = commandLineArgs(optionDefinitions);

if (!options.source_printing_file) {
    console.error("You must provide a path to the source pack --source_printing_file or -p.");
    process.exit(1);
}

async function formatJSON(text) {
    const data = JSON.stringify(text);
    return await prettier.format(data, {
        jsonRecursiveSort: true,
        parser: "json",
        plugins: ["prettier-plugin-sort-json"],
    });
}

// Read v2 printings file.
console.log(`Input printing file is ${options.source_printing_file}`);
const source_printings = JSON.parse(fs.readFileSync(options.source_printing_file, "utf-8"));

// Maps and sets to keep track of what needs to be updated.
const cardIds = new Set<string>();
const sourcePrintingIds = new Set<string>();
const cardIdToPrintingIds = new Map<string, Array<string>>();
const v2CardsById = new Map<string, any>();
const v2PrintingsById = new Map<string, any>();
const packsNeedingUpdates = new Set<string>();
const printingIdToCardId = new Map<string, string>();

// Make a set of card ids from the updated printing file. This is the target set to use for updates.
// Make a map of printing id -> card_id for all cards.
// Read all v2 printing files
//   for each printing,
//     if the card id is in the card ids map.
//       add to a map of card_id -> [printing id]
source_printings.forEach(p => {
    cardIds.add(p.card_id);
    sourcePrintingIds.add(p.id);
    if (!cardIdToPrintingIds.has(p.card_id)) {
        cardIdToPrintingIds.set(p.card_id, new Array<string>());
    }
    cardIdToPrintingIds.get(p.card_id)?.push(p.id);
    v2PrintingsById.set(p.id, p);
    printingIdToCardId.set(p.id, p.card_id);
});

// Load all the v2 card files in the source set.
const v2CardsDir = resolve(__dirname, '..', 'v2/cards');
cardIds.forEach(card_id => {
    const path = resolve(v2CardsDir, `${card_id}.json`);
    const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
    v2CardsById.set(card_id, json);
});

// Find all the duplicate printings.
const printingDir = resolve(__dirname, '..', 'v2/printings');
fs.readdirSync(printingDir).forEach(file => {
    if (file.endsWith('.json')) {
        const path = resolve(printingDir, file);
        const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
        json.forEach(c => {
            printingIdToCardId.set(c.id, c.card_id);
            if (cardIds.has(c.card_id) && !sourcePrintingIds.has(c.id)) {
                console.log(`Found another printing for card ${c.card_id}: ${c.id}`);
                cardIdToPrintingIds.get(c.card_id)?.push(c.id);
            }
        });
    }
});

// Iterate over all the v1 pack files and identify the ones that need updates.
const packsDir = resolve(__dirname, '..', 'pack');
fs.readdirSync(packsDir).forEach(file => {
    if (file.endsWith('.json')) {
        const path = resolve(packsDir, file);
        console.log(`Reading pack in ${path}`);
        const json = JSON.parse(fs.readFileSync(path, 'utf-8'));
        json.forEach(p => {
            if (cardIds.has(printingIdToCardId.get(p.code)!)) {
                packsNeedingUpdates.add(path);
            }
        });
    }
});

packsNeedingUpdates.forEach(p => {
    console.log(`Need to update pack file ${p}`);
    const v1 = new Array<any>();
    const json = JSON.parse(fs.readFileSync(resolve(p), 'utf-8'));
    json.forEach((printing: any) => {
        if (cardIds.has(printingIdToCardId.get(printing.code)!)) {
            console.log(`Need to update printing ${printing.code} (${printing.title})`);
            const newCard = v2CardsById.get(printingIdToCardId.get(printing.code)!);
            printing.title = newCard.title;
            printing.stripped_title = newCard.stripped_title;
            printing.text = newCard.text;
            printing.stripped_text = newCard.stripped_text;
            // Note: this only handles single flip cards, not cards with more than 2 faces.
            if ('faces' in newCard) {
              printing.text  = `${printing.text}\nFlip side:\n${newCard.faces[0].text}`;
              printing.stripped_text  = `${printing.stripped_text} Flip side: ${newCard.faces[0].stripped_text}`;
            }
        }
        v1.push(printing);
    });

    // Write out the updated pack file, including prettier formatting.
    formatJSON(v1).then((content) => {
        fs.writeFile(
            resolve(p),
            content,
            function (err) {
                if (err) {
                    console.log(`Could not write updated pack to ${p}: ${err}`);
                }
            },
        );
    });
})
