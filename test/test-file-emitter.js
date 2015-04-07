'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var fileEmitter = require('../');


suite('file-emitter', function() {

  test('basic', function(done) {
    var fe = fileEmitter(common.root, {
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
      assert.strictEqual(file.stats.size, file.data.length);

      files.push(file.name);
    });

    fe.on('error', function(err) {
      done(err);
    });

    fe.once('end', function(hadError) {
      assert.strictEqual(files.length, 3);
      assert(!hadError);
      done();
    });
  });
});
