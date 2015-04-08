'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var fileEmitter = require('../');


suite('file-emitter', function() {

  test('mode=stats', function(done) {
    var fe = fileEmitter(common.root, {
      mode: 'stats',
      pattern: /.*\.js$/,
      ignore: [
        '.git',
        'node_modules',
        'coverage',
        'test'
      ]
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
        bytesRead += data.length;
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
      assert.strictEqual(files.length, 4);
      assert(!hadError);
    });
  });


  test('mode=buffer', function(done) {
    var fe = fileEmitter(common.root, {
      mode: 'buffer',
      pattern: /.*\.js$/,
      ignore: [
        '.git',
        'node_modules',
        'coverage',
        'test'
      ]
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
      assert.strictEqual(files.length, 4);
      assert(!hadError);
      done();
    });
  });
});
