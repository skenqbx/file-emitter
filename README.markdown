# file-emitter [![Build Status](https://secure.travis-ci.org/skenqbx/file-emitter.png)](http://travis-ci.org/skenqbx/file-emitter)

**_A recursive file emitter_**

```
Stability: 1 - Experimental
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
Create a new `FileEmitter`.

 - `{string} folder`
 - `{?Object} opt_options`
  - `{string} mode` The mode of operation; `stats`, `buffer`, defaults to `buffer`
  - `{boolean} autorun` ..., defaults to `true`
  - `{RegExp} pattern` Test files before emitting/reading, defaults to `false`
  - `{Array<string>} ignore` An array of glob patterns to ignore
  - `{boolean} followSymLinks` ..., default to `false`
  - `{number} maxFDs` The maximum number of open fds, defaults to `Infinity`
  - `{number} maxFileSize` The maximum size for a file to buffer, defaults to `10485760` (= 10 MiB)

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
