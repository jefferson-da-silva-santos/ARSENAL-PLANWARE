import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { configApi } from '../../services/configApi'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import { SkeletonStatCard } from '../../components/ui/Skeleton/Skeleton'
import type { BarberConfig } from '../../types'
import styles from './Configuracoes.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

const SLOTS = [15, 20, 30, 45, 60]

// ─────────────────────────────────────────────────────────────
//  Seção de configurações (container visual)
// ─────────────────────────────────────────────────────────────

interface SectionProps {
  icon    : string
  title   : string
  subtitle: string
  children: React.ReactNode
  delay?  : number
}

function Section({ icon, title, subtitle, children, delay = 0 }: SectionProps) {
  return (
    <div className={styles.section} data-aos="fade-up" data-aos-delay={delay}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} aria-hidden="true">
          <i className={icon} />
        </div>
        <div>
          <h3 className={styles.sectionTitle}>{title}</h3>
          <p className={styles.sectionSub}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function Configuracoes() {
  const toast = useToast()

  const [config,   setConfig]   = useState<BarberConfig | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [dirty,    setDirty]    = useState(false)

  // Form state
  const [nomeFantasia,      setNomeFantasia]      = useState('')
  const [telefone,          setTelefone]          = useState('')
  const [endereco,          setEndereco]          = useState('')
  const [horarioAbertura,   setHorarioAbertura]   = useState('08:00')
  const [horarioFechamento, setHorarioFechamento] = useState('20:00')
  const [diasFuncionamento, setDiasFunc]          = useState<number[]>([1,2,3,4,5,6])
  const [intervaloSlot,     setIntervaloSlot]     = useState(30)
  const [limiteDiario,      setLimiteDiario]      = useState('')
  const [modoFila,          setModoFila]          = useState(false)
  const [pontosCorte,       setPontosCorte]       = useState('10')

  useAOSRefresh(loading)

  // ── Carrega config ────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await configApi.get()
      const c = r.data.data
      setConfig(c)
      setNomeFantasia(c.nomeFantasia      ?? '')
      setTelefone(c.telefone              ?? '')
      setEndereco(c.endereco              ?? '')
      setHorarioAbertura(c.horarioAbertura)
      setHorarioFechamento(c.horarioFechamento)
      setDiasFunc(c.diasFuncionamento)
      setIntervaloSlot(c.intervaloSlot)
      setLimiteDiario(c.limiteDiario != null ? String(c.limiteDiario) : '')
      setModoFila(c.modoFila)
      setPontosCorte(String(c.pontosCorte))
      setDirty(false)
    } catch {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [])

  // ── Toggle dia de funcionamento ───────────────────────────
  function toggleDia(dia: number) {
    setDiasFunc(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort()
    )
    setDirty(true)
  }

  // ── Salvar ────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      await configApi.upsert({
        nomeFantasia     : nomeFantasia.trim()      || undefined,
        telefone         : telefone.trim()          || undefined,
        endereco         : endereco.trim()          || undefined,
        horarioAbertura,
        horarioFechamento,
        diasFuncionamento,
        intervaloSlot,
        limiteDiario     : limiteDiario ? parseInt(limiteDiario) : null,
        modoFila,
        pontosCorte      : parseInt(pontosCorte) || 10,
      })
      toast.success('Configurações salvas!')
      setDirty(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function markDirty() { setDirty(true) }

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Sistema"
        title="Configurações"
        subtitle="Personalize o funcionamento da sua barbearia"
        actions={
          <Button
            variant="primary"
            icon="bx bx-save"
            loading={saving}
            disabled={!dirty}
            onClick={handleSave}
          >
            {dirty ? 'Salvar alterações' : 'Sem alterações'}
          </Button>
        }
      />

      {loading ? (
        <div className={styles.body}>
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        </div>
      ) : (
        <div className={styles.body}>

          {/* ── Identificação ──────────────────────── */}
          <Section
            icon="bx bx-store-alt"
            title="Identificação"
            subtitle="Nome, telefone e endereço da barbearia"
            delay={0}
          >
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Nome fantasia</label>
                <input
                  className={styles.input}
                  value={nomeFantasia}
                  onChange={e => { setNomeFantasia(e.target.value); markDirty() }}
                  placeholder="Barbearia do Zé"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Telefone</label>
                <input
                  className={styles.input}
                  value={telefone}
                  onChange={e => { setTelefone(e.target.value); markDirty() }}
                  placeholder="(11) 9 8421-7733"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Endereço</label>
              <input
                className={styles.input}
                value={endereco}
                onChange={e => { setEndereco(e.target.value); markDirty() }}
                placeholder="Rua das Navalhas, 22 — São Paulo, SP"
              />
            </div>
          </Section>

          {/* ── Horários ───────────────────────────── */}
          <Section
            icon="bx bx-time"
            title="Horários de funcionamento"
            subtitle="Defina quando a barbearia abre e fecha, e os dias de atendimento"
            delay={60}
          >
            {/* Dias da semana */}
            <div className={styles.field}>
              <label className={styles.label}>Dias de funcionamento</label>
              <div className={styles.diasGrid}>
                {DIAS_SEMANA.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    className={`${styles.diaBtn} ${diasFuncionamento.includes(d.value) ? styles['diaBtn--active'] : ''}`}
                    onClick={() => toggleDia(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Abertura e fechamento */}
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Abertura</label>
                <input
                  className={styles.input}
                  type="time"
                  value={horarioAbertura}
                  onChange={e => { setHorarioAbertura(e.target.value); markDirty() }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Fechamento</label>
                <input
                  className={styles.input}
                  type="time"
                  value={horarioFechamento}
                  onChange={e => { setHorarioFechamento(e.target.value); markDirty() }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Intervalo de slot</label>
                <div className={styles.slotGrid}>
                  {SLOTS.map(s => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.slotBtn} ${intervaloSlot === s ? styles['slotBtn--active'] : ''}`}
                      onClick={() => { setIntervaloSlot(s); markDirty() }}
                    >
                      {s}min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Limite diário */}
            <div className={styles.field} style={{ maxWidth: 240 }}>
              <label className={styles.label}>Limite de agendamentos por dia</label>
              <input
                className={styles.input}
                type="number"
                min="1"
                value={limiteDiario}
                onChange={e => { setLimiteDiario(e.target.value); markDirty() }}
                placeholder="Sem limite"
              />
              <span className={styles.fieldHint}>Deixe vazio para sem limite.</span>
            </div>
          </Section>

          {/* ── Fila presencial ────────────────────── */}
          <Section
            icon="bx bx-list-ul"
            title="Fila presencial"
            subtitle="Ative para gerenciar walk-ins em tempo real"
            delay={120}
          >
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Modo fila ativo</span>
                <span className={styles.toggleSub}>
                  {modoFila
                    ? 'Clientes podem entrar na fila e aguardar atendimento.'
                    : 'Fila desativada. Somente agendamentos com horário marcado.'}
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${modoFila ? styles['toggle--on'] : ''}`}
                onClick={() => { setModoFila(m => !m); markDirty() }}
                role="switch"
                aria-checked={modoFila}
                aria-label="Ativar modo fila"
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </Section>

          {/* ── Fidelidade ─────────────────────────── */}
          <Section
            icon="bx bxs-star"
            title="Programa de fidelidade"
            subtitle="Configure quantos pontos cada corte gera para o cliente"
            delay={180}
          >
            <div className={styles.field} style={{ maxWidth: 200 }}>
              <label className={styles.label}>Pontos por corte</label>
              <div className={styles.pontosWrap}>
                <i className="bx bxs-star" aria-hidden="true" />
                <input
                  className={`${styles.input} ${styles.inputPontos}`}
                  type="number"
                  min="0"
                  value={pontosCorte}
                  onChange={e => { setPontosCorte(e.target.value); markDirty() }}
                />
                <span className={styles.pontosSuffix}>pts / atendimento</span>
              </div>
              <span className={styles.fieldHint}>
                A cada atendimento concluído, o cliente recebe este valor em pontos.
              </span>
            </div>
          </Section>

          {/* ── Info do sistema ────────────────────── */}
          <Section
            icon="bx bx-info-circle"
            title="Informações do sistema"
            subtitle="Dados técnicos da sua conta"
            delay={240}
          >
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tenant ID</span>
                <span className={styles.infoVal}>{config?.tenantId ?? '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Criado em</span>
                <span className={styles.infoVal}>
                  {config?.createdAt
                    ? new Date(config.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Última atualização</span>
                <span className={styles.infoVal}>
                  {config?.updatedAt
                    ? new Date(config.updatedAt).toLocaleString('pt-BR', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </Section>

          {/* ── Botão fixo no mobile ───────────────── */}
          {dirty && (
            <div className={styles.stickyBar}>
              <span className={styles.stickyMsg}>
                <i className="bx bx-error-circle" aria-hidden="true" />
                Você tem alterações não salvas
              </span>
              <Button
                variant="primary"
                icon="bx bx-save"
                loading={saving}
                onClick={handleSave}
              >
                Salvar
              </Button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}