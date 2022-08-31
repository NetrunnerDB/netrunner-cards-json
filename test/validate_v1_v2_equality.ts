import { getCardsJson, getCardCyclesV2Json, getCardSetsV2Json, getCardsV2Json, getCyclesJson, getPacksJson, getPrintingsV2Json, textToId } from "../src/index";
import { expect } from "chai";

describe('Card Cycles v1/v2', () => {
  // id in v2 is the textToId'd version of the set name, not the same as the NRDB classic code.
  const cyclesByCode = new Map<string, string>();
  getCyclesJson().forEach(c => {
    cyclesByCode.set(c.code, c.name);
  });
  const cardCyclesByLegacyCode = new Map<string, string>();
  getCardCyclesV2Json().forEach(s => {
    cardCyclesByLegacyCode.set(s.legacy_code, s.name);
  });

  it('has correct number of cardCycles', () => {
    expect(cardCyclesByLegacyCode.size).to.equal(cyclesByCode.size); 
  });

  it('has matching card cycle attributes', () => {
    cardCyclesByLegacyCode.forEach((name, legacyCode) => {
      expect(cyclesByCode.has(legacyCode), `legacy_code ${legacyCode} exists in packsByCode map`).to.be.true;
      expect(name, `name mismatch for card set ${name} with legacy_code ${legacyCode}`).to.equal(cyclesByCode.get(legacyCode));
    });
  });
});

describe('Card Sets v1/v2', () => {
  const cardCycleIdToLegacyCode = new Map<string, string>();
  getCardCyclesV2Json().forEach(s => {
    cardCycleIdToLegacyCode.set(s.id, s.legacy_code);
  });

  // card_set_id in v2 is the textToId'd version of the set name, not the same as the NRDB classic code.
  const packsByCode = new Map<string, any>();
  getPacksJson().forEach(p => {
    packsByCode.set(p.code, p);
  });
  const cardSetsById = new Map<string, string>();
  const cardSetsByCode = new Map<string, any>();
  getCardSetsV2Json().forEach(s => {
    cardSetsById.set(s.id, s.name);
    cardSetsByCode.set(s.legacy_code, s);
  });

  it('correct number of card cardCycles', () => {
    expect(cardSetsByCode.size).to.equal(packsByCode.size); 
  });

  it('card set attributes match', () => {
    cardSetsByCode.forEach((cardSet, legacyCode) => {
      expect(cardCycleIdToLegacyCode.get(cardSet.card_cycle_id), `card set ${cardSet.name} has matching cycle id`).to.equal(packsByCode.get(legacyCode).cycle_code);
      expect(packsByCode.has(legacyCode), `legacy_code ${legacyCode} exists in packsByCode map`).to.be.true;
      if (legacyCode != 'draft') {
        // v1 does not have a release date or size set for draft.
        expect(cardSet.date_release, `date_release mismatch for card set ${cardSet.name} with legacy_code ${legacyCode}`).to.equal(packsByCode.get(legacyCode).date_release);
        expect(cardSet.size, `size mismatch for card set ${cardSet.name} with legacy_code ${legacyCode}`).to.equal(packsByCode.get(legacyCode).size);
      }
      expect(cardSet.name, `name mismatch for card set ${cardSet.name} with legacy_code ${legacyCode}`).to.equal(packsByCode.get(legacyCode).name);
      expect(cardSet.position, `position mismatch for card set ${cardSet.name} with legacy_code ${legacyCode}`).to.equal(packsByCode.get(legacyCode).position);
    });
  });
});

describe('Cards v1/v2 equality', () => {
  const v1CardsByTitle = new Map<string, any>();
  getCardsJson().forEach(c => {
    v1CardsByTitle.set(c.title, c);
  });
  const v2CardsByTitle = new Map<string, any>();
  getCardsV2Json().forEach(c => {
    v2CardsByTitle.set(c.title, c);
  });

  it('correct number of cards', () => {
    expect(v1CardsByTitle.size).to.equal(v2CardsByTitle.size);
  });

  // v2 card_type_id has {corp,runner}_identity instead of just identity.
  it('card_type_id matches', () => {
    v1CardsByTitle.forEach((c, title) => {
      expect(v1CardsByTitle.get(title).type_code, `card_type_id mismatch for ${title}`)
          .to.equal(v2CardsByTitle.get(title).card_type_id.replace(v2CardsByTitle.get(title).side_id + '_', ''));
    });
  });

  // v2 subtypes is a lower case list of card_subtype_ids, not the display version of subtypes.
  it('subtypes match', () => {
    v1CardsByTitle.forEach((c, title) => {
      const v1 = v1CardsByTitle.get(title);
      const v2 = v2CardsByTitle.get(title);
      const v1Keywords = v1.keywords ? v1.keywords.split(' - ').map(x => textToId(x)) : [];
      const v2Subtypes = v2.subtypes ? v2.subtypes : [];
      expect(v1Keywords, `subtypes mismatch for ${title}`).to.deep.equal(v2Subtypes);
    });
  });

  function validate(v1Field: string, maybeV2Field?: string) {
    const v2Field = maybeV2Field == undefined ? v1Field : maybeV2Field;
    v1CardsByTitle.forEach((c, title) => {
      expect(v1CardsByTitle.get(title)[v1Field], `${v2Field} mismatch for ${title}`).to.equal(v2CardsByTitle.get(title)[v2Field]);
    });
  }

  it('text matches', () => {
    validate('text');
  });

  it('stripped_text matches', () => {
    validate('stripped_text');
  });

  it('stripped_title matches', () => {
    validate('stripped_title');
  });

  it('advancement_requirement matches', () => {
    validate('advancement_requirement', 'advancement_cost');
  });

  it('agenda_points matches', () => {
    validate('agenda_points');
  });

  it('base_link matches', () => {
    validate('base_link');
  });

  it('cost matches', () => {
    validate('cost');
  });

  it('deck_limit matches', () => {
    validate('deck_limit');
  });

  it('faction_id matches', () => {
    // We have standardized on underscore separators for v2, but are leaving v1 with dashes.
    v1CardsByTitle.forEach((c, title) => {
      expect(v1CardsByTitle.get(title).faction_code, `faction_id mismatch for ${title}`).to.equal(v2CardsByTitle.get(title).faction_id.replace('_', '-'));
    });

  });

  it('influence_cost matches', () => {
    validate('faction_cost', 'influence_cost');
  });

  it('influence_limit matches', () => {
    validate('influence_limit');
  });

  it('memory_cost matches', () => {
    validate('memory_cost');
  });

  it('minimum_deck_size matches', () => {
    validate('minimum_deck_size');
  });

  it('side_id matches', () => {
    validate('side_code', 'side_id');
  });

  it('strength matches', () => {
    validate('strength');
  });

  it('trash_cost matches', () => {
    validate('trash_cost');
  });

  it('is_unique matches', () => {
    validate('uniqueness', 'is_unique');
  });
});

describe('Printings v1/v2 equality', () => {
  const v1Cards = getCardsJson();
  const v1CardsByCode = new Map<string, any>();
  v1Cards.forEach(c => {
    v1CardsByCode.set(c.code, c);
  });
  const printings = getPrintingsV2Json();
  const printingsById = new Map<string, any>();
  printings.forEach(p => {
    printingsById.set(p.id, p);
  });

  it('correct number of printings', () => {
    v1CardsByCode.forEach((v, k) => {
      expect(printingsById.has(k), `v1 code ${k} exists in printings id map`).to.be.true;
    });
    printingsById.forEach((v, k) => {
      expect(v1CardsByCode.has(k), `printing code ${k} exists in v1 map`).to.be.true;
    });
  });

  function validate(v1Field: string, maybeV2Field?: string) {
    const v2Field = maybeV2Field == undefined ? v1Field : maybeV2Field;
    v1CardsByCode.forEach((c, code) => {
      expect(c[v1Field], `${v2Field} mismatch for ${code}`).to.equal(printingsById.get(code)[v2Field]);
    });
  }

  // card_set_id in v2 is the textToId'd version of the set name, not a code.
  // Validate the ids for cardCycles via the retrieved set, not the name directly.
  const packs = getPacksJson();
  const packsByCode = new Map<string, string>();
  packs.forEach(p => {
    packsByCode.set(p.code, p.name);
  });
  const cardCycles = getCardSetsV2Json();
  const cardCyclesById = new Map<string, string>();
  cardCycles.forEach(s => {
    cardCyclesById.set(s.id, s.name);
  });

  it('card set matches pack names.', () => {
    v1CardsByCode.forEach((v1, code) => {
      expect(packsByCode.get(v1.pack_code),
          `Card set mismatch for printing id ${code} for ${v1CardsByCode.get(code).title}`)
        .to.equal(cardCyclesById.get(printingsById.get(code).card_set_id));
    });
  });

  it('flavor matches', () => {
    validate('flavor');
  });

  it('illustrator matches', () => {
    validate('illustrator');
  });

  it('position matches', () => {
    validate('position');
  });

  it('printed_is_unique matches', () => {
    validate('uniqueness', 'printed_is_unique');
  });

  it('printed_text matches', () => {
    validate('text', 'printed_text');
  });

  it('quantity matches', () => {
    validate('quantity');
  });

  it('stripped_printed_text matches', () => {
    validate('stripped_text', 'stripped_printed_text');
  });
});