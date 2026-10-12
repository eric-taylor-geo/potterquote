'use strict';

// CSV supports quoted commas, escaped quotes, CRLF and multiline fields.
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; field = '';
    } else field += char;
  }
  if (quoted) throw new Error('Unclosed quoted field in CSV.');
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  const headers = rows.shift();
  if (!headers || ['quote', 'who', 'book', 'chapter'].some(key => !headers.includes(key))) throw new Error('Missing CSV columns.');
  return rows.map((values, index) => {
    const item = Object.fromEntries(headers.map((key, column) => [key, values[column]?.trim()]));
    if (['quote', 'who', 'book', 'chapter'].some(key => !item[key])) throw new Error(`Missing data on row ${index + 2}.`);
    return item;
  });
}

const byId = id => document.getElementById(id);
let quotes = [], deck = [], position = 0, revealed = false;
const history = [];
let historyPosition = -1;

function flip() {
  if (!deck.length) return;
  revealed = !revealed;
  byId('card').classList.toggle('is-flipped', revealed);
  byId('front').setAttribute('aria-hidden', String(revealed));
  byId('back').setAttribute('aria-hidden', String(!revealed));
}

function render() {
  const current = history[historyPosition];
  // Deal the next card face up without animating through its answer.
  const card = byId('card');
  card.classList.add('is-resetting');
  revealed = true;
  flip();
  for (const [id, key] of [['quote', 'quote'], ['person', 'who'], ['book', 'book'], ['chapter', 'chapter']]) byId(id).textContent = current[key];
  void card.offsetWidth;
  card.classList.remove('is-resetting');
}

function shuffle() {
  const previous = deck[position];
  deck = [...quotes];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  if (deck.length > 1 && deck[0] === previous) [deck[0], deck[1]] = [deck[1], deck[0]];
  position = 0;
}

function next() {
  if (!deck.length) return;
  if (historyPosition + 1 < history.length) {
    historyPosition++;
  } else {
    if (position + 1 === deck.length) shuffle();
    else position++;
    history.push(deck[position]);
    historyPosition++;
  }
  render();
}

function previous() {
  if (historyPosition <= 0) return;
  historyPosition--;
  render();
}

byId('card').addEventListener('click', flip);
byId('next').addEventListener('click', next);
document.addEventListener('keydown', event => {
  if (event.target.closest('select, input, textarea, [contenteditable]:not([contenteditable="false"])') || event.altKey || event.ctrlKey || event.metaKey) return;
  const action = event.code === 'Space' ? flip
    : event.key === 'Enter' || event.key === 'ArrowRight' ? next
    : event.key === 'Backspace' ? previous : null;
  if (!action) return;
  event.preventDefault();
  if (!event.repeat) action();
});

async function init() {
  try {
    const response = await fetch('./harry_potter_quotes.csv');
    if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
    quotes = parseCSV(await response.text());
    if (!quotes.length) throw new Error('The quote collection is empty.');
    shuffle();
    history.push(deck[position]);
    historyPosition = 0;
    render();
    for (const id of ['card', 'next']) byId(id).disabled = false;
  } catch (error) {
    byId('quote').textContent = 'The quote collection could not be loaded.';
    byId('hint').textContent = 'Refresh to try again.';
    console.error(error);
  }
}
init();
