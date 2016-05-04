Netrunner cards JSON data [![Build status](https://circleci.com/gh/zaroth/netrunner-cards-json.svg?style=shield)](https://circleci.com/gh/zaroth/netrunner-cards-json)
=========

### Validating and formatting JSON

Using python >=2.6, type in command line:

```
./validate.py --verbose --fix_formatting
```

Or just try to follow the style existing files (formatted by the above command) use when editing entries.

### JSON text editing tips

#### Non-ASCII symbols

When symbols outside the regular [ASCII range](https://en.wikipedia.org/wiki/ASCII#ASCII_printable_code_chart) are needed, UTF-8 symbols come in play. These need to be escaped using `\u<4 letter hexcode>`, such as `\u0101` (ā from _Pālanā Foods_).

To get the 4-letter hexcode of a UTF-8 symbol (or look up what a particular hexcode represents), you can use a UTF-8 converter, such as [this online tool](http://www.ltg.ed.ac.uk/~richard/utf-8.cgi).

#### Breaking text into multiple lines and quotes

To have text spanning multiple lines, use `\n` to separate them. To have quotes as part of the text, use `\"`.  For example, `"flavor": "\"I'm overpowered.\"\n-Whizzard"` results in following flavor text:

> _"I'm overpowered."_  
> _-Whizzard_

#### Netrunner symbols

These can be used in a card's `text` section.

* `[Click]`
* `[Credits]`
* `[Link]`
* `[Memory Unit]`
* `[Recurring Credits]`
* `[Subroutine]`
* `[Trash]`
* `[anarch]`
* `[criminal]`
* `[shaper]`
* `[jinteki]`
* `[haas-bioroid]`
* `[nbn]`
* `[weyland-consortium]`
