(function () {
  var fs = require('fs');
  var bencode = require('bencode');
  var crypto = require('crypto');

  var misc = {}

  misc.peerId = function () {
    var peerid = new Buffer(20);
    var urandom = fs.openSync('/dev/urandom', 'r');
    fs.readSync(urandom, peerid, 0, 20, 0);
    return peerid.toString('hex');
  }

  misc.infoHash = function (torrent) {
    return crypto
      .createHash('sha1')
      .update(bencode.encode(torrent.info))
      .digest('hex');
  }

  misc.panic = function (msg) {
    console.log(msg);
    process.exit(1);
  }

  module.exports = misc;
}())
