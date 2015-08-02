(function() {
  'use strict'
  var crypto = require('crypto')
  var fs = require('fs')
  var _ = require('lodash');
  var pt = require('parse-torrent')
  var bencode = require('bencode')
  var u = require('./u')

  var Torrent = function Torrent(torrent) {
    if (!(this instanceof Torrent)) return new Torrent(torrent)
    this.peerId = u.randomId(20)

    if (_.endsWith(torrent, '.torrent')) {
      torrent = fs.readFileSync(torrent)
    }

    this.torrent = pt(torrent)
    console.log(this.torrent)
    // this.pieces = _.map(
    //   _.chunk(torrent.info.pieces, 20),
    //   function(piece) {
    //     var hex = _.map(piece, function(i) {
    //       return i.toString(16)
    //     })
    //     return hex.join('')
    //   })
    //
  }

  Torrent.prototype.getInfoHash = function() {
    return crypto
      .createHash('sha1')
      .update(bencode.encode(this.torrent.info))
      .digest('hex');
  }

  module.exports = Torrent;
}());
