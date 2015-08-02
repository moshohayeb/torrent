var fs = require('fs');
var _ = require('lodash');
var bencode = require('bencode');
var url = require('url');
var dgram = require('dgram');
var int53 = require('int53');

var misc = require('./misc');
var panic = misc.panic;

var raw = fs.readFileSync('./entourage.2015.1080p.hc.webrip.x264.aac.torrent')
var torrent = bencode.decode(raw)

var counter = 0

var peerId =  misc.peerId()
var infoHash = misc.infoHash(torrent)
var announce = torrent.announce.toString()

var url = url.parse(announce)

if (!_.startsWith(url.protocol, 'udp')) {
  panic('Only udp trackers are supported')
}

var transactionId = 0x3455333;

var udp = dgram.createSocket('udp4', function (message) {
  console.log(message.length)
  counter += 1;
  if (counter === 5) process.exit(0)
  var address = udp.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
  var action = message.readUInt32BE(0)
  var tid = message.readUInt32BE(4)
  var cid1 = message.readUInt32BE(8)
  var cid2 = message.readUInt32BE(12)
  console.log('action = ', action)
  console.log('transaction id = ', tid)
  console.log('connection id 1 = ', cid1.toString(16))
  console.log('connection id 2 = ', cid2.toString(16))
  var nbuf = new Buffer(1024);
  nbuf.writeUInt32BE(cid1, 0);
  nbuf.writeUInt32BE(cid2, 4); // connection id
  nbuf.writeUInt32BE(1, 8); // action 1
  nbuf.writeUInt32BE(0x43134212, 12); // transaction id
  nbuf.write(infoHash, 16, infoHash.length); // info hash
  nbuf.write(peerId, 32, peerId.length); // peer id


  nbuf.writeUInt32BE(0, 56); // downloaded
  nbuf.writeUInt32BE(0, 60); // downloaded

  nbuf.writeUInt32BE(0, 64); // left
  nbuf.writeUInt32BE(0, 68); // left

  nbuf.writeUInt32BE(0, 72); // uploaded
  nbuf.writeUInt32BE(0, 76); // uploaded

  nbuf.writeUInt32BE(0, 80); // event (0 = node)

  nbuf.writeUInt32BE(0, 84); // ip (0 = default)

  nbuf.writeUInt32BE(0, 88); // key?
  nbuf.writeUInt32BE(0, 92); // num_wait?
  nbuf.writeUInt32BE(address.port, 96); // port


  udp.send(nbuf, 0, 98, url.port, url.hostname)
  console.log()


});


// var PORT = 34344
// var IP = '127.0.0.1'
// server.bind(PORT, IP);


var buf = new Buffer(16);
int53.writeUInt64BE(0x41727101980, buf, 0);
buf.writeUInt32BE(0, 8);
buf.writeUInt32BE(transactionId, 12);

console.log(transactionId)
udp.send(buf, 0, 16, url.port, url.hostname)
