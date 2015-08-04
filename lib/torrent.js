(function() {
  'use strict'
  var crypto = require('crypto')
  var url = require('url')
  var inherits = require('util')
    .inherits
  var EventEmitter = require('events')
    .EventEmitter
  var fs = require('fs')
  var _ = require('lodash')
  var bencode = require('bencode')
  var u = require('./u')

  var Torrent = function Torrent(torrent) {
    if (!(this instanceof Torrent)) return new Torrent(torrent)
    var protocol

    EventEmitter.call(this);

    this.peerId = u.randomId(40)
    this.torrent = bencode.decode(fs.readFileSync(torrent))
    this.announcers = this.torrent['announce-list'].map(function(anon) {
      return anon.toString()
    })
    this.infoHash =
      crypto
      .createHash('sha1')
      .update(bencode.encode(this.torrent.info))
      .digest('hex')
    this.pieces =
      _.map(_.chunk(this.torrent.info.pieces, 20), function(piece) {
        var hex = _.map(piece, function(i) {
          return i.toString(16)
        })
        return hex.join('')
      })

    this.trackers = this.announcers.map(function(anon) {
      protocol = url.parse(anon).protocol
      switch (protocol) {
        case 'udp:':
          return require('./tracker/udp')(anon, this)
          break
        default:
          break
      }
    }, this)
  }
  inherits(Torrent, EventEmitter)

  module.exports = Torrent;
}());
