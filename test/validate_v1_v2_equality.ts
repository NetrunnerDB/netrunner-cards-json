import { getCardsJson, getCardSetsV2Json, getCardsV2Json, getPacksJson, getPrintingsV2Json, textToId } from "../src/index";
import chai = require('chai');
const expect = chai.expect;

describe('Cards v1/v2 equality', () => {
  const v1Cards = getCardsJson();
  const v1CardsByTitle = new Map<string, any>();
  v1Cards.forEach(c => {
    v1CardsByTitle.set(c.title, c);
  });
  const v2CardsByTitle = new Map<string, any>();
  const v2Text = new Map<string, string>();
  const v2StrippedText = new Map<string, string>();
  const v2StrippedTitle = new Map<string, string>();
  const v2Cards = getCardsV2Json();
  v2Cards.forEach(c => {
    v2CardsByTitle.set(c.title, c);
    v2Text.set(c.title, c.text);
    v2StrippedText.set(c.title, c.stripped_text);
    v2StrippedTitle.set(c.title, c.stripped_title);
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

  function validatev1V2Equality(fieldName, v1Getter, v2Getter) {
    v1CardsByTitle.forEach((c, title) => {
        expect(v1Getter(title), `${fieldName} mismatch for ${title}`).to.equal(v2Getter(title));
    });
  }

  it('text matches', () => {
    validatev1V2Equality('text',
        function(title) { return v1CardsByTitle.get(title).text; }, 
        function(title) { return v2CardsByTitle.get(title).text; }); 
  });

  it('stripped_text matches', () => {
    validatev1V2Equality('stripped_text',
        function(title) { return v1CardsByTitle.get(title).stripped_text; }, 
        function(title) { return v2CardsByTitle.get(title).stripped_text; }); 
  });

  it('stripped_title matches', () => {
    validatev1V2Equality('stripped_title',
        function(title) { return v1CardsByTitle.get(title).stripped_title; }, 
        function(title) { return v2CardsByTitle.get(title).stripped_title; }); 
  });

  it('advancement_requirement matches', () => {
    validatev1V2Equality('advancement_requirement',
        function(title) { return v1CardsByTitle.get(title).advancement_cost; }, 
        function(title) { return v2CardsByTitle.get(title).advancement_requirement; }); 
  });

  it('agenda_points matches', () => {
    validatev1V2Equality('agenda_points',
        function(title) { return v1CardsByTitle.get(title).agenda_points; }, 
        function(title) { return v2CardsByTitle.get(title).agenda_points; }); 
  });

  it('base_link matches', () => {
    validatev1V2Equality('base_link',
        function(title) { return v1CardsByTitle.get(title).base_link; }, 
        function(title) { return v2CardsByTitle.get(title).base_link; }); 
  });

  it('cost matches', () => {
    validatev1V2Equality('cost',
        function(title) { return v1CardsByTitle.get(title).cost; }, 
        function(title) { return v2CardsByTitle.get(title).cost; }); 
  });

  it('deck_limit matches', () => {
    validatev1V2Equality('deck_limit',
        function(title) { return v1CardsByTitle.get(title).deck_limit; }, 
        function(title) { return v2CardsByTitle.get(title).deck_limit; }); 
  });

  it('faction_id matches', () => {
    validatev1V2Equality('faction_id',
        function(title) { return v1CardsByTitle.get(title).faction_code; }, 
        function(title) { return v2CardsByTitle.get(title).faction_id; }); 
  });

  it('influence_cost matches', () => {
    validatev1V2Equality('influence_cost',
        function(title) { return v1CardsByTitle.get(title).faction_cost; }, 
        function(title) { return v2CardsByTitle.get(title).influence_cost; }); 
  });

  it('influence_limit matches', () => {
    validatev1V2Equality('influence_limit',
        function(title) { return v1CardsByTitle.get(title).influence_limit; }, 
        function(title) { return v2CardsByTitle.get(title).influence_limit; }); 
  });

  it('memory_cost matches', () => {
    validatev1V2Equality('memory_cost',
        function(title) { return v1CardsByTitle.get(title).memory_cost; }, 
        function(title) { return v2CardsByTitle.get(title).memory_cost; }); 
  });

  it('minimum_deck_size matches', () => {
    validatev1V2Equality('minimum_deck_size',
        function(title) { return v1CardsByTitle.get(title).minimum_deck_size; }, 
        function(title) { return v2CardsByTitle.get(title).minimum_deck_size; }); 
  });

  it('side_id matches', () => {
    validatev1V2Equality('side_id',
        function(title) { return v1CardsByTitle.get(title).side_code; }, 
        function(title) { return v2CardsByTitle.get(title).side_id; }); 
  });

  it('strength matches', () => {
    validatev1V2Equality('strength',
        function(title) { return v1CardsByTitle.get(title).strength; }, 
        function(title) { return v2CardsByTitle.get(title).strength; }); 
  });

  it('trash_cost matches', () => {
    validatev1V2Equality('trash_cost',
        function(title) { return v1CardsByTitle.get(title).trash_cost; }, 
        function(title) { return v2CardsByTitle.get(title).trash_cost; }); 
  });

  it('is_unique matches', () => {
    validatev1V2Equality('trash_cost',
        function(title) { return v1CardsByTitle.get(title).uniqueness; }, 
        function(title) { return v2CardsByTitle.get(title).is_unique; }); 
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

  function validatev1V2Equality(fieldName, v1Getter, v2Getter) {
    v1CardsByCode.forEach((c, code) => {
        expect(v1Getter(code), `${fieldName} mismatch for ${code}`).to.equal(v2Getter(code));
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
/*
pack_code	card_set_id
*/
  it('card set matches pack names.', () => {
    v1CardsByCode.forEach((v1, code) => {
      expect(packsByCode.get(v1.pack_code), `Card set mismatch for printing id ${code} for ${v1CardsByCode.get(code).title}`).to.equal(setsById.get(printingsById.get(code).card_set_id));
    });
  });

  it('flavor matches', () => {
    validatev1V2Equality('flavor',
        function(code) { return v1CardsByCode.get(code).flavor; }, 
        function(code) { return printingsById.get(code).flavor; }); 
  });

  it('illustrator matches', () => {
    validatev1V2Equality('illustrator',
        function(code) { return v1CardsByCode.get(code).illustrator; }, 
        function(code) { return printingsById.get(code).illustrator; }); 
  });

  it('position matches', () => {
    validatev1V2Equality('position',
        function(code) { return v1CardsByCode.get(code).position; }, 
        function(code) { return printingsById.get(code).position; }); 
  });

  it('printed_is_unique matches', () => {
    validatev1V2Equality('printed_is_unique',
        function(code) { return v1CardsByCode.get(code).uniqueness; }, 
        function(code) { return printingsById.get(code).printed_is_unique; }); 
  });

  it('printed_text matches', () => {
    validatev1V2Equality('printed_text',
        function(code) { return v1CardsByCode.get(code).text; }, 
        function(code) { return printingsById.get(code).printed_text; }); 
  });

  it('quantity matches', () => {
    validatev1V2Equality('quantity',
        function(code) { return v1CardsByCode.get(code).quantity; }, 
        function(code) { return printingsById.get(code).quantity; }); 
  });

  it('stripped_printed_text matches', () => {
    validatev1V2Equality('stripped_printed_text',
        function(code) { return v1CardsByCode.get(code).stripped_text; }, 
        function(code) { return printingsById.get(code).stripped_printed_text; }); 
  });
});
