const side = 320;
const cdn = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/';
const modelUrl = 'https://huggingface.co/tomjackson2023/rembg/resolve/cd3a3d6/u2netp.onnx';
const modelHash = '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8';
let model;

function progress(message) {
  self.postMessage({ type: 'progress', message });
}

async function loadModel() {
  if (model) return model;
  progress('İlk kullanım için arka plan modeli yükleniyor…');
  const responsePromise = fetch(modelUrl, { signal: AbortSignal.timeout(45000) });
  const buffer = await responsePromise.then(response => {
    if (!response.ok) throw new Error('Model download failed');
    return response.arrayBuffer();
  });
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  if (hash !== modelHash) throw new Error('Model checksum mismatch');
  if (!self.ort) importScripts(`${cdn}ort.wasm.min.js`);
  self.ort.env.wasm.wasmPaths = cdn;
  self.ort.env.wasm.numThreads = self.crossOriginIsolated ? 2 : 1;
  model = await self.ort.InferenceSession.create(buffer, { executionProviders: ['wasm'] });
  return model;
}

function smallImage(bitmap) {
  const canvas = new OffscreenCanvas(side, side);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, side, side);
  return ctx.getImageData(0, 0, side, side).data;
}

function flatMask(rgba) {
  const pixels = side * side;
  const border = [];
  for (let k = 0; k < side; k += 2) {
    border.push(k, (side - 1) * side + k, k * side, k * side + side - 1);
  }
  const [red, green, blue] = [0, 1, 2].map(channel => {
    const values = border.map(i => rgba[i * 4 + channel]).sort((a, b) => a - b);
    return values[values.length >> 1];
  });
  const distance = i => {
    const offset = i * 4;
    return Math.max(Math.abs(rgba[offset] - red), Math.abs(rgba[offset + 1] - green), Math.abs(rgba[offset + 2] - blue));
  };
  const similar = border.filter(i => rgba[i * 4 + 3] === 255 && distance(i) <= 10).length;
  if (similar / border.length < 0.97) return null;

  const mask = new Uint8ClampedArray(pixels);
  mask.fill(255);
  let foreground = 0;
  for (let i = 0; i < pixels; i++) {
    const gap = distance(i);
    mask[i] = (gap - 9) * 255 / 27;
    foreground += mask[i] > 128;
  }
  if (foreground < pixels * 0.015 || foreground > pixels * 0.91) return null;
  return mask;
}

async function prediction(rgba) {
  const session = await loadModel();
  progress('Arka plan siliniyor…');
  const pixels = side * side;
  const tensor = new Float32Array(3 * pixels);
  const means = [0.485, 0.456, 0.406];
  const deviations = [0.229, 0.224, 0.225];
  let max = 1;
  for (let i = 0; i < rgba.length; i += 4) max = Math.max(max, rgba[i], rgba[i + 1], rgba[i + 2]);
  for (let channel = 0; channel < 3; channel++) {
    for (let i = 0; i < pixels; i++) {
      tensor[channel * pixels + i] = (rgba[i * 4 + channel] / max - means[channel]) / deviations[channel];
    }
  }
  const outputName = session.outputNames[0];
  const results = await session.run({ [session.inputNames[0]]: new self.ort.Tensor('float32', tensor, [1, 3, side, side]) }, [outputName]);
  const values = results[outputName].data;
  let min = Infinity;
  let high = -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    high = Math.max(high, value);
  }
  if (high - min < 0.0001) throw new Error('No usable foreground');
  return Uint8ClampedArray.from(values, value => 255 * ((value - min) / (high - min) - 0.035) / 0.93);
}

async function exportImage(bitmap, mask) {
  const image = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = image.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const matte = new OffscreenCanvas(side, side);
  const matteCtx = matte.getContext('2d');
  const data = matteCtx.createImageData(side, side);
  for (let i = 0; i < mask.length; i++) data.data[i * 4 + 3] = mask[i];
  matteCtx.putImageData(data, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(matte, 0, 0, image.width, image.height);
  return image.convertToBlob({ type: 'image/png' });
}

self.onmessage = async ({ data: file }) => {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    self.postMessage({ type: 'error', message: 'Bu dosya açılamadı. Geçerli bir JPG, PNG veya WebP dosyası seç.' });
    return;
  }
  try {
    const { width, height } = bitmap;
    if (width > 12000 || height > 12000 || width * height > 36000000) {
      self.postMessage({ type: 'error', message: 'En fazla 36 megapiksel ve kenar başına 12.000 piksel desteklenir.' });
      return;
    }
    const rgba = smallImage(bitmap);
    const quick = flatMask(rgba);
    const alpha = quick || await prediction(rgba);
    progress('Şeffaf PNG hazırlanıyor…');
    const blob = await exportImage(bitmap, alpha);
    self.postMessage({ type: 'done', blob, width, height, fallback: Boolean(quick) });
  } catch {
    self.postMessage({ type: 'error', message: 'Görsel işlenemedi. Bağlantını kontrol edip tekrar dene.' });
  } finally {
    bitmap.close();
  }
};
