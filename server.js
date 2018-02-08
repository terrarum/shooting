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

const speed = 100;

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

  socket.on('movement', data => {
    if (!player) return;
    let x = 0;
    let y = 0;
    if (data.left) {
      x = -speed;
    }
    if (data.right) {
      x = speed;
    }
    if (data.up) {
      y = -speed;
    }
    if (data.down) {
      y = speed;
    }

    let move = new Victor(x, y);

    if (move.x === 0 && move.y === 0) {
      player.x += move.x;
      player.y += move.y;
    }
    else {
      move = move.normalize();
    }

    player.x += move.x * 0.016 * speed;
    player.y += move.y * 0.016 * speed;
  });

  socket.on('mouse', data => {
    console.log(data);
  });
});

setInterval(function() {
  io.sockets.emit('state', state);
}, 1000 / 60);
