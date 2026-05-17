# Generated Slide Decks

Decks are generated — do not edit `.md` files here by hand. Edit `slides_db.js` then run:

    npm run build:slides

This writes `slides/zh/<id>.md`, `slides/en/<id>.md`, and `slides_rendered.js`.

## Convert to PDF / HTML / PPTX

    npx marp --pdf  --allow-local-files slides/zh/stack-array.md
    npx marp --html --allow-local-files slides/zh/stack-array.md
    npx marp --pptx --allow-local-files slides/zh/stack-array.md

Or convert a whole language folder with `npm run slides:pdf`.
