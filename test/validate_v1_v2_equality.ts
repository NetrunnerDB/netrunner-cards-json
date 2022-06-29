import { getCardsJson, getCardSetsV2Json, getCardsV2Json, getPacksJson, getPrintingsV2Json, textToId } from "../src/index";
import chai = require('chai');
const expect = chai.expect;

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

  function validatev1V2Equality(fieldName, v1Field, v2Field) {
    v1CardsByTitle.forEach((c, title) => {
      expect(v1CardsByTitle.get(title)[v1Field], `${v2Field} mismatch for ${title}`).to.equal(v2CardsByTitle.get(title)[v2Field]);
    });
  }

  it('text matches', () => {
    validatev1V2Equality('text', 'text', 'text');
  });

  it('stripped_text matches', () => {
    validatev1V2Equality('stripped_text', 'stripped_text', 'stripped_text');
  });

  it('stripped_title matches', () => {
    validatev1V2Equality('stripped_title', 'stripped_title', 'stripped_title');
  });

  it('advancement_requirement matches', () => {
    validatev1V2Equality('advancement_cost', 'advancement_requirement', 'advancement_cost');
  });

  it('agenda_points matches', () => {
    validatev1V2Equality('agenda_points', 'agenda_points', 'agenda_points');
  });

  it('base_link matches', () => {
    validatev1V2Equality('base_link', 'base_link', 'base_link');
  });

  it('cost matches', () => {
    validatev1V2Equality('cost', 'cost', 'cost');
  });

  it('deck_limit matches', () => {
    validatev1V2Equality('deck_limit', 'deck_limit', 'deck_limit');
  });

  it('faction_id matches', () => {
    validatev1V2Equality('faction_id', 'faction_code', 'faction_id');
  });

  it('influence_cost matches', () => {
    validatev1V2Equality('influence_cost', 'faction_cost', 'influence_cost');
  });

  it('influence_limit matches', () => {
    validatev1V2Equality('influence_limit', 'influence_limit', 'influence_limit');
  });

  it('memory_cost matches', () => {
    validatev1V2Equality('memory_cost', 'memory_cost', 'memory_cost');
  });

  it('minimum_deck_size matches', () => {
    validatev1V2Equality('minimum_deck_size', 'minimum_deck_size', 'minimum_deck_size');
  });

  it('side_id matches', () => {
    validatev1V2Equality('side_id', 'side_code', 'side_id');
  });

  it('strength matches', () => {
    validatev1V2Equality('strength', 'strength', 'strength');
  });

  it('trash_cost matches', () => {
    validatev1V2Equality('trash_cost', 'trash_cost', 'trash_cost');
  });

  it('is_unique matches', () => {
    validatev1V2Equality('is_unique', 'uniqueness', 'is_unique');
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

  function validatev1V2Equality(fieldName, v1Field, v2Field) {
    v1CardsByCode.forEach((c, id) => {
        expect(c[v1Field], `${v2Field} mismatch for ${id}`).to.equal(printingsById.get(id)[v2Field]);
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
    validatev1V2Equality('flavor', 'flavor', 'flavor');
  });

  it('illustrator matches', () => {
    validatev1V2Equality('illustrator', 'illustrator', 'illustrator');
  });

  it('position matches', () => {
    validatev1V2Equality('position', 'position', 'position');
  });

  it('printed_is_unique matches', () => {
    validatev1V2Equality('printed_is_unique', 'uniqueness', 'printed_is_unique');
  });

  it('printed_text matches', () => {
    validatev1V2Equality('printed_text', 'text', 'printed_text');
  });

  it('quantity matches', () => {
    validatev1V2Equality('quantity', 'quantity', 'quantity');
  });

  it('stripped_printed_text matches', () => {
    validatev1V2Equality('stripped_printed_text', 'stripped_text', 'stripped_printed_text');
  });
});
