Netrunner cards JSON data [![Build status](https://travis-ci.org/Alsciende/netrunner-cards-json.svg?branch=master)](https://travis-ci.org/Alsciende/netrunner-cards-json)
=========

The goal of this repository is to store [NetrunnerDB](http://netrunnerdb.com) card data in a format that can be easily updated by multiple people and their changes reviewed.

## Validating and formatting JSON

Using python >=2.6, type in command line:

```
./validate.py --verbose --fix_formatting
```

The above script requires python package `jsonschema` which can be installed using `pip` via `pip install -U jsonschema`.

You can also just try to follow the style existing files use when editing entries. They are all formatted and checked using the script above.

## Description of properties in schemas

Required properties are in **bold**.

#### Cycle schema

* **code** - identifier of the cycle. All lowercase and using dashes instead of spaces. Examples: `"core"`, `"sansan"`, `"order-and-chaos"`.
* **name** - properly formatted name of the cycle. Examples: `"Core Set"`, `"SanSan"`, `"Order and Chaos"`.
* **position** - number of the cycle, counting in chronological order. For packs released outside of normal constructed play cycles (such as draft packs), the special cycle with position `0` should be used. Examples: `1` for Core Set, `8` for SanSan Cycle.
* **size** - number of packs in the cycle. Examples: `1` for big boxes, `6` for regular datapack cycles.
* **rotated** - indicates if this cycle has been rotated out of the tournament-legal cardpool.

#### Pack schema

* **code** - identifier of the pack. All lowercase and using dashes instead of spaces. Examples: `"core"` for Core Set, `"val"` for The Valley, `"oac"` for Order and Chaos.
* **cycle_code** - identifier of the cycle the pack belongs to. Must refer to one of the values from cycles' `"code"`. Examples: `"core"` for Core Set, `"sansan"` for The Valley, `"order-and-chaos"` for Order and Chaos.
* **name** - properly formatted name of the pack. Examples: `"Core Set"`, `"The Valley"`, `"Order and Chaos"`.
* **position** - number of the pack within the cycle. Examples: `1` for Core Set, `1` for The Valley from SanSan Cycle, `5` for Old Hollywood from SanSan Cycle.
* **date_release** - date when the pack was officially released by FFG. When in doubt, look at the date of the pack release news on FFG's news page. Format of the date is YYYY-MM-DD. May be `null` - this value is used when the date is unknown. Examples: `"2012-09-06"` for Core Set, `"2016-04-28"` for Salsette Island, `null` for unreleased previewed packs.
* **size** - number of different cards in the pack. May be `null` - this value is used when the pack is just an organizational entity, not a physical pack.  Examples: `120` for Core Set, `55` for most deluxe expansions, `20` for most datapacks, `null` for assorted draft cards.
* **ffg_id** - FFG's internal "ADN" product number for this pack. May be `null`. Example: `49` for the Revised Core Set ("ADN49")

#### Card schema

* advancement_cost - number of advancement tokens required to score the card. Relevant for agendas. Examples: `5` for Priority Requisition, `3` for AstroScript Pilot Program, `2` for Domestic Sleepers.
* agenda_points - number of agenda points the card gives after scoring. Relevant for agendas. Examples: `3` for Priority Requisition, `2` for AstroScript Pilot Program, `0` for Domestic Sleepers.
* base_link - base link strength number of the card. Relevant for Runner identities. Examples: `0` for Noise, `2` for Sunny Lebeau.
* **code** - 5 digit unique card identifier. When assigning a code for a new card, build it from two zero-padded numbers: first two digits are the cycle position, last three are position of the card within the cycle (printed on the card). Once a code has been assigned, it cannot be changed, and some codes (notably from the Revised Core Set) do not adhere to this scheme. Therefore, you should always treat this as an opaque identifier.  
Examples: `"01048"` for Sacrificial Construct (48th card in cycle) from Core Set (1st cycle), `"10100"` for The Price of Freedom (100th card in cycle) from Mumbad (10th cycle).
* cost - Play/rez cost of the card. Relevant for all cards except identities and agendas. May be `null` - this value is used when the card has a special, possibly variable, cost. Examples: `5` for Hedge Fund, `3` for Desperado, `null` for Psychographics.
* **faction_code** - Faction this cards belongs to. Possible values: `"adam"`, `"anarch"`,
`"apex"`, `"criminal"`, `"shaper"`, `"sunny-lebeau"`, `"neutral-runner"`, `"haas-bioroid"`, `"jinteki"`, `"nbn"`, `"weyland-consortium"`, `"neutral-corp"` 
* faction_cost - Influence cost of this card. Relevant for all cards except identities. Examples: `0` for Sure Gamble, `5` for Escher. 
* flavor - Flavor text of the card. May be empty.
* illustrator - Illustrator's name.
* influence_limit - Maximum number of influence points. Relevant for identities.
* keywords - also known as 'Subtypes'. Examples: `"Code Gate - Deflector - Psi"` for Bullfrog, `"Security"` for False Lead. Multiple subtypes are separated by the string `" - "` (blank, minus, blank).
* **deck_limit** - Maximum number of copies allowed in a deck. Examples: `3` for Deep Red, `1` for Government Takeover, `6` for NetChip.
* memory_cost - MU usage of the card. Relevant for programs.
* minimum_deck_size - Minimum Deck size. Relevant for identities.
* **pack_code** - Code of the pack this card is in.
* **position** - Card number within the cycle (i.e. the number printed on the card). Example: `25` for `Kabonesa Wu` (25th card in the Kitara cycle).
* **quantity** - How many copies of this card are in the pack.
* **side_code** - Side the card belongs to. Possible values: `"corp"`, `"runner"`.
* strength - Relevant for programs and ICE. May be `null` - this value is used when the card has a special, possibly variable, strength. Examples: `1` for Ice Wall, `0` for Crypsis, `null` for Darwin.
* text - Text of the card.
* **title** - Name of the card.
* trash_cost - Trash cost of the card. Relevant for assets, upgrades, operations and ICE.
* **type_code** - Type of the card. Possible values: `"agenda"`, `"asset"`, `"event"`, `"hardware"`, `"ice"`, `"identity"`, `"operation"`, `"program"`, `"resource"`, `"upgrade"`.
* **uniqueness** - True if the card is unique (black diamond printed next to the title), false otherwise. Possible values: `true`, `false`.

#### Card Translation schema

* **code**
* flavor
* text
* **title**


## JSON text editing tips

Full description of (very simple) JSON format can be found [here](http://www.json.org/), below there are a few tips most relevant to editing this repository.

#### Non-ASCII symbols

When symbols outside the regular [ASCII range](https://en.wikipedia.org/wiki/ASCII#ASCII_printable_code_chart) are needed, UTF-8 symbols come in play. These can be escaped using `\u<4 letter hexcode>`, such as `\u0101` (ā from *Pālanā Foods*), but there is no obligation. UTF-8 characters can be present in the values.

To get the 4-letter hexcode of a UTF-8 symbol (or look up what a particular hexcode represents), you can use a UTF-8 converter, such as [this online tool](http://www.ltg.ed.ac.uk/~richard/utf-8.cgi).

#### Quotes and breaking text into multiple lines

To have text spanning multiple lines, use `\n` to separate them. To have quotes as part of the text, use `\"`.  For example, `"flavor": "\"I'm overpowered.\"\n-Whizzard"` results in the following flavor text:

> *"I'm overpowered."*  
> *-Whizzard*

#### Netrunner symbols

These can be used in a card's `text` section.

* `[click]`
* `[credit]`
* `[link]`
* `[mu]`
* `[recurring-credit]`
* `[subroutine]`
* `[trash]`
* `[anarch]`
* `[criminal]`
* `[shaper]`
* `[jinteki]`
* `[haas-bioroid]`
* `[nbn]`
* `[weyland-consortium]`


#### Custom Tags ####

The `text` and `flavor` properties of a card may use custom tags. These are:

* Card with errata use the `<errata>` tag, e.g. `<errata>Errata from FAQ 3.0.1</errata>` for Wireless Net Pavillion.
* Cards designed by World Champions use the `<champion>` tag (usually as the `flavor`), e.g. `<champion>Designed by 2012 World Champion Jeremy Zwirn</champion>` for Architect.
* Traces use the `<trace>` tag. For example, `<trace>Trace 2</trace> Do 1 net damage.` results in the following:
 
  > **Trace \[2\]**– Do 1 net damage. 

