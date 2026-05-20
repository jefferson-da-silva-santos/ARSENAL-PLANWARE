import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
import styles from './Sidebar.module.scss'

// ─────────────────────────────────────────────────────────────
//  Navegação — estrutura completa
// ─────────────────────────────────────────────────────────────

interface NavItem {
  to: string
  icon: string
  label: string
  section?: string   // separador de seção acima do item
}

const NAV: NavItem[] = [
  { to: '/dashboard', icon: 'bx bxs-dashboard', label: 'Dashboard', section: 'OPERAÇÃO' },
  { to: '/agenda', icon: 'bx bx-calendar', label: 'Agenda' },
  { to: '/fila', icon: 'bx bx-list-ul', label: 'Fila' },
  { to: '/barbeiros', icon: 'bx bx-user', label: 'Barbeiros', section: 'EQUIPE' },
  { to: '/servicos', icon: 'bx bxs-scissors', label: 'Serviços' },
  { to: '/clientes', icon: 'bx bx-group', label: 'Clientes', section: 'CLIENTES' },
  { to: '/assinaturas', icon: 'bx bx-repeat', label: 'Assinaturas' },
  { to: '/fidelidade', icon: 'bx bxs-star', label: 'Fidelidade' },
  { to: '/estoque', icon: 'bx bx-package', label: 'Estoque', section: 'GESTÃO' },
  { to: '/financeiro', icon: 'bx bx-wallet-alt', label: 'Financeiro' },
  { to: '/configuracoes', icon: 'bx bx-cog', label: 'Configurações' },
]

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const gradient = user ? getAvatarGradient(user.name) : ''
  const initials = user ? getInitials(user.name) : '?'

  // Fecha o drawer mobile ao trocar de rota
  useEffect(() => {
    onMobileClose()
  }, [location.pathname, onMobileClose])

  // ESC fecha o drawer
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen, onMobileClose])

  // Trava scroll do body quando drawer mobile aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles['sidebar--open'] : ''}`}
        aria-label="Menu de navegação"
      >
        {/* ── Brand ─────────────────────────────────────── */}
        <div className={styles.brand}>
          <div className={styles.brandLogo} aria-hidden="true">
            <i className="bx bxs-scissors" />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandName}>Navalha</span>
            <span className={styles.brandSub}>Sistema de Gestão</span>
          </div>

          {/* Botão fechar no mobile */}
          <button
            className={styles.closeBtn}
            onClick={onMobileClose}
            aria-label="Fechar menu"
          >
            <i className="bx bx-x" />
          </button>
        </div>

        {/* ── Nav ───────────────────────────────────────── */}
        <nav className={styles.nav} aria-label="Navegação principal">
          {NAV.map((item) => (
            <div key={item.to}>
              {/* Separador de seção */}
              {item.section && (
                <span className={styles.sectionLabel}>
                  {item.section}
                </span>
              )}

              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles['navItem--active'] : ''}`
                }
                aria-label={item.label}
              >
                <i className={`${item.icon} ${styles.navIcon}`} aria-hidden="true" />
                <span className={styles.navLabel}>{item.label}</span>

                {/* Indicador ativo */}
                <span className={styles.activeIndicator} aria-hidden="true" />
              </NavLink>
            </div>
          ))}
        </nav>

        {/* ── Spacer ────────────────────────────────────── */}
        <div className={styles.spacer} />

        {/* ── Footer do usuário ─────────────────────────── */}
        <div className={styles.footer}>
          <div className={styles.userCard}>
            {/* Avatar */}
            <div
              className={styles.avatar}
              style={{ background: gradient }}
              aria-hidden="true"
            >
              <span className={styles.initials}>{initials}</span>
            </div>

            {/* Info */}
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user?.name ?? 'Usuário'}
              </span>
              <span className={styles.userRole}>
                {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Administrador'}
              </span>
            </div>

            {/* Logout */}
            <button
              className={styles.logoutBtn}
              onClick={logout}
              title="Sair"
              aria-label="Sair do sistema"
            >
              <i className="bx bx-log-out" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}