// 手描きスペクトル → CIE XYZ → sRGB 表示
// スマホ横向き対応：拡大・縮小・移動・固定ボタン付き

let wlMin = 380;
let wlMax = 780;
let N = 401;

let spectrum = [];
let whiteRef = [];

let baseW = 1120;
let baseH = 570;

let viewScale = 1;
let panX = 0;
let panY = 0;
let sizeLocked = false;

let graphX = 60;
let graphY = 60;
let graphW = 760;
let graphH = 420;

let whiteXYZ;
let xyzScale = 1;

let prevMouseInside = false;
let prevX, prevY;

let lastPanX, lastPanY;
let draggingPan = false;
let lastMouseX, lastMouseY;

let clearButton;
let zoomInButton;
let zoomOutButton;
let lockButton;
let resetButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");

  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";

  for (let i = 0; i < N; i++) {
    spectrum[i] = 0;
    whiteRef[i] = 0;
  }

  makeRGBLEDWhiteReference();
  whiteXYZ = spectrumToXYZ(whiteRef);
  xyzScale = 1.0 / whiteXYZ.Y;

  makeControlButtons();
  fitToScreen();
}

function draw() {
  background(245);

  push();
  translate(panX, panY);
  scale(viewScale);

  drawGraph();
  drawWhiteReference();
  drawSpectrumCurve();
  drawColorResult();
  drawInstructions();

  pop();
}

function makeControlButtons() {
  clearButton = createButton("クリア");
  zoomOutButton = createButton("小さく");
  zoomInButton = createButton("大きく");
  lockButton = createButton("サイズ固定");
  resetButton = createButton("全体表示");

  let buttons = [clearButton, zoomOutButton, zoomInButton, lockButton, resetButton];

  for (let b of buttons) {
    b.class("controlButton");
    b.touchStarted(() => false);
  }

  clearButton.mousePressed(clearSpectrum);

  zoomOutButton.mousePressed(() => {
    if (!sizeLocked) zoomAtCenter(0.9);
  });

  zoomInButton.mousePressed(() => {
    if (!sizeLocked) zoomAtCenter(1.1);
  });

  lockButton.mousePressed(toggleSizeLock);

  resetButton.mousePressed(() => {
    if (!sizeLocked) fitToScreen();
  });

  positionButtons();
}

function positionButtons() {
  let y = windowHeight - 46;
  let x = 12;

  clearButton.position(x, y);
  x += 76;

  zoomOutButton.position(x, y);
  x += 76;

  zoomInButton.position(x, y);
  x += 76;

  lockButton.position(x, y);
  x += 108;

  resetButton.position(x, y);
}

function fitToScreen() {
  let usableH = windowHeight - 56;
  viewScale = min(windowWidth / baseW, usableH / baseH);
  viewScale = constrain(viewScale, 0.35, 1.5);

  panX = (windowWidth - baseW * viewScale) / 2;
  panY = (usableH - baseH * viewScale) / 2;
}

function zoomAtCenter(rate) {
  let cx = windowWidth / 2;
  let cy = (windowHeight - 56) / 2;

  let worldX = (cx - panX) / viewScale;
  let worldY = (cy - panY) / viewScale;

  viewScale *= rate;
  viewScale = constrain(viewScale, 0.35, 2.5);

  panX = cx - worldX * viewScale;
  panY = cy - worldY * viewScale;
}

function toggleSizeLock() {
  sizeLocked = !sizeLocked;

  if (sizeLocked) {
    lockButton.html("固定解除");
  } else {
    lockButton.html("サイズ固定");
  }
}

function screenToWorld(x, y) {
  return {
    x: (x - panX) / viewScale,
    y: (y - panY) / viewScale
  };
}

function drawGraph() {
  fill(255);
  stroke(0);
  rect(graphX, graphY, graphW, graphH);

  noStroke();
  fill(0);
  textSize(14);
  text("波長 λ [nm]", graphX + graphW / 2 - 40, graphY + graphH + 45);
  text("強度", graphX - 45, graphY - 20);

  for (let wl = 400; wl <= 780; wl += 50) {
    let x = map(wl, wlMin, wlMax, graphX, graphX + graphW);
    stroke(225);
    line(x, graphY, x, graphY + graphH);

    noStroke();
    fill(0);
    text(wl, x - 15, graphY + graphH + 22);
  }

  for (let v = 0; v <= 1.0; v += 0.2) {
    let y = map(v, 0, 1, graphY + graphH, graphY);
    stroke(225);
    line(graphX, y, graphX + graphW, y);

    noStroke();
    fill(0);
    text(v.toFixed(1), graphX - 35, y + 5);
  }
}

function drawWhiteReference() {
  noFill();
  stroke(150);
  strokeWeight(2);
  drawingContext.setLineDash([8, 6]);

  beginShape();
  for (let i = 0; i < N; i++) {
    let wl = wlMin + i;
    let x = map(wl, wlMin, wlMax, graphX, graphX + graphW);
    let y = map(whiteRef[i], 0, 1, graphY + graphH, graphY);
    vertex(x, y);
  }
  endShape();

  drawingContext.setLineDash([]);
  strokeWeight(1);

  noStroke();
  fill(90);
  textSize(13);
  text("灰色点線：RGB LED 混合による白色スペクトル", graphX + 405, graphY + 22);
}

function drawSpectrumCurve() {
  noFill();
  stroke(20, 80, 220);
  strokeWeight(3);

  beginShape();
  for (let i = 0; i < N; i++) {
    let wl = wlMin + i;
    let x = map(wl, wlMin, wlMax, graphX, graphX + graphW);
    let y = map(spectrum[i], 0, 1, graphY + graphH, graphY);
    vertex(x, y);
  }
  endShape();

  strokeWeight(1);
}

function drawColorResult() {
  let rgb = spectrumToSRGB(spectrum);

  noStroke();
  fill(0);
  textSize(18);
  text("CIE XYZ → sRGB 表示色", 860, 80);

  fill(rgb.r, rgb.g, rgb.b);
  stroke(0);
  rect(860, 110, 190, 190);

  noStroke();
  fill(0);
  textSize(15);
  text("RGB = (" + round(rgb.r) + ", " + round(rgb.g) + ", " + round(rgb.b) + ")", 860, 330);
  text("CIE 1931 等色関数近似", 860, 365);
  text("XYZ→sRGB 変換", 860, 388);
  text("sRGB ガンマ補正込み", 860, 411);
  text("W キー：RGB LED 白色を入力", 860, 450);
  text("表示倍率：" + nf(viewScale, 1, 2), 860, 480);

  if (sizeLocked) {
    text("固定中：移動・拡大縮小なし", 860, 505);
  } else {
    text("固定解除中：背景ドラッグで移動", 860, 505);
  }
}

function drawInstructions() {
  noStroke();
  fill(0);
  textSize(14);
  text("グラフ内をドラッグ：スペクトルを描く", 60, 540);
  text("グラフ外をドラッグ：表示位置を移動", 330, 540);
}

function mousePressed() {
  let p = screenToWorld(mouseX, mouseY);

  let insideGraph =
    p.x >= graphX &&
    p.x <= graphX + graphW &&
    p.y >= graphY &&
    p.y <= graphY + graphH;

  if (!insideGraph && !sizeLocked) {
    draggingPan = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  prevMouseInside = false;
}

function mouseDragged() {
  let p = screenToWorld(mouseX, mouseY);

  let insideGraph =
    p.x >= graphX &&
    p.x <= graphX + graphW &&
    p.y >= graphY &&
    p.y <= graphY + graphH;

  if (insideGraph) {
    if (prevMouseInside) {
      drawSpectrumLine(prevX, prevY, p.x, p.y);
    } else {
      setSpectrumFromMouse(p.x, p.y);
    }

    prevX = p.x;
    prevY = p.y;
    prevMouseInside = true;
    draggingPan = false;
  } else if (draggingPan && !sizeLocked) {
    panX += mouseX - lastMouseX;
    panY += mouseY - lastMouseY;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    prevMouseInside = false;
  }
}

function mouseReleased() {
  prevMouseInside = false;
  draggingPan = false;
}

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  mouseDragged();
  return false;
}

function touchEnded() {
  mouseReleased();
  return false;
}

function drawSpectrumLine(x1, y1, x2, y2) {
  let steps = int(dist(x1, y1, x2, y2) / 2) + 1;

  for (let s = 0; s <= steps; s++) {
    let x = lerp(x1, x2, s / steps);
    let y = lerp(y1, y2, s / steps);
    setSpectrumFromMouse(x, y);
  }
}

function setSpectrumFromMouse(x, y) {
  let wl = map(x, graphX, graphX + graphW, wlMin, wlMax);
  let intensity = map(y, graphY + graphH, graphY, 0, 1);
  intensity = constrain(intensity, 0, 1);

  let index = round(wl - wlMin);
  index = constrain(index, 0, N - 1);

  for (let k = -3; k <= 3; k++) {
    let j = index + k;

    if (j >= 0 && j < N) {
      let weight = 1 - abs(k) / 4;
      spectrum[j] = max(spectrum[j], intensity * weight);
    }
  }
}

function keyPressed() {
  if (key === "c" || key === "C") {
    clearSpectrum();
  }

  if (key === "w" || key === "W") {
    for (let i = 0; i < N; i++) {
      spectrum[i] = whiteRef[i];
    }
  }
}

function clearSpectrum() {
  for (let i = 0; i < N; i++) {
    spectrum[i] = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  positionButtons();

  if (!sizeLocked) {
    fitToScreen();
  }
}

// RGB LED による白色基準スペクトル
function makeRGBLEDWhiteReference() {
  let red = [];
  let green = [];
  let blue = [];

  for (let i = 0; i < N; i++) {
    let wl = wlMin + i;

    blue[i] = gaussian(wl, 447, 16);
    green[i] = gaussian(wl, 540, 24);
    red[i] = gaussian(wl, 635, 20);
  }

  let XB = spectrumToXYZ(blue);
  let XG = spectrumToXYZ(green);
  let XR = spectrumToXYZ(red);

  let target = {
    X: 0.95047,
    Y: 1.00000,
    Z: 1.08883
  };

  let weights = solve3x3(
    XR.X, XG.X, XB.X,
    XR.Y, XG.Y, XB.Y,
    XR.Z, XG.Z, XB.Z,
    target.X, target.Y, target.Z
  );

  let wr = max(0, weights[0]);
  let wg = max(0, weights[1]);
  let wb = max(0, weights[2]);

  for (let i = 0; i < N; i++) {
    whiteRef[i] = wr * red[i] + wg * green[i] + wb * blue[i];
  }

  let m = max(whiteRef);

  for (let i = 0; i < N; i++) {
    whiteRef[i] = whiteRef[i] / m * 0.9;
  }
}

function gaussian(x, mu, sigma) {
  return exp(-sq(x - mu) / (2 * sigma * sigma));
}

function spectrumToXYZ(sp) {
  let X = 0;
  let Y = 0;
  let Z = 0;

  for (let i = 0; i < N; i++) {
    let wl = wlMin + i;
    let cmf = cie1931Approx(wl);

    X += sp[i] * cmf.x;
    Y += sp[i] * cmf.y;
    Z += sp[i] * cmf.z;
  }

  return { X: X, Y: Y, Z: Z };
}

function cie1931Approx(wl) {
  let x =
    1.056 * asymmetricGaussian(wl, 599.8, 37.9, 31.0) +
    0.362 * asymmetricGaussian(wl, 442.0, 16.0, 26.7) -
    0.065 * asymmetricGaussian(wl, 501.1, 20.4, 26.2);

  let y =
    0.821 * asymmetricGaussian(wl, 568.8, 46.9, 40.5) +
    0.286 * asymmetricGaussian(wl, 530.9, 16.3, 31.1);

  let z =
    1.217 * asymmetricGaussian(wl, 437.0, 11.8, 36.0) +
    0.681 * asymmetricGaussian(wl, 459.0, 26.0, 13.8);

  return {
    x: max(0, x),
    y: max(0, y),
    z: max(0, z)
  };
}

function asymmetricGaussian(wl, mu, sigma1, sigma2) {
  let sigma = wl < mu ? sigma1 : sigma2;
  return exp(-0.5 * sq((wl - mu) / sigma));
}

function spectrumToSRGB(sp) {
  let xyz = spectrumToXYZ(sp);

  let X = xyz.X * xyzScale;
  let Y = xyz.Y * xyzScale;
  let Z = xyz.Z * xyzScale;

  let rLin = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  let gLin = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  let bLin = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;

  rLin = max(0, rLin);
  gLin = max(0, gLin);
  bLin = max(0, bLin);

  let m = max(rLin, gLin, bLin);

  if (m > 1) {
    rLin /= m;
    gLin /= m;
    bLin /= m;
  }

  return {
    r: 255 * gammaCorrect(rLin),
    g: 255 * gammaCorrect(gLin),
    b: 255 * gammaCorrect(bLin)
  };
}

function gammaCorrect(c) {
  c = constrain(c, 0, 1);

  if (c <= 0.0031308) {
    return 12.92 * c;
  } else {
    return 1.055 * pow(c, 1 / 2.4) - 0.055;
  }
}

function solve3x3(
  a11, a12, a13,
  a21, a22, a23,
  a31, a32, a33,
  b1, b2, b3
) {
  let det =
    a11 * (a22 * a33 - a23 * a32) -
    a12 * (a21 * a33 - a23 * a31) +
    a13 * (a21 * a32 - a22 * a31);

  let dx =
    b1 * (a22 * a33 - a23 * a32) -
    a12 * (b2 * a33 - a23 * b3) +
    a13 * (b2 * a32 - a22 * b3);

  let dy =
    a11 * (b2 * a33 - a23 * b3) -
    b1 * (a21 * a33 - a23 * a31) +
    a13 * (a21 * b3 - b2 * a31);

  let dz =
    a11 * (a22 * b3 - b2 * a32) -
    a12 * (a21 * b3 - b2 * a31) +
    b1 * (a21 * a32 - a22 * a31);

  return [dx / det, dy / det, dz / det];
}
