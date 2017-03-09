var fs = require('fs');
var path = require('path');

var Lexer = require('lex');
var present = require('present');

var lines = 0;
var chars = 0;

var argv = require('minimist')(process.argv.slice(2));
var filePath = path.join(__dirname, argv._[0]);

// Formatted output please
String.prototype.format = String.prototype.f = function() {
  var s = this,
    i = arguments.length;

  while (i--) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }
  return s;
};

// Try lexing a file
fs.readFile(filePath, {
  encoding: 'utf-8'
}, function(err, data) {
  if (!err) {
    (new Lexer()).addRule(/\n/, function() {
      lines++;
      chars++;
    }).addRule(/./, function() {
      chars++;
    }).setInput(data).lex();

    console.log('Processed {0} lines'.format(lines));
    console.log('and {0} characters'.format(chars));
  } else {
    console.log(err);
  }
});
