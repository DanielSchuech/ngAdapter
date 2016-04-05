var through = require('through2');

module.exports = function (file) {
    return through(function (buf, enc, next) {
        this.push(buf.toString('utf8')
          .replace(/(var __extends = \(this && this.__extends\))/g, 
            '$1/* istanbul ignore next */')
          .replace(/(var __decorate = \(this && this.__decorate\))/g,
            '$1/* istanbul ignore next */')
          .replace(/(var __metadata = \(this && this.__metadata\))/g,
             '$1/* istanbul ignore next */'));
        next();
    });
};
