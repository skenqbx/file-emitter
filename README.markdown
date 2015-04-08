# file-emitter

**_A recursive file emitter_**

[![NPM version](https://img.shields.io/npm/v/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![downloads](https://img.shields.io/npm/dm/file-emitter.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](https://www.npmjs.com/package/file-emitter)
[![Build Status](https://secure.travis-ci.org/skenqbx/file-emitter.png)](http://travis-ci.org/skenqbx/file-emitter)

```
Stability: 2 - Unstable
```

## Usage

```js
var fileEmitter = require('file-emitter');

var fe = fileEmitter('./lib');

fe.on('file', function(file) {
  // {string} file.name
  // {fs.Stats} file.stats
  // {?Buffer} file.buffer

  if (!file.buffer) {
    // analog to fs.createReadStream()
    var readableStream = file.createReadStream();
    // ... consume stream
  }
});

fe.on('error', function(err) {
  // everything but EMFILE
});

fe.once('end', function(hadError) {
  // done
});
```

## fileEmitter(folder, opt_options)
Create a new `FileEmitter`, extends `events.EventEmitter`.

 - `{string} folder`
 - `{?Object} opt_options`
  - `{string} mode` The mode of operation; `stats`, `buffer`, defaults to `buffer`
  - `{boolean} autorun` ..., defaults to `true`
  - `{RegExp} pattern` Test files before emitting/reading, defaults to `false`
  - `{Array<string>} ignore` An array of glob patterns to ignore
  - `{boolean} followSymLinks` ..., defaults to `false`
  - `{number} maxFDs` The maximum number of open fds, defaults to `Infinity`
  - `{number} maxFileSize` The max size for a file to buffer, defaults to `10485760` (=10MiB)

### fe.run()
Manually start scanning the folder & emitting files when `autostart=false`.


## Tests

```bash
npm test
firefox coverage/lcov-report/index.html
```

### Coverage

```
Statements   : 91.41% ( 117/128 )
Branches     : 74.19% ( 46/62 )
Functions    : 100% ( 13/13 )
Lines        : 91.41% ( 117/128 )
```
