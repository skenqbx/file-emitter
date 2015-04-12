'use strict';
var FileEmitter = require('./file-emitter');


/**
 * **opt_options**
 *   - all options of `fileEmitter()` except for `incremental` & `autorun`
 *   - `{function(File, File)} compare` A compare function passed to `Array.sort()`
 *
 * @param {string} folder
 * @param {?Object} opt_options
 * @param {function(?Error, Array<File>)} callback
 */
function list(folder, opt_options, callback) {
  if (typeof opt_options === 'function') {
    callback = opt_options;
    opt_options = null;
  }
  opt_options = opt_options || {};

  // force options
  opt_options.incremental = true;
  opt_options.autorun = true;

  var fe = new FileEmitter(folder, opt_options);
  var files = [];
  var returned = false;

  fe.on('file', function(file) {
    files.push(file);
    fe.next();
  });

  fe.once('error', function(err) {
    if (!returned) {
      returned = true;
      callback(err, files);
    }
  });

  fe.once('end', function() {
    if (opt_options.compare) {
      files.sort(opt_options.compare);
    }
    if (!returned) {
      returned = true;
      callback(null, files);
    }
  });
}
module.exports = list;
