'use strict';
var fs = require('fs');



/**
 * A file representation
 *
 * @param {FileEmitter} fe
 * @param {string} name
 * @param {fs.Stats} stats
 *
 * @constructor
 */
function File(fe, name, stats) {
  this._fe = fe;

  this.name = name;
  this.stats = stats;

  this.buffer = null;
}
module.exports = File;


File.prototype.createReadStream = function() {
  return fs.createReadStream(this._fe.root + this.name);
};


File.prototype.toJSON = function() {
  return {
    name: this.name,
    root: this._fe.root,
    stats: this.stats,
    buffer: this.buffer ? this.buffer.length : -1
  };
};
