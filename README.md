# Paper Trails — v0.1 Prototype

**Every Book Has A Journey**

This is the first browser prototype for the Portland pilot.

## What works

- Landing page
- Release a Book form
- Unique Paper Trails IDs
- Book Passport modal
- QR code generation
- Journey page
- Local browser storage

## Run it

Open `index.html` in a browser.

The prototype uses a QR-code library from jsDelivr, so QR generation requires an internet connection.

## Important

This is intentionally a prototype. Books are stored in `localStorage`, so another person cannot yet see the same book from another device.

### Next build

1. Move books into Firestore.
2. Give each book a public URL.
3. Make QR scans work across devices.
4. Add "Add Your Chapter."
5. Generate a print-ready passport card.
