var socket = io();

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
};
document.addEventListener('keydown', event => {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', event => {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});
document.addEventListener('click', event => {
  const mouse = {
    x: event.x,
    y: event.y,
  };
  socket.emit('mouse', mouse);
});

socket.emit('new player');

setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

const canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;

const context = canvas.getContext('2d');

socket.on('state', state => {
  context.clearRect(0, 0, 800, 600);

  state.players.forEach(player => {
    context.fillStyle = player.fillStyle;
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.fill();
  });

});
