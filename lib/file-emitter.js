'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');



/**
 * file-emitter
 *
 * **opt_options**
 *  - {number} parallel
 *  - {boolean} followSymLinks
 *
 * @param {string} folder
 * @param {?Object} opt_options
 *
 * @constructor
 */
function FileEmitter(folder, opt_options) {
  if (!(this instanceof FileEmitter)) {
    return new FileEmitter(folder, opt_options);
  }
  events.EventEmitter.call(this);
  opt_options = opt_options || {};

  this.folder = path.resolve(process.cwd(), folder);

  this.parallel = opt_options.parallel || 1;
  this.followSymLinks = opt_options.followSymLinks || false;

  this._readdirQueue = ['./'];
  this._statQueue = [];
  this._readQueue = [];

  this._hadError = false;

  var self = this;

  if (opt_options.autorun !== false) {
    setImmediate(function() {
      self.run();
    });
  }
}
util.inherits(FileEmitter, events.EventEmitter);
module.exports = FileEmitter;


FileEmitter.prototype._return = function(action, item, opt_err) {

};


FileEmitter.prototype._readdir = function() {
  var self = this;
  var item;

  if (!this._readdirQueue.length) {
    return;
  }
  item = this._readdirQueue.shift();

  fs.readdir(item, function(err, files) {
    if (err) {
      return self._return('readdir', item, err);
    }

    self._return('readdir', item);
  });
};


FileEmitter.prototype._stat = function() {
  var self = this;
  var item;

  if (!this._statQueue.length) {
    return;
  }
  item = this._statQueue.shift();

  fs.lstat(item, function(err, stats) {
    if (err) {
      return self._return('stat', item, err);
    }

    if (stats.isSymbolicLink() && !self.followSymLinks) {
      return self._return('stat', item);
    }

    if (stats.isDirectory()) {
      self._readdirQueue.push(item);
    } else if (stats.isFile()) {
      self._readQueue.push(item);
    }

    self._return('stat', item);
  });
};


FileEmitter.prototype._read = function() {

};


FileEmitter.prototype.run = function() {

};
