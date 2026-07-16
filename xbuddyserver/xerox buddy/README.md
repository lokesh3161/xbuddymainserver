# X Buddy — Xerox Buddy

Smart PDF printing web app with UPI payment.

## Setup Instructions

### 1. Install Node.js
Download from: https://nodejs.org (LTS version)

### 2. Install dependencies
```bash
npm install
```

### 3. Add your PhonePe QR Code
Place your QR code image at:
```
public/qr-code.png
```

### 4. Start development server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 5. Build for production
```bash
npm run build
```

## Pricing Logic
- Black & White: ₹2 per page
- Color: ₹5 per page
- Double Side: halves the effective page count
- Copies: multiplies the total

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- pdf.js (pdfjs-dist)
- react-dropzone
