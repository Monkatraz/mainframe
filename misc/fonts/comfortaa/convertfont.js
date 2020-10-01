var fs = require('fs');
var ttf2woff2 = require('ttf2woff2');
 
var input = fs.readFileSync('Comfortaa-VariableFont_wght.ttf');
 
fs.writeFileSync('Comfortaa-VariableFont.woff2', ttf2woff2(input));