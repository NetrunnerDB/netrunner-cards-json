const fs = require('fs');
const path = require('path');

module.exports = function() {
  function makeReader(json, filename) {
    return function() {
      if (json == null) {
        console.log('Reading ' + filename + ' ...');
        json = JSON.parse(fs.readFileSync(__dirname+'/' + filename));
      }
      return json;
    }
  }

  var CYCLES_JSON = null;
  this.CyclesJSON = makeReader(CYCLES_JSON, 'cycles.json');
  var PACKS_JSON = null;
  this.PacksJSON = makeReader(PACKS_JSON, 'packs.json');
  var FACTIONS_JSON = null;
  this.FactionsJSON = makeReader(FACTIONS_JSON, 'factions.json');
  var MWL_JSON = null;
  this.MwlJSON = makeReader(MWL_JSON, 'mwl.json');
  var ROTATIONS_JSON = null;
  this.RotationsJSON = makeReader(ROTATIONS_JSON, 'rotations.json');
  var SIDES_JSON = null;
  this.SidesJSON = makeReader(SIDES_JSON, 'sides.json');

  CARDS_JSON = null;
  this.CardsJSON = function() {
    if (CARDS_JSON == null) {
      CARDS_JSON = new Array();

      let directory = __dirname+'/pack/';
      fs.readdirSync(directory).forEach(file => {
      	if (file.endsWith('.json')) { 
          let json = JSON.parse(fs.readFileSync(directory + file));
          json.forEach(c => CARDS_JSON.push(c));
        }
      });
	}
    return CARDS_JSON;
  }
}
