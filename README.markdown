# file-emitter [![Build Status](https://secure.travis-ci.org/skenqbx/file-emitter.png)](http://travis-ci.org/skenqbx/file-emitter)

**_A recursive file emitter_**

```
Stability: 1 - Experimental
```

## Usage

```js
var fileEmitter = require('file-emitter', {
  pattern: /.*\.js$/          // only files ending with `.js`
});

var fe = fileEmitter('./lib');

fe.on('file', function(file) {
  // {string} file.name
  // {fs.Stats} file.stats
  // {Buffer} file.data
});


fe.on('error', function(err) {
  // everything but EMFILE
});


fe.once('end', function(hadError) {
  // done
});
```

## Tests

```bash
npm test
firefox coverage/lcov-report/index.html
```

### Coverage

```
Statements   : 87.38% ( 90/103 )
Branches     : 68.00% ( 34/50 )
Functions    : 100% ( 10/10 )
Lines        : 87.38% ( 90/103 )
```
