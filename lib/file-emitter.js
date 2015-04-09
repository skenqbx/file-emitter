'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var events = require('events');
var minimatch = require('minimatch');
var File = require('./file');



/**
 * file-emitter
 *
 * **opt_options**
 *   - `{boolean} buffer` Load each file into a buffer before emitting, defaults to `false`
 *   - `{number} maxBufferSize` The max size of a file buffer, defaults to `10485760` (=10MiB)
 *   - `{boolean} incremental` When `true` each `file` event has to be acknowledged by calling `fe.next()`
 *   - `{boolean} autorun` ..., defaults to `true`
 *   - `{boolean} followSymLinks` ..., defaults to `false`
 *   - `{RegExp} pattern` Only files matching this pattern are emitting/buffered
 *   - `{Array<string>} ignore` An array of glob patterns to ignore
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

  // flags & options
  this.buffer = opt_options.buffer || false;
  this.incremental = opt_options.incremental || false;
  this.followSymLinks = opt_options.followSymLinks || false;
  this.maxBufferSize = opt_options.maxBufferSize || 10485760; // 10 MiB

  // filters
  this.pattern = opt_options.pattern || false;
  this.ignore = opt_options.ignore || false;

  // read, stat & readdir queues
  this._queues = [[], [], ['']];

  // max number of open file descriptors (used for incremental EMFILE back-off)
  this._maxFDs = opt_options.maxFDs || Infinity; // UNDOCUMENTED OPTION
  // currently open file descriptors
  this._numFDs = 0;
  // incremental lock
  this._locked = false;
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
 * @param {number} queue
 * @param {string|File} item
 * @param {?Error=} opt_err
 */
FileEmitter.prototype._return = function(queue, item, opt_err) {
  --this._numFDs;

  if (opt_err) {

    // maximum number of file descriptors exceeded, see `ulimit -n`
    if (opt_err.code === 'EMFILE') {
      this._queues[queue].unshift(item); // re-add item

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
      return self._return(2, directory, err);
    }
    var i, file;

    for (i = 0; i < files.length; ++i) {
      file = directory + path.sep + files[i];

      if (!self.isIgnored(file)) {
        self._queues[1].push(file);
      }
    }

    self._return(2, directory);
  });
};


/**
 * @param {string} file The
 * @return {void}
 */
FileEmitter.prototype._stat = function(file) {
  var self = this;
  var absolutePath = this.root + file;
  var obj;

  fs.lstat(absolutePath, function(err, stats) {
    if (err) {
      self._locked = false;
      return self._return(1, file, err);
    }

    if (stats.isSymbolicLink() && !self.followSymLinks) {
      // TODO: maybe emit an event that we ignored a symlink
      // TODO: test symlinks
      self._locked = false;
      return self._return(1, file);
    }

    if (stats.isDirectory()) {
      self._locked = false;
      self._queues[2].push(file);

    } else if (stats.isFile() &&
        (!self.pattern || self.pattern.test(file))) {

      obj = new File(self, file, stats);

      if (self.buffer && stats.size <= self.maxBufferSize) {
        self._queues[0].push(obj);
      } else {
        self.emit('file', obj);
      }
    } else {
      self._locked = false;
    }

    self._return(1, file);
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
      self._locked = false;
      return self._return(0, item, err);
    }
    item.buffer = data;

    self.emit('file', item);

    self._return(0, item);
  });
};


FileEmitter.prototype.run = function() {
  var i, j, limit;
  var freeFDs = this._maxFDs - this._numFDs;

  if (!freeFDs || this._locked) { // EMFILE back-off OR incremental lock
    return;
  }

  if (this.incremental) {
    //
    // **Incremental Emitter**
    //
    //   - read XOR stat XOR readir
    //   - next task only exectuted after call to `next()`
    //
    if (this._queues[0].length) {
      this._locked = true;

      ++this._numFDs;
      this._read(this._queues[0].shift());

    } else if (this._queues[1].length) {
      this._locked = !this.buffer; // only lock when not buffering files

      ++this._numFDs;
      this._stat(this._queues[1].shift());

    } else if (this._queues[2].length) {
      ++this._numFDs;
      this._readdir(this._queues[2].shift());
    }

  } else {
    //
    // **Parallel Emitter**
    //
    //   - read AND stat AND readdir
    //
    for (i = 0; i < 3; ++i) {
      freeFDs = this._maxFDs - this._numFDs;

      if (!freeFDs) {
        break;
      } else if (!this._queues[i].length) {
        continue;
      }

      limit = Math.min(freeFDs, this._queues[i].length);

      if (limit > 0) {
        switch (i) {
          case 0:
            for (j = 0; j < limit; ++j) {
              this._read(this._queues[i].shift());
            }
            break;

          case 1:
            for (j = 0; j < limit; ++j) {
              this._stat(this._queues[i].shift());
            }
            break;

          case 2:
            for (j = 0; j < limit; ++j) {
              this._readdir(this._queues[i].shift());
            }
            break;

          // No Default
        }
        this._numFDs += limit;
      }
    } // for-i
  }

  if (this._numFDs === 0) {
    this.emit('end', this._hadError);
  }
};


FileEmitter.prototype.next = function() {
  if (this._locked) {
    this._locked = false;
    this.run();
  }
};
