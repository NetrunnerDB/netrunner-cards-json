import {
  readFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";
import { pick, union, keyBy, sortBy } from "lodash";

const [bin, script, locale] = process.argv;

const i18nDir = resolve(".", "translations");
const things = ["cycles", "factions", "packs", "types", "sides"];

function stripProps(json: Record<string, any>[], props: string[]) {
  return json.map((item) => pick(item, props));
}

function loadThings(root: string, code?: string) {
  const result: Record<string, any> = {};
  for (const thing of things) {
    const locale = code ? `.${code}` : "";
    const file = `${thing}${locale}.json`;
    const filepath = join(root, file);
    console.log(filepath);
    try {
      const json = JSON.parse(readFileSync(filepath, "utf-8"));
      result[file] = stripProps(json, ["code", "name"]);
    } catch (e) {
      // no-op
    }
  }
  return result;
}

function loadCards(root: string) {
  const result: Record<string, any> = {};
  const localeRoot = join(root, "pack");
  try {
    mkdirSync(localeRoot);
  } catch (e) {
    // no-op
  }
  const files = readdirSync(localeRoot);
  for (const file of files) {
    const filepath = join(localeRoot, file);
    const json = JSON.parse(readFileSync(filepath, "utf-8"));
    result[file] = stripProps(json, [
      "code",
      "flavor",
      "keywords",
      "text",
      "title",
    ]);
  }
  return result;
}

function mergeData(
  defaultLocale: Record<string, any>,
  locale: Record<string, any>,
  code: string
) {
  const result: Record<string, any> = {};
  for (const file of union(Object.keys(defaultLocale), Object.keys(locale))) {
    const targetFile = file.replace(/^(\w+).json$/, `$1.${code}.json`);
    const newFile = {
      ...keyBy(defaultLocale[file] || {}, "code"),
      ...keyBy(locale[file] || {}, "code"),
    };
    result[targetFile] = sortBy(Object.values(newFile), "code");
  }
  return result;
}

const thingsEn = loadThings(".");
const cardsEn = loadCards(".");

const codes = readdirSync(i18nDir);
for (const code of codes) {
  if (locale && !locale.includes(code)) {
    break;
  }

  console.log(`Updating locale ${code}`);
  const localeRoot = join(i18nDir, code);

  const localeThings = loadThings(localeRoot, code);
  const localeCards = loadCards(localeRoot);

  const mergedThings = mergeData(thingsEn, localeThings, code);
  const mergedCards = mergeData(cardsEn, localeCards, code);

  for (const file of Object.keys(mergedThings)) {
    const target = join(localeRoot, file);
    writeFileSync(target, JSON.stringify(mergedThings[file], null, 4) + "\n");
    console.log(`Written ${target}`);
  }

  for (const file of Object.keys(mergedCards)) {
    const target = join(localeRoot, "pack", file);
    writeFileSync(target, JSON.stringify(mergedCards[file], null, 4) + "\n");
    console.log(`Written ${target}`);
  }
}
