var fs = require('fs');
var ttf2woff2 = require('ttf2woff2');
 
var input = fs.readFileSync('Spartan-VariableFont.ttf');
 
fs.writeFileSync('Spartan-VariableFont.woff2', ttf2woff2(input));