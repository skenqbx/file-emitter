# file-emitter

[![NPM version](https://img.shields.io/npm/v/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![downloads](https://img.shields.io/npm/dm/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![Build Status](https://secure.travis-ci.org/skenqbx/file-emitter.png)](http://travis-ci.org/skenqbx/file-emitter)

**_A recursive file emitter_**

```
Stability: 3 - Stable
```

## Usage

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

  fe.next(); // acknowledge that the file has been processed (see 'incremental')
});

fe.on('error', function(err) {
  // everything but EMFILE
});

fe.once('end', function(hadError) {
  // done
});
```

## fileEmitter(folder, opt_options)
Create a new `FileEmitter` object, extends `events.EventEmitter`.

  - `{string} folder`
  - `{?Object} opt_options`
    - `{boolean} buffer` Load each file into a buffer before emitting, defaults to `false`
    - `{number} maxBufferSize` The max size of a file buffer, defaults to `10485760` (=10MiB)
    - `{boolean} incremental` When `true` each `file` event has to be acknowledged by calling `fe.next()`
    - `{boolean} autorun` ..., defaults to `true`
    - `{boolean} followSymLinks` ..., defaults to `false`
    - `{Array<string>} exclude` glob patterns applied after `readir`
    - `{Array<string>} include` glob patterns applied after `stat`
    - `{Object} minimatchOptions` See `minimatch` README, defaults to `{matchBase: true}`

### fe.run()
Manually start scanning the folder & emitting files when `autostart=false`.


### fe.next()
When the emitter runs with `incremental = true` a call to `next()` is required after each `file` event to acknowledge that the file has been processed.

Used to process files asynchronously while preventing allocation of large queues & file buffers.

## Tests

```bash
npm test
firefox coverage/lcov-report/index.html
```

### Coverage

```
Statements   : 92.90% ( 144/155 )
Branches     : 87.95% ( 73/83 )
Functions    : 100% ( 17/17 )
```
