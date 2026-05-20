import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import styles from './AppLayout.module.scss'

// ─────────────────────────────────────────────────────────────
//  Mapeamento rota → título da topbar mobile
// ─────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard'    : 'Dashboard',
  '/agenda'       : 'Agenda',
  '/fila'         : 'Fila',
  '/barbeiros'    : 'Barbeiros',
  '/servicos'     : 'Serviços',
  '/clientes'     : 'Clientes',
  '/assinaturas'  : 'Assinaturas',
  '/fidelidade'   : 'Fidelidade',
  '/estoque'      : 'Estoque',
  '/financeiro'   : 'Financeiro',
  '/configuracoes': 'Configurações',
}

function getPageTitle(pathname: string): string {
  // Tenta match exato primeiro, depois por prefixo
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  const prefix = Object.keys(PAGE_TITLES).find(
    (key) => key !== '/' && pathname.startsWith(key),
  )
  return prefix ? PAGE_TITLES[prefix] : 'Navalha'
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function AppLayout() {
  const location               = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const openMobile  = useCallback(() => setMobileOpen(true),  [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />

      {/* ── Área principal ──────────────────────────────── */}
      <div className={styles.main}>

        {/* Topbar mobile — só aparece em telas pequenas */}
        <header className={styles.topbarMobile} aria-label="Cabeçalho mobile">
          {/* Botão hamburguer */}
          <button
            className={styles.hamburger}
            onClick={openMobile}
            aria-label="Abrir menu de navegação"
            aria-expanded={mobileOpen}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>

          {/* Título da página atual */}
          <span className={styles.topbarTitle}>{pageTitle}</span>

          {/* Logo compacta */}
          <div className={styles.topbarLogo} aria-hidden="true">
            <i className="bx bxs-scissors" />
          </div>
        </header>

        {/* Conteúdo da página (renderizado pelo React Router) */}
        <main className={styles.content} id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}