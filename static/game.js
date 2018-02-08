const socket = io();

const canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;

const context = canvas.getContext('2d');

const movement = {
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
canvas.addEventListener('click', event => {
  const mouse = {
    x: event.offsetX,
    y: event.offsetY,
  };
  socket.emit('mouse', mouse);
});

socket.emit('new player');

setInterval(function() {
  socket.emit('loop', movement);
}, 1000 / 60);

socket.on('state', state => {
  context.clearRect(0, 0, 800, 600);

  // Draw bullets.
  state.bullets.forEach(bullet => {
    context.fillStyle = 'black';
    context.beginPath();
    context.arc(bullet.x, bullet.y, 2, 0, 2 * Math.PI);
    context.fill();
  });

  state.players.forEach(player => {
    // Draw player.
    context.fillStyle = player.fillStyle;
    context.beginPath();
    context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    context.fill();

    // Draw health bar.
    let healthWidth = player.health / 100 * 30;
    context.fillRect(player.x - 15, player.y - 20, healthWidth, 4);
    context.rect(player.x - 15, player.y - 20, 30, 4);
    context.stroke();
  });
});
