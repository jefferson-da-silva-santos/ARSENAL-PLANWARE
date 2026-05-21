import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import styles from './Sidebar.module.scss'

const NAV_ITEMS = [
  { to: '/', icon: 'bx-home-alt-2', label: 'Dashboard' },
  { to: '/tenants', icon: 'bx-buildings', label: 'Tenants' },
  { to: '/users', icon: 'bx-group', label: 'Usuários' },
  { to: '/permissions', icon: 'bx-shield-alt-2', label: 'Permissões' },
  { to: '/errors', icon: 'bx-bug', label: 'Erros' },
  { to: '/feedbacks', icon: 'bx-message-square-detail', label: 'Feedbacks' },
  { to: '/financial', icon: 'bx-wallet-alt', label: 'Financeiro' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>
          <i className="bx bx-layer" />
        </span>
        <div className={styles.logoText}>
          <span className={styles.logoName}>Planware</span>
          <span className={styles.logoRole}>Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <i className={`bx ${item.icon}`} />
            <span>{item.label}</span>
            <span className={styles.navIndicator} />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
        >
          <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'}`} />
          <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </button>

        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Sair"
          >
            <i className="bx bx-log-out" />
          </button>
        </div>
      </div>
    </aside>
  )
}