import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중에만: /api 요청을 `npm run dev:api`(vercel dev, 3000번)로 넘긴다. 배포(Vercel)에는 영향 없음
    proxy: { '/api': 'http://localhost:3000' },
  },
})
