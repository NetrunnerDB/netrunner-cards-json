import fetch from "sync-fetch";
import fs from "fs";
import { resolve } from "path";
import { textToId } from "./index";

console.log('Fetching rulings data from NRDB v2 API...');
const res = fetch("https://netrunnerdb.com/api/2.0/public/rulings").json();

const rulings = res.data;

const rulings_by_id = new Map<string, Array<any>>();

rulings.forEach(r => {
  const id = textToId(r.title);
  if (!rulings_by_id.has(id)) {
    rulings_by_id.set(id, []);
  }
  const ruling = {card_id: id, date_update: r.date_update, nsg_rules_team_verified: r.nsg_rules_team_verified};
  // Format ruling according to if it is a Q&A or a simple text ruling.
  r.ruling = r.ruling.replaceAll(/\r/g, '');
  if (r.ruling.match(/\?/) && r.ruling.match(/\n>/)) {
    const q_and_a = r.ruling.split(/\n>/);
    ruling['question'] = q_and_a[0].trim();
    ruling['answer'] = q_and_a[1].trim();
  } else {
    ruling['text_ruling'] = r.ruling
  }
  rulings_by_id.get(id)?.push(ruling);
});

console.log('Writing rulings to disk...')
const rulingsDir = resolve(__dirname, '..', 'v2', 'rulings');
rulings_by_id.forEach((rulings, id) => {
  const filename = resolve(rulingsDir, `${id}.json`);
  rulings = rulings.sort((a, b) => a.date_update.localeCompare(b.date_update) || a.nsg_rules_team_verified > b.nsg_rules_team_verified);
  fs.writeFile(filename, JSON.stringify(rulings), err => {
    if (err) {
      console.error(`Error writing ${rulings.length} rulings for ${id} to ${filename}: ${err}`);
    }
  });
});
