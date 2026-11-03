// 배포 주소를 QR 코드 PNG 로 만든다. 실행: node scripts/make-qr.mjs  →  public/images/qr.png (배포 후 /images/qr.png 로도 열린다)
import QRCode from 'qrcode'
import { fileURLToPath } from 'node:url'

const SITE = 'https://project-red-gamma-91.vercel.app'
await QRCode.toFile(fileURLToPath(new URL('../public/images/qr.png', import.meta.url)), SITE, {
  width: 800, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#0b2a40', light: '#ffffff' },
})
console.log('QR 저장:', SITE)
