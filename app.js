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

function flip() {
  if (!deck.length) return;
  revealed = !revealed;
  byId('front').hidden = revealed;
  byId('back').hidden = !revealed;
}

function render() {
  const current = deck[position];
  revealed = true;
  flip();
  for (const [id, key] of [['quote', 'quote'], ['person', 'who'], ['book', 'book'], ['chapter', 'chapter']]) byId(id).textContent = current[key];
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
  render();
}

function next() {
  if (!deck.length) return;
  if (position + 1 === deck.length) shuffle();
  else { position++; render(); }
}

byId('card').addEventListener('click', flip);
byId('next').addEventListener('click', next);
document.addEventListener('keydown', event => {
  if (event.target.closest('select, input, textarea') || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.code === 'Space' && !event.target.closest('button, a')) { event.preventDefault(); flip(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
});

async function init() {
  try {
    const response = await fetch('./harry_potter_quotes.csv');
    if (!response.ok) throw new Error(`CSV request failed: ${response.status}`);
    quotes = parseCSV(await response.text());
    if (!quotes.length) throw new Error('The quote collection is empty.');
    shuffle();
    for (const id of ['card', 'next']) byId(id).disabled = false;
  } catch (error) {
    byId('quote').textContent = 'The quote collection could not be loaded.';
    byId('hint').textContent = 'Refresh to try again.';
    console.error(error);
  }
}
init();
