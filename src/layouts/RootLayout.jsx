import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Container, Nav, Navbar, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import { useAppStore } from '../store/useAppStore'

export default function RootLayout() {
  const toasts = useAppStore((s) => s.toasts)
  const nickname = useAppStore((s) => s.nickname)
  const isHome = useLocation().pathname === '/'   // 홈은 3D 전체 화면이라 컨테이너·푸터 없음

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar expand="md" className="app-nav" data-bs-theme="dark" collapseOnSelect sticky="top">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            <i className="bi bi-wind me-2" />영등할망의 바람길
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              {NAV_ITEMS.map((item) => (
                <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.to === '/'} eventKey={item.to}>
                  <i className={`bi bi-${item.icon} me-1`} />{item.label}
                </Nav.Link>
              ))}
            </Nav>
            {nickname && (
              <Navbar.Text><i className="bi bi-person-circle me-1" />{nickname}</Navbar.Text>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className={isHome ? 'flex-grow-1' : 'flex-grow-1 py-4'}>
        {isHome ? <Outlet /> : (
          <Container>
            <Outlet />   {/* ← 여기에 주소에 맞는 페이지가 들어갑니다 */}
          </Container>
        )}
      </main>

      {!isHome && (
        <footer className="py-3 border-top">
          <Container className="small text-muted">
            제주대 청년도약 부트캠프 1기 · 데이터 출처: 공공데이터포털 외
          </Container>
        </footer>
      )}

      {/* 스토어의 toast() 로 띄운 알림 */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant}>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>
  )
}
