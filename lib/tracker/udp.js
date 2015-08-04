(function() {
  'use strict';

  var url = require('url')
  var dgram = require('dgram')
  var chance = require('chance')()
  var _ = require('lodash')
  var ip = require('ip')
  var u = require('../u')

  var Torrent = null

  // Reponse Type
  var RT = {
    CONNECT: 0,
    ANNOUNCE: 1,

  }


  var onMessage = function(message, rinfo, udp) {
    var type = message.readUInt32BE(0)

    switch (type) {
      case RT.CONNECT:
        udp.onConnect(message)
        break
      case RT.ANNOUNCE:
        udp.onAnnounce(message)
        break;
      default:
        console.log('Unknown response')
        break
    }
    //
    // console.log('type: ', type)
    // console.log(this.address())
    // console.log(this)
    // console.log('from: ', rinfo)
  }


  var UDP = function UDP(announcer, torrent) {
    if (!(this instanceof UDP)) return new UDP(announcer, torrent)

    var U = url.parse(announcer)

    this.announcer = announcer
    this.torrent = torrent;
    this.rport = U.port
    this.rhost = U.hostname

    this.socket = dgram.createSocket('udp4', _.partialRight(onMessage, this))
    this.socket.on('error', function(e) {
      console.log('## error connecting to: ', this.rhost)
    }.bind(this))

    this.connect()
  }

  UDP.prototype.onConnect = function(message) {
    if (message.length < 16) return

    var transactionId = message.readInt32BE(4)
    if (transactionId !== this.transactionId) return

    this.connectionId1 = message.readInt32BE(8)
    this.connectionId2 = message.readInt32BE(12)

    this.announce()
  }

  UDP.prototype.connect = function(anon) {
    var buffer = new Buffer(16);

    this.connectionId1 = 0x0
    this.connectionId2 = 0x0
    this.transactionId = u.randomTransactionId()

    buffer.writeInt32BE(0x00000417, 0) // connect magic
    buffer.writeInt32BE(0x27101980, 4) // connect magic
    buffer.writeInt32BE(RT.CONNECT, 8) // connect
    buffer.writeInt32BE(this.transactionId, 12)

    this.socket.send(buffer, 0, 16, this.rport, this.rhost)
  }

  UDP.prototype.announce = function() {
    var buffer = new Buffer(98)
    var torrent = this.torrent

    this.transactionId = u.randomTransactionId()

    // buffer.writeUInt32BE(this.connectionId1, 0)
    buffer.writeInt32BE(this.connectionId1, 0)
    buffer.writeInt32BE(this.connectionId2, 4) // connection id

    buffer.writeInt32BE(RT.ANNOUNCE, 8) // action 1

    buffer.writeInt32BE(this.transactionId, 12) // transaction id

    buffer.write(torrent.infoHash, 16, 20, 'hex') // info hash
    buffer.write(torrent.peerId, 36, 20, 'hex') // peer id

    console.log(torrent.infoHash.toString('hex'))
    console.log(Buffer(torrent.infoHash, 'hex').length)

    buffer.writeInt32BE(0, 56) // downloaded
    buffer.writeInt32BE(0, 60) // downloaded

    var left = _.reduce(this.torrent.torrent.info.files, function(acc, current) {
      return acc + current.length
    }, 0)
    buffer.writeInt32BE(0, 64) // left
    buffer.writeInt32BE(left, 68) // left

    buffer.writeInt32BE(0, 72) // uploaded
    buffer.writeInt32BE(0, 76) // uploaded

    buffer.writeInt32BE(2, 80) // event (0 = node)
    buffer.writeUInt32BE(0, 84) // ip (0 = default)

    buffer.writeUInt32BE(u.randomTransactionId(), 88) // key
    buffer.writeInt32BE(10, 92); // num wanted
    buffer.writeUInt16BE(this.socket.address().port, 96) // port

    this.socket.send(buffer, 0, 98, this.rport, this.rhost)
  }

  UDP.prototype.onAnnounce = function(message) {
    if (message.length < 20) return

    var transactionId = message.readInt32BE(4)
    if (transactionId !== this.transactionId) return

    var peers = []
    var peersCount = (message.length - 20) / 6;

    var interval = message.readInt32BE(8)
    var leechers = message.readInt32BE(12)
    var seeders = message.readInt32BE(16)

    // console.log('Host count: ', peersCount)
    // console.log('Length: ', message.length)
    // console.log('Interval: ', interval)
    // console.log('Seedrs: ', seeders)
    // console.log('Leechers: ', leechers)

    for (var i = 0; i < peersCount; i++) {
      var hOffset = 20 + (i * 6)
      var pOffset = hOffset + 4
      var peer = {
        ip: ip.fromLong(message.readInt32BE(hOffset)),
        port: message.readUInt16BE(pOffset)
      }
      peers.push(peer)
    }

    console.log(peers)
    this.peers = peers
  }

  module.exports = UDP
}());
