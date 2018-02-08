// Dependencies
const express = require('express');
const _ = require('lodash');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);

const randomcolor = require('randomcolor');
const Victor = require('victor');


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

const width = 800;
const height = 600;

const tickrate = 1/60;
const playerSpeed = 100;
const bulletSpeed = 100;

setInterval(() => {
  state.bullets.forEach(bullet => {
    bullet.x -= bullet.xV;
    bullet.y -= bullet.yV;
    bullet.lifespan -= tickrate;

    if (bullet.lifespan < 0) {
      state.bullets.splice(state.bullets.indexOf(bullet), 1);
    };
  })
}, tickrate);

// Everything inside 'connection' is per-player.
io.on('connection', function(socket) {
  let player = null;

  // Create a new player.
  socket.on('new player', () => {
    player = {
      id: socket.id,
      x: _.random(0, width),
      y: _.random(0, height),
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

    // Update player position.
    player.x += move.x * tickrate * playerSpeed;
    player.y += move.y * tickrate * playerSpeed;

    // Wrap player around play space.
    player.x = player.x < 0 ? width : player.x > width ? 0 : player.x;
    player.y = player.y < 0 ? height : player.y > height ? 0 : player.y;
  });

  socket.on('mouse', data => {
    const playerPos = Victor.fromObject(player);
    const clickPos = Victor.fromObject(data);
    // get normalised vector
    const bulletVec = playerPos.subtract(clickPos).normalize();
    // create a bullet, update its position in the movement loop
    state.bullets.push({
      x: player.x,
      y: player.y,
      xV: bulletVec.x,
      yV: bulletVec.y,
      lifespan: 10,
    })
  });
});

setInterval(function() {
  io.sockets.emit('state', state);
}, 1000 / 60);
