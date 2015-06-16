#!/usr/bin/env node

var path    = require('path');
var spawn   = require('child_process').spawn;
var coffee  = path.resolve(__dirname, 'node_modules/coffee-script/bin/coffee');
var main    = path.resolve(__dirname, 'lib/main.coffee');

var bot = spawn(coffee, [main]);

bot.stdout.on('data', function (data) {
  process.stdout.write('' + data);
});

bot.stderr.on('data', function (data) {
  process.stderr.write('stderr: ' + data);
});

bot.on('close', function (code) {
  console.log('NTB exited with code ' + code);
});

bot.on('error', function(err) {
  console.log(err);
  throw err;
});

process.on( 'SIGINT', function() {
  bot.kill();
});
