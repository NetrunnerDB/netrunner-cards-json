import {
  getCardsJson,
  getCardCyclesV2Json,
  getCardSetsV2Json,
  getCardsV2Json,
  getRestrictionsV2Json,
  getCyclesJson,
  getPacksJson,
  getPrintingsV2Json,
  getMwlJson,
  textToId
} from "../src/index";
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
  const cardSetsByCode = new Map<string, any>();
  getCardSetsV2Json().forEach(s => {
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
  const v2CardsByTitle = new Map<string, any>();
  getCardsV2Json().forEach(c => {
    v2CardsByTitle.set(c.title, c);
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
  // Validate the ids for sets via the retrieved set, not the name directly.
  const packs = getPacksJson();
  const packsByCode = new Map<string, string>();
  packs.forEach(p => {
    packsByCode.set(p.code, p.name);
  });
  const sets = getCardSetsV2Json();
  const setsById = new Map<string, string>();
  sets.forEach(s => {
    setsById.set(s.id, s.name);
  });

  it('card set matches pack names.', () => {
    v1CardsByCode.forEach((v1, code) => {
      expect(packsByCode.get(v1.pack_code),
          `Card set mismatch for printing id ${code} for ${v1CardsByCode.get(code).title}`)
        .to.equal(setsById.get(printingsById.get(code).card_set_id));
    });
  });

  it('flavor matches', () => {
    // v1 flavor text includes design attributions, but in v2 that has been separated into the card attribution property.
    v1Cards.forEach(v1 => {
      const v2Printing = printingsById.get(v1.code);
      const v2Card = v2CardsByTitle.get(v1.title)
      if ('attribution' in v2Card) {
        expect(v1.flavor, `flavor mismatch for ${v1.title}`).to.equal(`${v2Printing.flavor ? v2Printing.flavor + '\n' : ''}<strong>${v2Card.attribution}</strong>`);
      } else {
        expect(v1.flavor, `flavor mismatch for ${v1.title}`).to.equal(v2Printing.flavor);
      }
    });
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

describe('MWLs v1/v2', () => {
  const standardRestrictions = getRestrictionsV2Json()['standard'];
  const mwls = getMwlJson();
  const pairs = mwls.map(mwl => [mwl, standardRestrictions.find(r => r.name == mwl.name)]);

  const printings = getPrintingsV2Json();
  const printingsById = new Map<string, any>();
  printings.forEach(p => {
    printingsById.set(p.id, p);
  });
  const printingsByCardId = new Map<string, any>();
  getCardsV2Json ().forEach(c => {
    printingsByCardId.set(c.id, []);
  });
  printings.forEach(p => {
    printingsByCardId.get(p.card_id).push(p);
  });

  // Turns a v1 mwl json entry into an array of printing codes of its banned cards
  function v1ToBanned(mwl) {
    const arr: [string, Record<string, number>][] = Object.entries(mwl.cards);
    return arr.filter(card => card[1].deck_limit == 0)
              .map(card => card[0]).sort();
  }
  // Turns a v1 mwl json entry into an array of printing codes of its restricted cards
  function v1ToRestricted(mwl) {
    const arr: [string, Record<string, number>][] = Object.entries(mwl.cards);
    return arr.filter(card => card[1].is_restricted)
              .map(card => card[0]).sort();
  }
  // Turns a v1 mwl json entry into an object mapping universal faction costs to the array of printing codes of affected cards
  function v1ToUniversalFactionCost(mwl) {
    const arr: [string, Record<string, number>][] = Object.entries(mwl.cards);
    const obj = {};
    arr.filter(card => card[1].universal_faction_cost).sort().forEach(function(card) {
      if (!obj[card[1].universal_faction_cost]) {
        obj[card[1].universal_faction_cost] = [];
      }
      obj[card[1].universal_faction_cost].push(card[0]);
    });
    return obj;
  }
  // Turns a v1 mwl json entry into an object mapping global penalties to the array of printing codes of affected cards
  function v1ToGlobalPenalty(mwl) {
    const arr: [string, Record<string, number>][] = Object.entries(mwl.cards);
    const obj = {};
    arr.filter(card => card[1].global_penalty).sort().forEach(function(card) {
      if (!obj[card[1].global_penalty]) {
        obj[card[1].global_penalty] = [];
      }
      obj[card[1].global_penalty].push(card[0]);
    });
    return obj;
  }

  // Converts an array of cards into an array of all printing IDs of those cards
  function cardsToPrintings(cards) {
    if (!cards) {
      return []; // Catches the null case to deal with missing fields in the api
    }
    return cards.map(card => printingsByCardId.get(card).map(printing => printing.id)).flat();
  }

  it('has correct number of standard lists', () => {
    expect(mwls).to.have.lengthOf(standardRestrictions.length);
  });

  it('has matching names', () => {
    expect(mwls.map(m => m.name)).to.have.members(standardRestrictions.map(r => r.name));
  });

  it('has matching banned cards', () => {
    pairs.forEach(([mwl, restriction]) => {
      expect(v1ToBanned(mwl), `${mwl.name}'s banned cards in v1 do not match v2`).to.have.members(cardsToPrintings(restriction.banned).sort());
    });
  });

  it('has matching restricted cards', () => {
    pairs.forEach(([mwl, restriction]) => {
      expect(v1ToRestricted(mwl), `${mwl.name}'s restricted cards in v1 do not match v2`).to.have.members(cardsToPrintings(restriction.restricted).sort());
    });
  });

  it('has matching universal faction costs', () => {
    pairs.forEach(([mwl, restriction]) => {
      const mwlCosts = v1ToUniversalFactionCost(mwl);
      const resCosts = {};
      if (restriction.universal_faction_cost) {
        Object.keys(restriction.universal_faction_cost).forEach(cost => {
          resCosts[cost] = cardsToPrintings(restriction.universal_faction_cost[cost]).sort();
        });
      }
      expect(mwlCosts, `${mwl.name}'s universal faction costs in v1 do not match v2`).to.deep.equal(resCosts);
    });
  });

  it('has matching global penalties', () => {
    pairs.forEach(([mwl, restriction]) => {
      const mwlCosts = v1ToGlobalPenalty(mwl);
      const resCosts = {};
      if (restriction.global_penalty) {
        Object.keys(restriction.global_penalty).forEach(cost => {
          resCosts[cost] = cardsToPrintings(restriction.global_penalty[cost]).sort();
        });
      }
      expect(mwlCosts, `${mwl.name}'s global penalties in v1 do not match v2`).to.deep.equal(resCosts);
    });
  });
});
