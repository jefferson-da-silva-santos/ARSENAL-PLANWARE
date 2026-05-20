import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import styles from './Login.module.scss'

// ─────────────────────────────────────────────────────────────
//  Benefícios exibidos no painel esquerdo
// ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: 'bx bx-calendar-check',
    title: 'Agenda inteligente',
    desc: 'Slots automáticos, sem conflito, com disponibilidade em tempo real.',
  },
  {
    icon: 'bx bx-bar-chart-alt-2',
    title: 'Financeiro completo',
    desc: 'Comissões, fechamento de caixa e faturamento por barbeiro.',
  },
  {
    icon: 'bx bxs-star',
    title: 'Fidelidade & assinaturas',
    desc: 'Retenha clientes com pontos, recompensas e planos recorrentes.',
  },
]

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Login() {
  const { login, logged } = useAuth()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => { emailRef.current?.focus() }, [])

  if (logged) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { toast.error('Informe o e-mail'); return }
    if (!password) { toast.error('Informe a senha'); return }

    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Credenciais inválidas'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* PAINEL ESQUERDO */}
      <div className={styles.left}>
        <div className={styles.diagonals} aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={styles.diagonal} />
          ))}
        </div>
        <div className={styles.radial} aria-hidden="true" />

        <div className={styles.leftInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark} aria-hidden="true">
              <i className="bx bxs-scissors" />
            </div>
            <span className={styles.logoName}>Navalha</span>
          </div>

          <div className={styles.headline}>
            <span className={styles.eyebrow}>Sistema de gestão</span>
            <h1 className={styles.headlineText}>
              O sistema que
              <br />
              <em className={styles.headlineAccent}>move</em>
              <br />
              sua barbearia.
            </h1>
            <p className={styles.headlineSub}>
              Agenda, financeiro, equipe e clientes em um único lugar.
            </p>
          </div>

          <ul className={styles.features} role="list">
            {FEATURES.map((f, i) => (
              <li
                key={i}
                className={styles.feature}
                style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              >
                <div className={styles.featureIcon} aria-hidden="true">
                  <i className={f.icon} />
                </div>
                <div className={styles.featureText}>
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <p className={styles.leftFooter}>
            © {new Date().getFullYear()} Navalha · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* PAINEL DIREITO */}
      <div className={styles.right}>
        <div className={styles.formWrap}>

          <div className={styles.mobileLogoRow} aria-hidden="true">
            <div className={styles.mobileLogoMark}>
              <i className="bx bxs-scissors" />
            </div>
            <span className={styles.mobileLogoName}>Navalha</span>
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Bem-vindo de volta</h2>
            <p className={styles.formSub}>
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de login"
          >
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                E-mail
              </label>
              <div className={styles.inputWrap}>
                <i className={`bx bx-envelope ${styles.inputIcon}`} aria-hidden="true" />
                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={loading}
                  aria-required="true"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                Senha
              </label>
              <div className={styles.inputWrap}>
                <i className={`bx bx-lock-alt ${styles.inputIcon}`} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPaddedRight}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  aria-required="true"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <i className={`bx ${showPass ? 'bx-hide' : 'bx-show'}`} aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no painel</span>
                  <i className="bx bx-right-arrow-alt" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className={styles.formFooter}>
            Problemas de acesso? Fale com o administrador do sistema.
          </p>

        </div>
      </div>
    </div>
  )
}