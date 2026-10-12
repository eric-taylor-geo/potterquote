# Potter Quotes

A static flashcard page using all rows in `harry_potter_quotes.csv`. The quote appears first; click the card to see the person, book, and chapter. **next →** advances through a shuffled deck without repeats until the next round.

Keyboard: **Space** flips the card when the page or card has focus; **Right arrow** advances. Buttons also support normal Enter/Space activation.

## GitHub Pages

Commit and push `index.html`, `styles.css`, `app.js`, and `harry_potter_quotes.csv` to the repository. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select your branch and **/ (root)**, then save. No build step or dependencies are required. Relative asset paths work under a GitHub Pages repository URL.

## Update the collection

Edit the CSV, preserving the `quote,who,book,chapter` headers. Quote fields containing commas or newlines, and escape literal double quotes by doubling them. The page reads the CSV directly, so no data generation or rebuild is needed. Attribution is displayed exactly as supplied.

## Local preview

Run `python3 -m http.server 8000` in this folder and open `http://localhost:8000`. Opening the HTML directly as a `file://` URL will prevent CSV loading in most browsers.
