# Receipt me

Turn text + a photo into a receipt-style "about me" card. Everything runs in the
browser; nothing is uploaded.

## Run locally

No build step. Serve the folder with any static server:

```bash
ruby server.rb 5178
```

Then open http://127.0.0.1:5178/index.html

(`python3 -m http.server` also works outside the sandboxed Claude environment.)

## Structure

- `index.html` — the whole app: start screen, printing animation, result + JPG download
- `server.rb` — tiny local static server (dev only)
- `.claude/launch.json` — preview config for Claude Code

## How it works

1. **Start** — add one photo (optional, square-cropped), pick a photo style
   (**Print** = Floyd–Steinberg dither / **ASCII** = character art), paste text.
2. **Text markup** — line 1 is the header. Then:
   - `# SECTION` — centered section header
   - `key :: value` — label with dotted leader + right-aligned value
   - `> line` — centered
   - `* line` — bold
   - blank line — divider
   - anything else — body text
3. **Printing** — receipt renders to canvas (384px wide logical, 3× for export)
   and slides out of the printer.
4. **Result** — download as `receipt-me.jpg`, or make another.

Generated per receipt (seeded from the text, so it's stable): receipt number,
served-by name, totals, card/auth lines, 1–3 promo panels (more when the text is
short), barcode, non-fiscal footer.

## Not done yet (planned)

- Migrate to Vite when the scope grows
- Crumpled-paper texture (currently: grain + soft edges only)
- Copy-to-clipboard for ASCII output
- Tune promo copy pool
