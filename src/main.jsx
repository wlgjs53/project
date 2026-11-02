import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// ── 디자인 ───────────────────────────────────────────────
// Bootstrap 5 + Bootswatch 테마. 아래 'darkly' 한 단어만 바꾸면 앱 전체 디자인이 바뀝니다.
// 영등할망의 바람길은 밤하늘 분위기라 다크 테마(darkly)를 씁니다.
// 테마 미리보기: https://bootswatch.com
import 'bootswatch/dist/darkly/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'

import { router } from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
