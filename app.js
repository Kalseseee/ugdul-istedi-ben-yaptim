import { makeExample } from './example.js';

const find = id => document.getElementById(id);
const input = find('file');
const drop = find('drop');
const select = find('select');
const stage = find('stage');
const before = find('before');
const after = find('after');
const compare = find('compare');
const demo = find('demo');
const download = find('download');
const caption = find('caption');
const status = find('status');
const spinner = find('spinner');
const message = find('message');
const accepted = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxSize = 25 * 1024 * 1024;
const example = makeExample();
const originalExample = example.original.toDataURL('image/webp', 0.95);
const cutExample = example.cutout.toDataURL('image/webp', 0.95);
let worker;
let busy = false;
let currentName = '';
let originalUrl;
let resultUrl;

before.src = originalExample;
after.src = cutExample;

function say(text, { loading = false, error = false } = {}) {
  message.textContent = text;
  spinner.hidden = !loading;
  status.classList.toggle('error', error);
  status.hidden = false;
}

function setBusy(value) {
  busy = value;
  stage.classList.toggle('pending', value);
  stage.setAttribute('aria-busy', String(value));
  select.disabled = demo.disabled = value;
}

function split(value) {
  compare.value = value;
  stage.style.setProperty('--split', `${value}%`);
}

function receive(result) {
  if (result.type === 'progress') {
    if (busy) say(result.message, { loading: true });
    return;
  }
  if (result.type === 'error') {
    fail(result.message);
    return;
  }
  resultUrl = URL.createObjectURL(result.blob);
  after.src = resultUrl;
  download.hidden = false;
  caption.textContent = `${result.width} × ${result.height} px · Karşılaştırmak için çizgiyi sürükle`;
  setBusy(false);
  split(35);
  say(result.fallback ? 'Düz arka plan kaldırıldı.' : 'Arka plan kaldırıldı.');
}

function fail(text) {
  setBusy(false);
  stage.classList.add('pending');
  caption.textContent = 'Orijinal görsel';
  say(text || 'Görsel işlenemedi. Başka bir dosyayla tekrar dene.', { error: true });
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./worker.js', import.meta.url));
  worker.onmessage = ({ data }) => receive(data);
  worker.onerror = () => {
    worker.terminate();
    worker = undefined;
    fail('İşleme başlatılamadı. Tarayıcıyı güncelleyip tekrar dene.');
  };
  return worker;
}

function clearUrls() {
  if (originalUrl) URL.revokeObjectURL(originalUrl);
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  originalUrl = resultUrl = undefined;
  download.hidden = true;
}

function submit(file) {
  if (!file || busy) return;
  if (!accepted.has(file.type) && (file.type || !/\.(jpe?g|png|webp)$/i.test(file.name))) {
    say('JPG, PNG veya WebP formatında bir görsel seç.', { error: true });
    return;
  }
  if (file.size > maxSize || !file.size) {
    say('25 MB veya daha küçük, geçerli bir görsel seç.', { error: true });
    return;
  }
  clearUrls();
  currentName = file.name.replace(/\.[^.]+$/, '') || 'gorsel';
  originalUrl = URL.createObjectURL(file);
  before.src = originalUrl;
  caption.textContent = 'Görsel işleniyor…';
  setBusy(true);
  say('Görsel hazırlanıyor…', { loading: true });
  try {
    getWorker().postMessage(file);
  } catch {
    fail('Bu tarayıcı görsel işlemeyi başlatamadı.');
  }
}

select.addEventListener('click', () => input.click());
input.addEventListener('change', () => {
  submit(input.files[0]);
  input.value = '';
});
compare.addEventListener('input', () => split(compare.value));
download.addEventListener('click', () => {
  if (!resultUrl) return;
  const link = document.createElement('a');
  link.href = resultUrl;
  link.download = `${currentName}-arkaplansiz.png`;
  link.click();
});

demo.addEventListener('click', () => {
  clearUrls();
  currentName = 'ornek-gorsel';
  before.src = originalExample;
  setBusy(true);
  example.cutout.toBlob(blob => receive({ blob, width: 760, height: 650 }), 'image/png');
});

for (const event of ['dragenter', 'dragover']) {
  drop.addEventListener(event, e => {
    e.preventDefault();
    if (!busy) drop.classList.add('drag');
  });
}
drop.addEventListener('dragleave', e => {
  if (!drop.contains(e.relatedTarget)) drop.classList.remove('drag');
});
drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.classList.remove('drag');
  submit(e.dataTransfer.files[0]);
});
for (const event of ['dragover', 'drop']) {
  document.addEventListener(event, e => {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  });
}
document.addEventListener('paste', e => {
  const image = [...(e.clipboardData?.files || [])].find(file => accepted.has(file.type));
  if (image && !busy) {
    e.preventDefault();
    submit(image);
  }
});
