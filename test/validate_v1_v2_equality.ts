import { getCardsJson, getCardsV2Json } from "../src/index";
import { expect } from "chai";

describe('card text matches between versions', () => {
  const v1Cards = getCardsJson();
  const v1Text = new Map<string, string>();
  const v1StrippedText = new Map<string, string>();
  v1Cards.forEach(c => {
    v1Text.set(c.title, c.text);
    v1StrippedText.set(c.title, c.stripped_text);
  });
  const v2Text = new Map<string, string>();
  const v2StrippedText = new Map<string, string>();
  const v2Cards = getCardsV2Json();
  v2Cards.forEach(c => {
    v2Text.set(c.title, c.text);
    v2StrippedText.set(c.title, c.stripped_text);
  });

  it('text matches', () => {
    expect(v1Text.size, '# of cards matches between versions').to.equal(v2Text.size);
    v1Text.forEach((text, title) => {
        expect(text, `Text mismatch for ${title}`).to.equal(v2Text.get(title));
    });
    expect(v1StrippedText.size, '# of cards matches between versions').to.equal(v2StrippedText.size);
  });

  it('stripped_text matches', () => {
    expect(v1StrippedText.size, '# of cards matches between versions').to.equal(v2StrippedText.size);
    v1StrippedText.forEach((stripped_text, title) => {
        expect(stripped_text, `Stripped text mismatch for ${title}`).to.equal(v2StrippedText.get(title));
    });
  });

});
