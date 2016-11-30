#! /usr/bin/env node
var fs = require("fs");
var process_path = process.cwd();
var path = require('path');
fs.readFile(path.resolve(process_path, "./index.js"), 'utf8', function(err, data){
	data = data.replace(/require\('(.*?)\.[html|css]'\)/g, function(a,b){
		console.log(a);
	});
});
