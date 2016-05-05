#!/usr/bin/env python

import argparse
import json
import jsonschema
import os
import sys

SET_DIR="set"
SCHEMA_DIR="schema"
formatting_errors = 0
validation_errors = 0

def check_dir_access(path):
    if not os.path.isdir(path):
        sys.exit("%s is not a valid path" % path)
    elif os.access(path, os.R_OK):
        return
    else:
        sys.exit("%s is not a readable directory")

def check_file_access(path):
    if not os.path.isfile(path):
        sys.exit("%s does not exist" % path)
    elif os.access(path, os.R_OK):
        return
    else:
        sys.exit("%s is not a readable file")

def check_json_schema(args, data, path):
    global validation_errors
    try:
        jsonschema.Draft4Validator.check_schema(data)
        return True
    except jsonschema.exceptions.SchemaError as e:
        verbose_print(args, "%s: Schema file is not valid Draft 4 JSON schema.\n" % path, 0)
        validation_errors += 1
        print(e)
        return False

def check_mwl(args):
    verbose_print(args, "Loading MWL...\n", 1)
    mwl_path = os.path.join(args.base_path, "mwl.json")
    load_json_file(args, mwl_path)

def custom_card_check(args, card, set_code):
    "Performs more in-depth sanity checks than jsonschema validator is capable of. Assumes that the basic schema validation has already completed successfully."
    if card["pack_code"] != set_code:
        raise jsonschema.ValidationError("Pack code '%s' of the card '%s' doesn't match the set code '%s' of the file it appears in." % (card["pack_code"], card["code"], set_code))

def format_json(json_data):
    formatted_data = json.dumps(json_data, sort_keys=True, indent=4, separators=(',', ': '))
    formatted_data += "\n"
    return formatted_data

def load_json_file(args, path):
    global formatting_errors
    global validation_errors
    try:
        with open(path, "rb") as data_file:
            raw_data = data_file.read()
        json_data = json.loads(raw_data)
    except ValueError as e:
        verbose_print(args, "%s: File is not valid JSON.\n" % path, 0)
        validation_errors += 1
        print(e)
        return None

    verbose_print(args, "%s: Checking JSON formatting...\n" % path, 1)
    formatted_raw_data = format_json(json_data)

    if formatted_raw_data != raw_data:
        verbose_print(args, "%s: File is not correctly formatted JSON.\n" % path, 0)
        formatting_errors += 1
        if args.fix_formatting and len(formatted_raw_data) > 0:
            verbose_print(args, "%s: Fixing JSON formatting...\n" % path, 0)
            try:
                with open(path, "wb") as json_file:
                    json_file.write(formatted_raw_data)
            except IOError as e:
                verbose_print(args, "%s: Cannot open file to write.\n" % path, 0)
                print(e)
    return json_data

def load_set_index(args):
    global formatting_errors
    global validation_errors


    verbose_print(args, "Loading set index file...\n", 1)
    sets_path = os.path.join(args.base_path, "sets.json")
    sets_data = load_json_file(args, sets_path)

    if not validate_sets(args, sets_data):
        return None

    for s in sets_data:
        set_filename = "{}.json".format(s["code"])
        set_path = os.path.join(args.set_path, set_filename)
        check_file_access(set_path)

    return sets_data

def parse_commandline():
    argparser = argparse.ArgumentParser(description="Validate JSON in the netrunner cards repository.")
    argparser.add_argument("-f", "--fix_formatting", default=False, action="store_true", help="write suggested formatting changes to files")
    argparser.add_argument("-v", "--verbose", default=0, action="count", help="verbose mode")
    argparser.add_argument("-b", "--base_path", default=os.getcwd(), help="root directory of JSON repo (default: current directory)")
    argparser.add_argument("-s", "--set_path", default=None, help=("set directory of JSON repo (default: BASE_PATH/%s/)" % SET_DIR))
    argparser.add_argument("-c", "--schema_path", default=None, help=("schema directory of JSON repo (default: BASE_PATH/%s/" % SCHEMA_DIR))
    args = argparser.parse_args()

    # Set all the necessary paths and check if they exist
    if getattr(args, "schema_path", None) is None:
        setattr(args, "schema_path", os.path.join(args.base_path,SCHEMA_DIR))
    if getattr(args, "set_path", None) is None:
        setattr(args, "set_path", os.path.join(args.base_path,SET_DIR))
    check_dir_access(args.base_path)
    check_dir_access(args.schema_path)
    check_dir_access(args.set_path)

    return args

def validate_card(args, card, card_schema, set_code):
    global validation_errors

    try:
        verbose_print(args, "Validating card %s... " % card["title"], 2)
        jsonschema.validate(card, card_schema)
        custom_card_check(args, card, set_code)
        verbose_print(args, "OK\n", 2)
    except jsonschema.ValidationError as e:
        verbose_print(args, "ERROR\n",2)
        verbose_print(args, "Validation error in card: (set code: '%s' card code: '%s' title: '%s')\n" % (set_code, card.get("code"), card.get("title")), 0)
        validation_errors += 1
        print(e)

def validate_cards(args, sets_data):
    global validation_errors

    card_schema_path = os.path.join(args.schema_path, "card_schema.json")

    CARD_SCHEMA = load_json_file(args,card_schema_path)
    if not CARD_SCHEMA:
        return
    if not check_json_schema(args, CARD_SCHEMA, card_schema_path):
        return

    for s in sets_data:
        verbose_print(args, "Validating cards from %s...\n" % s["name"], 1)

        set_path = os.path.join(args.set_path, "{}.json".format(s["code"]))
        set_data = load_json_file(args,set_path)
        if not set_data:
            continue

        for card in set_data:
            validate_card(args, card, CARD_SCHEMA, s["code"])

def validate_sets(args, sets_data):
    global validation_errors

    verbose_print(args, "Validating set index file...\n", 1)
    set_schema_path = os.path.join(args.schema_path, "set_schema.json")
    SET_SCHEMA = load_json_file(args, set_schema_path)
    if not isinstance(sets_data, list):
        verbose_print(args, "Insides of set index file are not a list!\n", 0)
        return False
    if not SET_SCHEMA:
        return False
    if not check_json_schema(args, SET_SCHEMA, set_schema_path):
        return False

    retval = True
    for s in sets_data:
        try:
            verbose_print(args, "Validating set %s... " % s.get("name"), 2)
            jsonschema.validate(s, SET_SCHEMA)
            verbose_print(args, "OK\n", 2)
        except jsonschema.ValidationError as e:
            verbose_print(args, "ERROR\n",2)
            verbose_print(args, "Validation error in set: (code: '%s' name: '%s')\n" % (s.get("code"), s.get("name")), 0)
            validation_errors += 1
            print(e)
            retval = False

    return retval


def verbose_print(args, text, minimum_verbosity=0):
    if args.verbose >= minimum_verbosity:
        sys.stdout.write(text)

def main():
    # Initialize global counters for encountered validation errors
    global formatting_errors
    global validation_errors
    formatting_errors = 0
    validation_errors = 0

    args = parse_commandline()

    sets = load_set_index(args)

    if sets:
        validate_cards(args, sets)
    else:
        verbose_print(args, "Couldn't open sets file correctly, skipping card validation...\n", 0)

    check_mwl(args)

    sys.stdout.write("Found %s formatting and %s validation errors\n" % (formatting_errors, validation_errors))
    if formatting_errors == 0 and validation_errors == 0:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
