// .env.local 의 값을 환경변수로 넘겨 `vercel dev` 를 실행한다. (npm run dev:api)
// 최신 vercel dev 는 .env.local 대신 Vercel 클라우드의 환경변수를 읽기 때문에, 로컬 값으로 바로 시험할 때 쓴다.
import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

const env = { ...process.env }
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (m && m[2] !== '') env[m[1]] = m[2]
}

spawn('npx', ['vercel', 'dev', '--listen', '3000', '--yes'], { stdio: 'inherit', shell: true, env })
