function shape(ctx, path, colors, bounds) {
  const gradient = ctx.createLinearGradient(...bounds);
  for (const [offset, color] of colors) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fill(new Path2D(path));
}

export function makeExample() {
  const original = document.createElement('canvas');
  const cutout = document.createElement('canvas');
  original.width = cutout.width = 760;
  original.height = cutout.height = 650;
  const ctx = cutout.getContext('2d');
  ctx.translate(380, 325);
  ctx.rotate(-0.2);
  ctx.translate(-380, -325);

  shape(ctx, 'M183 432 L176 320 C158 210 226 101 337 75 C435 52 541 107 579 210 C592 245 591 303 584 354 L557 446 L529 431 L551 331 C567 245 533 152 454 119 C391 93 321 104 266 154 C221 196 201 253 211 321 L220 422 Z', [[0,'#f4a059'],[.21,'#b54321'],[.44,'#ffb469'],[.66,'#f38342'],[.84,'#a62c14'],[1,'#e46531']], [176, 65, 588, 390]);
  shape(ctx, 'M195 370 L190 304 C183 204 244 114 339 94 C423 75 493 112 523 158 C462 109 392 100 327 125 C251 154 215 226 216 303 L220 365 Z', [[0,'#471b18'],[.44,'#70291e'],[.76,'#a5432b'],[1,'#381918']], [180, 323, 500, 100]);
  shape(ctx, 'M184 370 Q198 365 217 365 L237 434 L204 446 Z', [[0,'#ffb477'],[.46,'#a1371f'],[1,'#441a1b']], [184, 365, 235, 435]);
  shape(ctx, 'M548 366 L579 376 L565 443 L531 437 Z', [[0,'#a7351b'],[.5,'#f98749'],[1,'#632719']], [546, 410, 583, 390]);

  ctx.save();
  ctx.translate(225, 457);
  ctx.rotate(-0.28);
  shape(ctx, 'M-40 -87 Q-87 -70 -87 -8 Q-88 79 -37 101 L15 103 Q65 91 65 1 Q65 -73 20 -86 Z', [[0,'#8b2518'],[.28,'#e86f41'],[.56,'#ff9d5d'],[1,'#68231c']], [-85, 29, 66, 88]);
  shape(ctx, 'M-2 -85 C36 -100 80 -71 83 -5 C90 57 57 111 15 104 C-25 100 -42 63 -43 9 C-43 -40 -32 -72 -2 -85 Z', [[0,'#4c221f'],[.36,'#8e4a3b'],[.61,'#61302b'],[1,'#2c1518']], [-39,-73,65,107]);
  shape(ctx, 'M16 -59 C39 -63 59 -39 60 0 C62 46 42 77 18 77 C-5 76 -16 44 -17 6 C-18 -30 -4 -56 16 -59 Z', [[0,'#2a1819'],[.58,'#4d2724'],[1,'#784539']], [-19,-50,60,64]);
  ctx.restore();

  ctx.save();
  ctx.translate(543, 456);
  ctx.rotate(0.23);
  shape(ctx, 'M-17 -87 Q-68 -87 -75 -9 Q-84 91 -24 102 L25 105 L42 -87 Z', [[0,'#362024'],[.43,'#63312d'],[.82,'#9a4c3d'],[1,'#3b191a']], [-71,69,42,-64]);
  shape(ctx, 'M3 -91 C70 -108 94 -55 93 4 C91 62 65 103 31 105 C-8 108 -37 67 -38 16 C-39 -48 -22 -80 3 -91 Z', [[0,'#ffb47d'],[.22,'#fa8c50'],[.43,'#cf512c'],[.79,'#ff8c4f'],[1,'#812019']], [-36,-67,87,97]);
  shape(ctx, 'M25 -76 C66 -84 82 -43 81 9 C79 64 56 92 32 92 C2 94 -16 58 -16 10 C-15 -37 -2 -68 25 -76 Z', [[0,'#dd602f'],[.38,'#ffab6b'],[.75,'#f48246'],[1,'#bc4024']], [65,-67,-9,80]);
  ctx.strokeStyle = '#ffcc9b';
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.stroke(new Path2D('M24 -72 C56 -82 75 -48 77 -14'));
  ctx.restore();

  const background = original.getContext('2d');
  const light = background.createRadialGradient(245, 200, 25, 300, 280, 665);
  light.addColorStop(0, '#e1c7af');
  light.addColorStop(0.65, '#b89588');
  light.addColorStop(1, '#73565c');
  background.fillStyle = light;
  background.fillRect(0, 0, 760, 650);
  background.fillStyle = '#42262a60';
  background.filter = 'blur(22px)';
  background.beginPath();
  background.ellipse(383, 590, 235, 24, -0.09, 0, Math.PI * 2);
  background.fill();
  background.filter = 'none';
  background.drawImage(cutout, 0, 0);
  return { original, cutout };
}
