let wlSlider;

function setup() {
  createCanvas(1000, 260);
  textFont('sans-serif');

  wlSlider = createSlider(380, 780, 550, 1);
  wlSlider.position(80, 210);
  wlSlider.style('width', '840px');
}

function draw() {
  background(245);

  fill(0);
  noStroke();
  textSize(20);
  text("380 nm ～ 780 nm 可視光スペクトル", 30, 30);

  // スペクトル帯の表示領域
  let x0 = 50;
  let y0 = 60;
  let w = 900;
  let h = 80;

  // スペクトル描画
  for (let i = 0; i < w; i++) {
    let wl = map(i, 0, w - 1, 380, 780);
    let c = wavelengthToRGB(wl);
    stroke(c[0], c[1], c[2]);
    line(x0 + i, y0, x0 + i, y0 + h);
  }

  // 目盛り
  stroke(0);
  fill(0);
  textSize(12);
  for (let wl = 380; wl <= 780; wl += 50) {
    let x = map(wl, 380, 780, x0, x0 + w);
    line(x, y0 + h, x, y0 + h + 8);
    noStroke();
    textAlign(CENTER);
    text(wl, x, y0 + h + 22);
    stroke(0);
  }

  // 選択波長
  let selectedWl = wlSlider.value();
  let xSel = map(selectedWl, 380, 780, x0, x0 + w);
  let cSel = wavelengthToRGB(selectedWl);

  stroke(0);
  strokeWeight(2);
  line(xSel, y0 - 10, xSel, y0 + h + 10);
  strokeWeight(1);

  fill(cSel[0], cSel[1], cSel[2]);
  rect(420, 165, 160, 30);

  fill(0);
  noStroke();
  textAlign(LEFT);
  textSize(16);
  text("選択波長: " + selectedWl + " nm", 50, 185);

  textSize(14);
  text("対応色", 590, 185);
}

// 波長[nm] → RGB
function wavelengthToRGB(wavelength) {
  let R = 0, G = 0, B = 0;

  if (wavelength >= 380 && wavelength < 440) {
    R = -(wavelength - 440) / (440 - 380);
    G = 0;
    B = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    R = 0;
    G = (wavelength - 440) / (490 - 440);
    B = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    R = 0;
    G = 1;
    B = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    R = (wavelength - 510) / (580 - 510);
    G = 1;
    B = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    R = 1;
    G = -(wavelength - 645) / (645 - 580);
    B = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    R = 1;
    G = 0;
    B = 0;
  }

  // 端の暗さ補正
  let factor = 0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
    factor = 1.0;
  } else if (wavelength > 700 && wavelength <= 780) {
    factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
  } else {
    factor = 0.0;
  }

  let gamma = 0.8;
  let maxIntensity = 255;

  let r = R === 0 ? 0 : Math.round(maxIntensity * Math.pow(R * factor, gamma));
  let g = G === 0 ? 0 : Math.round(maxIntensity * Math.pow(G * factor, gamma));
  let b = B === 0 ? 0 : Math.round(maxIntensity * Math.pow(B * factor, gamma));

  return [r, g, b];
}