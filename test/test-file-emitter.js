'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var fileEmitter = require('../');


suite('file-emitter', function() {
  var def = {
    pattern: /.*\.xx$/,
    ignore: [
      '.sl',
      '.dot'
    ]
  };


  test('default', function(done) {
    var fe = fileEmitter(common.fixtures, {
      pattern: def.pattern,
      ignore: def.ignore
    });
    var files = [];
    var pending = 0;

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      assert.strictEqual(file.buffer, null);

      var bytesRead = 0;
      var readableStream = file.createReadStream();

      ++pending;

      readableStream.on('readable', function() {
        var data = readableStream.read();

        if (data) {
          bytesRead += data.length;
        }
      });

      readableStream.once('end', function() {
        assert.strictEqual(file.stats.size, bytesRead);

        if (--pending === 0) {
          done();
        }
      });

      readableStream.once('error', done);

      files.push(file.name);
    });

    fe.once('error', done);

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 3);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/index.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
    });
  });


  test('buffer', function(done) {
    var fe = fileEmitter(common.fixtures, {
      buffer: true,
      pattern: def.pattern,
      ignore: def.ignore
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      assert(file.buffer);
      assert.strictEqual(file.stats.size, file.buffer.length);

      files.push(file.name);
    });

    fe.on('error', done);

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 3);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/index.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('incremental', function(done) {
    var fe = fileEmitter(common.fixtures, {
      incremental: true,
      pattern: def.pattern,
      ignore: def.ignore
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      files.push(file.name);

      fe.next();
    });

    fe.on('error', done);

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 3);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/index.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('buffer+incremental', function(done) {
    var fe = fileEmitter(common.fixtures, {
      incremental: true,
      buffer: true,
      pattern: def.pattern,
      ignore: def.ignore
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      assert(file.buffer);
      assert.strictEqual(file.stats.size, file.buffer.length);

      files.push(file.name);

      fe.next();
    });

    fe.on('error', done);

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 3);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/index.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('followSymLinks', function(done) {
    var fe = fileEmitter(common.fixtures, {
      followSymLinks: true,
      pattern: def.pattern,
      ignore: def.ignore
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());

      files.push(file.name);
    });

    fe.on('error', done);

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 4);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/index.xx',
        '/lib/sub/abc.xx',
        '/lib/sl/index.xx'
      ]);
      assert(!hadError);
      done();
    });
  });
});
