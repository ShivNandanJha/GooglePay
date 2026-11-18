# Pay — UPI QR payments PWA

A mobile-first Next.js + TypeScript PWA with a modern payments UI: home, money, profile, QR scanner, pay flow and transaction details.

> **Disclaimer:** Personal design project. Not Google Pay and not affiliated with Google. No real money is transferred and the receipts it shows are not proof of payment.

## Run

```sh
npm ci
npm run dev      # http://localhost:3000
npm run build    # static export in out/
```

Camera access and PWA install need HTTPS (localhost works for development).

## Features

- Home, Money and You screens in the current UI style, set in Google Sans
- Edit profile: change your name and profile picture (stored only in this browser)
- Camera QR scanning, gallery QR upload, and manual UPI ID / `upi://pay` link entry
- Pay flow with amount, note and account choice; transaction details screen and local history (last 100)
- Light and dark themes, installable PWA with offline support

The disclaimer appears in the footer of every screen and inside each transaction record.

`npm test` covers QR decoding, UPI parsing, amount validation and transaction IDs.
