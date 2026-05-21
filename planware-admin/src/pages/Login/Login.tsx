import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import styles from './Login.module.scss'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/')
  }

  return (
    <div className={styles.page}>
      {/* Theme toggle */}
      <button className={styles.themeBtn} onClick={toggleTheme} title="Alternar tema">
        <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'}`} />
      </button>

      {/* Decoração de fundo */}
      <div className={styles.bgDecor}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.grid} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <i className="bx bx-layer" />
          </div>
          <div>
            <h1 className={styles.logoTitle}>PlawareAdmin</h1>
            <p className={styles.logoSub}>Painel de administração</p>
          </div>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>E-mail</label>
            <div className={styles.inputWrap}>
              <i className="bx bx-envelope" />
              <input
                type="email"
                className={styles.input}
                placeholder="admin@planware.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Senha</label>
            <div className={styles.inputWrap}>
              <i className="bx bx-lock-alt" />
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
              >
                <i className={`bx ${showPass ? 'bx-hide' : 'bx-show'}`} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <span>Entrar</span>
                <i className="bx bx-right-arrow-alt" />
              </>
            )}
          </button>
        </form>

        <p className={styles.hint}>
          Acesso restrito a superadmins da plataforma
        </p>
      </div>
    </div>
  )
}