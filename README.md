# Google Pay UI Demo

A Next.js + TypeScript PWA based on the supplied Google Pay Community Figma light-mode kit. This is an independent prototype, not affiliated with Google. **All payments are simulated. No money is transferred.**

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` to generate the static website in `out/`; deploy that directory to an HTTPS static host. Camera access and PWA installation require HTTPS (localhost is also supported for development). The service worker registers in production, caches visited static resources, and supports reopening the app offline after the first visit.

## Implemented

- Figma-based mobile home screen with original locally bundled illustrations and icons, responsive desktop framing, Money and You screens, and a dark appearance option.
- Camera QR scanning with rear-camera preference, supported-device flashlight, camera-denied/no-camera messages, retry, and proper stream cleanup.
- QR image upload and manual UPI ID/payment-link entry. Decodes `pa`, `pn`, `am`, `tn`, `mc`, and `cu`; validates INR, amount limits, and duplicate fields. Encoded names are not bank-verified.
- Recipient review, amount and note, demo account selection, simulated success, unique demo-prefixed reference and transaction IDs, receipt details, text download/share, and local transaction history (last 100 records).
- Installable PWA manifest, icons, production service worker, reduced-motion support, keyboard-accessible dialogs, and stageshow's Swap component for payment-button feedback.

## Scope and verification

This is a payment-flow prototype, not a full clone of every screen in the Figma file. Loans, bill payments, bank transfers, rewards and other financial service tiles open explanatory demo dialogs. There is no bank integration, authentication, real payment initiation, UPI PIN collection, or verified beneficiary lookup. Sample contacts use demo addresses. Dark mode is an adaptation of the supplied light frames, not a verified copy of the kit's dark screens.

`npm test` covers real QR encoding/decoding, UPI parsing, invalid inputs, amount limits, unique IDs, and simulation labeling. `npm run typecheck` and `npm run build` validate the production source. The cloud preview relay failed to start, so live browser interaction, real-device camera behavior, image upload through the browser, offline recovery, and installation have not yet been verified on a device. Pixel-perfect parity across all screens is not claimed.

## Design sources

[Original Figma kit](https://www.figma.com/design/1oszplSVMZn0fhP6QKgj4U?node-id=116-2). Artwork and vectors are exported from the user-supplied file and bundled in `public/assets`; source-node mappings are in `design/asset-nodes.json`.

[Stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) supplies the retained Swap component and motion guidance. Its license and notices are included in `components/stageshow/`. No animation gate or recorded rehearsal is claimed; see `design/REHEARSAL.md`.

The `.openai/hosting.json` file is optional Sites hosting metadata and is not needed for other static hosts. No credentials or temporary Figma URLs are included in the application source.
