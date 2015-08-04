(function() {
  var fs = require('fs');
  var bencode = require('bencode');
  var crypto = require('crypto');
  var chance = require('chance')()

  var u = {}

  u.randomId = function(length) {
    var text = ''
    var possible = 'abcdef0123456789'

    length = length || 10
    for (var i = 0; i < length; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  u.randomTransactionId = function () {
    return chance.integer({
      min: 0,
      max: Math.pow(2, 31) - 1
    })
  }

  u.panic = function(msg) {
    console.log(msg);
    process.exit(1);
  }

  module.exports = u;
}())
