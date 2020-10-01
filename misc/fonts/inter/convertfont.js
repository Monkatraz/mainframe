var fs = require('fs');
var ttf2woff2 = require('ttf2woff2');
 
var input = fs.readFileSync('Inter-VariableFont_slnt,wght.ttf');
 
fs.writeFileSync('Inter-VariableFont.woff2', ttf2woff2(input));