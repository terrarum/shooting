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
const playerSize = 10;

const tickrate = 1/60;
const playerSpeed = 100;
const bulletSpeed = 100;

setInterval(() => {
  // Update bullet position.
  state.bullets.forEach(bullet => {
    bullet.x -= bullet.xV;
    bullet.y -= bullet.yV;
    bullet.life -= tickrate;
    bullet.life = _.clamp(bullet.life, 0, 10);

    // Constrain bullets to play area.
    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
      bullet.life = 0;
    }

    // Collision detection with players.
    const bulletPos = Victor.fromObject(bullet);
    state.players.forEach(player => {
      if (player.id === bullet.owner.id || bullet.life == 0) {
        return;
      }
      // Player pos should always be a Victor object already.
      const playerPos = Victor.fromObject(player);

      const distance = playerPos.distanceSq(bulletPos);
      if (distance < playerSize) {
        bullet.life = 0;
        player.health -= 10;
        player.health = _.clamp(player.health, 0, 100);
      }
    });

    // Kill bullets.
    if (bullet.life == 0) {
      state.bullets.splice(state.bullets.indexOf(bullet), 1);
    }
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
      fillStyle: randomcolor(),
      health: 100,
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

    // Lock player in play space.
    player.x = player.x < playerSize ? playerSize : player.x > width - playerSize ? width - playerSize : player.x;
    player.y = player.y < playerSize ? playerSize : player.y > height - playerSize ? height - playerSize : player.y;
  });

  socket.on('mouse', data => {
    const playerPos = Victor.fromObject(player);
    const clickPos = Victor.fromObject(data);
    // get normalised vector
    const bulletVec = playerPos.subtract(clickPos).normalize();
    // create a bullet, update its position in the movement loop
    const bullet = {
      x: player.x,
      y: player.y,
      xV: bulletVec.x * tickrate * bulletSpeed,
      yV: bulletVec.y * tickrate * bulletSpeed,
      life: 10,
      owner: player,
    };
    bullet.stepDistance = Victor.fromObject(bullet).length();
    state.bullets.push(bullet);
  });
});

setInterval(function() {
  io.sockets.emit('state', state);
}, 1000 / 60);
