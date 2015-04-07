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
  // {?Buffer} file.data
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
Statements   : 89.66% ( 104/116 )
Branches     : 72.41% ( 42/58 )
Functions    : 100%   ( 11/11 )
Lines        : 89.66% ( 104/116 )
```
