'use strict';

var coverageTransform = require('./coveragetransform');
var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    plugins: [
      'karma-browserify',
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-jasmine-html-reporter',
      'karma-coverage'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular2/bundles/angular2-polyfills.js',
      /*'node_modules/systemjs/dist/system.src.js',
      'node_modules/angular2/bundles/angular2.dev.js',
      'node_modules/angular2/bundles/upgrade.js',*/
      'node_modules/reflect-metadata/Reflect.js',
      {pattern: 'node_modules/reflect-metadata/Reflect.js.map', included: false, serve: true},
      'node_modules/angular/angular.js',
      'test/**/*.spec.ts'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.ts': ['browserify']
    },

    browserify: {
      debug: true,
      bundleDelay: 1500,
      transform: [
        coverageTransform,
        istanbul({ignore: ['**/*.html']})
      ],
       plugin: [
         ['tsify', {target: 'es5'}]
       ]
     },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'kjhtml', 'coverage'],
    
    
    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    
    autoWatchBatchDelay: 2000,
  
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    coverageReporter: {
      reporters:[
        {type: 'html', dir:'log/coverage/', subdir: '.'},
        {type: 'cobertura', dir:'log/coverage/', subdir: '.'}
      ],
    },
    
    //How long will Karma wait for a message from a browser before disconnecting from it (in ms).
    browserNoActivityTimeout: 60000
  });
}; 