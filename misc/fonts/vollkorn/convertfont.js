var fs = require('fs');
var ttf2woff2 = require('ttf2woff2');
 
var input = fs.readFileSync('Vollkorn-Italic-VariableFont_wght.ttf');
 
fs.writeFileSync('Vollkorn-Italic-VariableFont_wght.woff2', ttf2woff2(input));