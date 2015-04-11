'use strict';
/* global suite: false, setup: false, test: false,
    teardown: false, suiteSetup: false, suiteTeardown: false */
var assert = require('assert');
var common = require('./common');
var fileEmitter = require('../');


/**
 * Note: All FileEmitter events are listened to with `on()` to detect possible double emissions.
 */
suite('list', function() {
  test('default', function(done) {
    fileEmitter.list(common.fixtures, function(err, files) {
      assert(files);
      assert.strictEqual(files.length, 9);
      done(err);
    });
  });


  test('error', function(done) {
    fileEmitter.list('does/not/exist', function(err, files) {
      assert(err);
      done();
    });
  });


  test('options', function(done) {
    fileEmitter.list(common.fixtures, {
      autorun: false,
      incremental: false,
      include: ['*.xx'],
      exclude: [
        '.sl',
        '.dot'
      ]
    }, function(err, files) {
      assert(files);
      assert.strictEqual(files.length, 5);
      done(err);
    });
  });


  test('compare', function(done) {
    fileEmitter.list(common.fixtures, {
      compare: function(a, b) {
        return a.stats.size - b.stats.size;
      },
      include: ['*.xx'],
      exclude: [
        '.sl',
        '.dot'
      ]
    }, function(err, files) {
      assert(files);
      assert.strictEqual(files.length, 5);
      done(err);
    });
  });
});
