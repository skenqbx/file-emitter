'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var minimatch = require('minimatch');



/**
 * file-emitter
 *
 * **opt_options**
 *  - {boolean} autorun ..., defaults to `true`
 *  - {RegExp} pattern Test files before reading, defaults to `false`
 *  - {Array<string>} ignore An array of glob patterns to ignore
 *  - {boolean} followSymLinks ..., default to `false`
 *  - {number} maxFDs The maximum number of open fds, defaults to `Infinity`
 *  - {number} maxFileSize The maximum size for files, defaults to `Infinity`
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

  this.root = path.resolve(process.cwd(), folder);
  this.followSymLinks = opt_options.followSymLinks || false;
  this.pattern = opt_options.pattern || false;
  this.ignore = opt_options.ignore || false;
  this.maxFileSize = opt_options.maxFileSize || Infinity;

  // @type {Array<string>}
  this._readdirQueue = [''];

  // @type {Array<string>}
  this._statQueue = [];

  // @type {Array<Object>}
  this._readQueue = [];

  this._hadError = false;

  this._maxFDs = opt_options.maxFDs || Infinity;
  this._numFDs = 0;

  var self = this;

  if (opt_options.autorun !== false) {
    setImmediate(function() {
      self.run();
    });
  }
}
util.inherits(FileEmitter, events.EventEmitter);
module.exports = FileEmitter;


FileEmitter.prototype.isIgnored = function(file) {
  var i;

  if (this.ignore) {
    file = file.substr(1); // cut off leading slash

    for (i = 0; i < this.ignore.length; ++i) {
      if (minimatch(file, this.ignore[i])) {
        return true;
      }
    }
  }

  return false;
};


/**
 * @param {string} action
 * @param {string|Object} item
 * @param {?Error=} opt_err
 */
FileEmitter.prototype._return = function(action, item, opt_err) {
  var queue;

  --this._numFDs;

  switch (action) {
    case 'readdir':
      queue = this._readdirQueue;
      break;
    case 'stat':
      queue = this._statQueue;
      break;
    case 'read':
      queue = this._readQueue;
      break;
  }

  if (opt_err) {

    // maximum number of file descriptors exceeded, see `ulimit -n`
    if (opt_err.code === 'EMFILE') {
      queue.unshift(item); // re-add item

      if (this._maxFDs > this._numFDs) {
        this._maxFDs = this._numFDs;
      } else {
        this._maxFDs = Math.max(--this._maxFDs, 1); // ensure > 0
      }

    } else {
      this._hadError = true;
      this.emit('error', opt_err, item);
    }
  }

  this.run();
};


/**
 * @param {string} directory
 * @return {void}
 */
FileEmitter.prototype._readdir = function(directory) {
  var self = this;
  var absolutePath = this.root + directory;

  fs.readdir(absolutePath, function(err, files) {
    if (err) {
      return self._return('readdir', directory, err);
    }
    var i, file;

    for (i = 0; i < files.length; ++i) {
      file = directory + '/' + files[i];

      if (!self.isIgnored(file)) {
        self._statQueue.push(file);
      }
    }

    self._return('readdir', directory);
  });
};


/**
 * @param {string} file The
 * @return {void}
 */
FileEmitter.prototype._stat = function(file) {
  var self = this;
  var absolutePath = this.root + file;

  fs.lstat(absolutePath, function(err, stats) {
    if (err) {
      return self._return('stat', file, err);
    }

    if (stats.isSymbolicLink() && !self.followSymLinks) {
      // TODO: maybe emit an event that we ignored a symlink
      return self._return('stat', file);
    }

    if (stats.isDirectory()) {
      self._readdirQueue.push(file);

    } else if (stats.isFile() && (!self.pattern || self.pattern.test(file))) {
      if (stats.size > self.maxFileSize) {
        self.emit('file', {
          name: file,
          stats: stats
        });
      } else {
        self._readQueue.push({
          name: file,
          stats: stats
        });
      }
    }

    self._return('stat', file);
  });
};


/**
 * @param {Object} item
 * @return {void}
 */
FileEmitter.prototype._read = function(item) {
  var self = this;
  var absolutePath = this.root + item.name;

  fs.readFile(absolutePath, function(err, data) {
    if (err) {
      return self._return('read', item, err);
    }
    item.data = data;

    self.emit('file', item);

    self._return('read', item);
  });
};


FileEmitter.prototype.run = function() {
  var i, limit;
  var x = 0;

  limit = Math.min(this._maxFDs - this._numFDs, this._readdirQueue.length);

  if (limit > 0) {
    for (i = 0; i < limit; ++i) {
      ++this._numFDs;
      this._readdir(this._readdirQueue.shift());
    }
    x += limit;
  }

  limit = Math.min(this._maxFDs - this._numFDs, this._statQueue.length);

  if (limit > 0) {
    for (i = 0; i < limit; ++i) {
      ++this._numFDs;
      this._stat(this._statQueue.shift());
    }
    x += limit;
  }

  limit = Math.min(this._maxFDs - this._numFDs, this._readQueue.length);

  if (limit > 0) {
    for (i = 0; i < limit; ++i) {
      ++this._numFDs;
      this._read(this._readQueue.shift());
    }
    x += limit;
  }

  if (x + this._numFDs === 0) {
    this.emit('end', this._hadError);
  }
};
