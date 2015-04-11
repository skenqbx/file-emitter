'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var fileEmitter = require('../');


/**
 * Note: All FileEmitter events are listened to with `on()` to detect possible double emissions.
 */
suite('file-emitter', function() {
  var def = {
    include: ['*.xx'],
    exclude: [
      '.sl',
      '.dot'
    ]
  };


  test('error', function(done) {
    var fe = fileEmitter('does/not/exist');

    fe.on('error', function(err) {
      assert(err);
      assert.strictEqual(err.code, 'ENOENT');
      done();
    });
  });


  test('default', function(done) {
    var fe = fileEmitter(common.fixtures, {
      include: def.include,
      exclude: def.exclude
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

      files.push(file.toJSON().name);
    });

    fe.on('error', done);

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 5);
      files.sort(); // order can not be garanteed due to parallel calls
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/fn.xx',
        '/lib/index.xx',
        '/lib/sub/000.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
    });
  });


  test('buffer', function(done) {
    var fe = fileEmitter(common.fixtures, {
      buffer: true,
      include: def.include,
      exclude: def.exclude
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      assert(file.buffer);
      assert.strictEqual(file.stats.size, file.buffer.length);

      files.push(file.toJSON().name);
    });

    fe.on('error', done);

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 5);
      files.sort(); // order can not be garanteed due to parallel calls
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/fn.xx',
        '/lib/index.xx',
        '/lib/sub/000.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('incremental', function(done) {
    var fe = fileEmitter(common.fixtures, {
      incremental: true,
      include: def.include,
      exclude: def.exclude
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());
      files.push(file.name);

      fe.next();
    });

    fe.on('error', done);

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 5);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/fn.xx',
        '/lib/index.xx',
        '/lib/sub/000.xx',
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
      include: def.include,
      exclude: def.exclude
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

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 5);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/fn.xx',
        '/lib/index.xx',
        '/lib/sub/000.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('followSymLinks', function(done) {
    var fe = fileEmitter(common.fixtures, {
      incremental: true,
      followSymLinks: true,
      include: def.include,
      exclude: def.exclude
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());

      files.push(file.name);

      fe.next();
    });

    fe.on('error', done);

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 6);
      assert.deepEqual(files, [
        '/index.xx',
        '/lib/fn.xx',
        '/lib/index.xx',
        '/lib/sl/index.xx',
        '/lib/sub/000.xx',
        '/lib/sub/abc.xx'
      ]);
      assert(!hadError);
      done();
    });
  });


  test('non-recursive', function(done) {
    var fe = fileEmitter(common.fixtures, {
      recursive: false,
      include: def.include
    });
    var files = [];

    fe.on('file', function(file) {
      assert(file.stats.isFile());

      files.push(file.name);
    });

    fe.on('error', done);

    fe.on('end', function(hadError) {
      assert.strictEqual(files.length, 1);
      assert.deepEqual(files, [
        '/index.xx'
      ]);
      assert(!hadError);
      done();
    });
  });
});
