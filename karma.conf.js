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
      'karma-firefox-launcher',
      'karma-jasmine-html-reporter',
      'karma-coverage'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'jasmine'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/es6-shim/es6-shim.min.js',
      'node_modules/reflect-metadata/Reflect.js',
      'node_modules/zone.js/dist/zone.js',
      {pattern: 'node_modules/reflect-metadata/Reflect.js.map', included: false, serve: true},
      'node_modules/angular/angular.js',
      {pattern: 'test/test.html', included: false, serve: true},
      `test/**/*.spec.ts`
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
      // transform: [
      //   coverageTransform,
      //   istanbul({ignore: ['**/*.html'], instrumenter: require('isparta')})
      // ],
      plugin: [
        ['tsify', {
          target: 'es5',
          declaration: true,
          sourceMap: true,
          experimentalDecorators: true
        }]
      ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'kjhtml', /*'coverage'*/],
    
    
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
    browsers: [process.env.TRAVIS ? 'Firefox' : 'Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    coverageReporter: {
      reporters:[
        //{type: 'html', dir:'log/coverage/html', subdir: '.'},
        //{type: 'cobertura', dir:'log/coverage/', subdir: '.'}
        {type: 'html', dir:'log/coverage/', 
          subdir: process.argv[process.argv.indexOf('--part') + 1]},
        {type: 'lcovonly', dir:'log/coverage/', subdir: '.', 
          file: process.argv[process.argv.indexOf('--part') + 1] + '.info'}
      ],
    },
    
    //How long will Karma wait for a message from a browser before disconnecting from it (in ms).
    browserNoActivityTimeout: 300000,

    //recognize ts files as script
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
  });
}; 
