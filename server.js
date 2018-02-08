// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

var randomcolor = require('randomcolor');
var Victor = require('victor');


const port = 5000;

app.set('port', port);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(port, function() {
  console.log(`Starting server on port ${port}`);
});

// Add the WebSocket handlers
const state = {
  players: [],
  bullets: [],
};

const tickrate = 1/60;
const playerSpeed = 100;
const bulletSpeed = 100;

// Everything inside 'connection' is per-player.
io.on('connection', function(socket) {
  let player = null;

  // Create a new player.
  socket.on('new player', () => {
    player = {
      id: socket.id,
      x: 300,
      y: 300,
      fillStyle: randomcolor()
    };
    state.players.push(player);
  });

  // Remove player if they leave.
  socket.on('disconnect', () => {
    if (state.players.indexOf(player) > -1) {
      state.players.splice(state.players.indexOf(player), 1);
    }
  });

  socket.on('loop', data => {
    if (!player) return;
    let x = 0;
    let y = 0;
    if (data.left) {
      x = -1;
    }
    if (data.right) {
      x = 1;
    }
    if (data.up) {
      y = -1;
    }
    if (data.down) {
      y = 1;
    }

    let move = new Victor(x, y);

    if (!(move.x === 0 && move.y === 0)) {
      move = move.normalize();
    }

    player.x += move.x * tickrate * playerSpeed;
    player.y += move.y * tickrate * playerSpeed;
  });

  socket.on('mouse', data => {
    const playerPos = Victor.fromObject(player);
    const clickPos = Victor.fromObject(data);
    // get normalised vector
    const bulletVec = playerPos.subtract(clickPos).normalize();
    // create a bullet, update its position in the movement loop
    console.log(bulletVec);
  });
});

setInterval(function() {
  io.sockets.emit('state', state);
}, 1000 / 60);
