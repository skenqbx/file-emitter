# file-emitter

[![NPM version](https://img.shields.io/npm/v/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![downloads](https://img.shields.io/npm/dm/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![Build Status](https://secure.travis-ci.org/skenqbx/file-emitter.png)](http://travis-ci.org/skenqbx/file-emitter)

**_A recursive file emitter_**

```
Stability: 3 - Stable
```

## fileEmitter(folder, opt_options)
Create a new `FileEmitter` object, extends `events.EventEmitter`.

  - `{string} folder`
  - `{?Object} opt_options`

**opt_options**

  - `{boolean} buffer` Load each file into a buffer before emitting, defaults to `false`
  - `{number} maxBufferSize` The max size of a file buffer, defaults to `10485760` (=10MiB)
  - `{boolean} incremental` When `true` each `file` event has to be acknowledged by calling `fe.next()`
  - `{boolean} followSymLinks` ..., defaults to `false`
  - `{boolean} recursive` ..., defaults to `true`
  - `{boolean} autorun` ..., defaults to `true`
  - `{Array<string>} exclude` glob patterns applied after `readir`
  - `{Array<string>} include` glob patterns applied after `stat`
  - `{Object} minimatchOptions` See `minimatch` README, defaults to `{matchBase: true}`
  - `{Function} File` A custom constructor for file objects, has to extend `File`

### Example

```js
var fileEmitter = require('file-emitter');

var fe = fileEmitter('./lib', {
  buffer: true,
  incremental: true,
  include: ['*.js'],
  exclude: [
    '.git',
    'node_modules',
    'coverage',
    'test'
  ]
});

fe.on('file', function(file) {
  // {string} file.name
  // {fs.Stats} file.stats
  // {?Buffer} file.buffer

  if (!file.buffer) { // maxBufferSize exceeded

    // analog to fs.createReadStream()
    var readableStream = file.createReadStream();
    // ... consume stream
  }

  // acknowledge that the file has been processed
  //   see 'incremental' option
  fe.next();
});

fe.on('error', function(err) {
  // everything but EMFILE
});

fe.once('end', function(hadError) {
  // done
});
```

### fe.run()
Manually start scanning the folder & emitting files when `autostart=false`.


### fe.next()
When the emitter runs with `incremental = true` a call to `next()` is required after each `file` event to acknowledge that the file has been processed.

Used to process files asynchronously while preventing allocation of large queues & file buffers.

## fileEmitter.list(folder, opt_options, callback)
Convenience method to retrieve a list of files.

**opt_options**
  - all options of `fileEmitter()` except for `incremental` & `autorun`
  - `{function(File, File)} compare` A compare function passed to `Array.sort()`

### Example

```js
fileEmitter.list('./', {
  compare: function(a, b) {
    return a.stats.size - b.stats.size;
  },
}, function(err, files) {
  // ...
});
```

## Tests

```bash
npm test
firefox coverage/lcov-report/index.html
```

### Coverage

```
Statements   : 93.89% ( 169/180 )
Branches     : 89.90% ( 89/99 )
Functions    : 100%   ( 21/21 )
```
