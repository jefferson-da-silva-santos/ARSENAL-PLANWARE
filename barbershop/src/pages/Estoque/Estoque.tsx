import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { useDebounce } from '../../hooks/useDebounce'
import { estoqueApi } from '../../services/estoqueApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonRow } from '../../components/ui/Skeleton/Skeleton'
import type { Produto, AlertaEstoque } from '../../types'
import styles from './Estoque.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────
//  Formulário de produto
// ─────────────────────────────────────────────────────────────

interface ProdutoFormProps {
  initial?: Partial<Produto>
  onSubmit: (d: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function ProdutoForm({ initial, onSubmit, onClose, saving }: ProdutoFormProps) {
  const [nome,           setNome]           = useState(initial?.nome           ?? '')
  const [categoria,      setCategoria]      = useState(initial?.categoria      ?? '')
  const [fornecedor,     setFornecedor]     = useState(initial?.fornecedor     ?? '')
  const [unidade,        setUnidade]        = useState(initial?.unidade        ?? 'un')
  const [precoUnitario,  setPrecoUnitario]  = useState(String(initial?.precoUnitario  ?? ''))
  const [quantidadeAtual,setQuantidadeAtual]= useState(String(initial?.quantidadeAtual ?? '0'))
  const [quantidadeMin,  setQuantidadeMin]  = useState(String(initial?.quantidadeMin   ?? '5'))
  const [validade,       setValidade]       = useState(initial?.validade       ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      nome,
      categoria     : categoria      || undefined,
      fornecedor    : fornecedor     || undefined,
      unidade       : unidade        || 'un',
      precoUnitario : precoUnitario  ? parseFloat(precoUnitario)   : undefined,
      quantidadeAtual: parseInt(quantidadeAtual),
      quantidadeMin : parseInt(quantidadeMin),
      validade      : validade       || undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Nome <span className={styles.req}>*</span></label>
        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Pomada Modeladora" required disabled={saving} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Categoria</label>
          <input className={styles.input} value={categoria} onChange={e => setCategoria(e.target.value)}
            placeholder="pomada, navalha, shampoo..." disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Fornecedor</label>
          <input className={styles.input} value={fornecedor} onChange={e => setFornecedor(e.target.value)}
            placeholder="Nome do fornecedor" disabled={saving} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Unidade</label>
          <select className={styles.select} value={unidade} onChange={e => setUnidade(e.target.value)} disabled={saving}>
            {['un', 'kg', 'g', 'L', 'mL', 'cx', 'pct'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Preço unitário (R$)</label>
          <input className={styles.input} type="number" min="0" step="0.01"
            value={precoUnitario} onChange={e => setPrecoUnitario(e.target.value)}
            placeholder="0,00" disabled={saving} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Qtd. atual</label>
          <input className={styles.input} type="number" min="0"
            value={quantidadeAtual} onChange={e => setQuantidadeAtual(e.target.value)}
            disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Estoque mínimo</label>
          <input className={styles.input} type="number" min="0"
            value={quantidadeMin} onChange={e => setQuantidadeMin(e.target.value)}
            disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Validade</label>
          <input className={styles.input} type="date" value={validade}
            onChange={e => setValidade(e.target.value)} disabled={saving} />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>
          {initial ? 'Salvar' : 'Cadastrar produto'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Modal de movimentação
// ─────────────────────────────────────────────────────────────

interface MovFormProps {
  produto : Produto
  onSubmit: (d: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function MovForm({ produto: p, onSubmit, onClose, saving }: MovFormProps) {
  const [tipo,       setTipo]       = useState<'ENTRADA'|'SAIDA'|'AJUSTE'>('ENTRADA')
  const [quantidade, setQuantidade] = useState('')
  const [motivo,     setMotivo]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ tipo, quantidade: parseInt(quantidade), motivo: motivo || undefined })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.movInfo}>
        <i className="bx bx-package" />
        <div>
          <strong>{p.nome}</strong>
          <span>Estoque atual: <b>{p.quantidadeAtual} {p.unidade}</b></span>
        </div>
      </div>

      <div className={styles.tipoGrid}>
        {(['ENTRADA','SAIDA','AJUSTE'] as const).map(t => (
          <button key={t} type="button"
            className={`${styles.tipoBtn} ${tipo === t ? styles[`tipoBtn--${t.toLowerCase()}`] : ''}`}
            onClick={() => setTipo(t)} disabled={saving}>
            <i className={t === 'ENTRADA' ? 'bx bx-plus-circle' : t === 'SAIDA' ? 'bx bx-minus-circle' : 'bx bx-transfer'} />
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>
            {tipo === 'AJUSTE' ? 'Nova quantidade' : 'Quantidade'} <span className={styles.req}>*</span>
          </label>
          <input className={styles.input} type="number" min="1"
            value={quantidade} onChange={e => setQuantidade(e.target.value)}
            required disabled={saving} placeholder="0" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Motivo</label>
          <input className={styles.input} value={motivo} onChange={e => setMotivo(e.target.value)}
            placeholder="Opcional" disabled={saving} />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>Registrar</Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

type TabEstoque = 'todos' | 'alertas'

export default function Estoque() {
  const toast = useToast()

  const [produtos,  setProdutos]  = useState<Produto[]>([])
  const [alertas,   setAlertas]   = useState<AlertaEstoque[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [tab,       setTab]       = useState<TabEstoque>('todos')

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<Produto | undefined>()
  const [saving,      setSaving]      = useState(false)

  const [movProduto,  setMovProduto]  = useState<Produto | null>(null)
  const [movOpen,     setMovOpen]     = useState(false)
  const [movSaving,   setMovSaving]   = useState(false)

  const debounced = useDebounce(search, 300)
  useAOSRefresh(produtos.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, a] = await Promise.all([estoqueApi.list(), estoqueApi.alertas()])
      setProdutos(p.data.data)
      setAlertas(a.data.data)
    } catch { toast.error('Erro ao carregar estoque') }
    finally  { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [])

  async function handleSave(data: Record<string, any>) {
    setSaving(true)
    try {
      if (editTarget) { await estoqueApi.update(editTarget.id, data as any); toast.success('Produto atualizado') }
      else            { await estoqueApi.create(data as any); toast.success('Produto cadastrado!') }
      setModalOpen(false); setEditTarget(undefined); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro ao salvar') }
    finally { setSaving(false) }
  }

  async function handleMov(data: Record<string, any>) {
    if (!movProduto) return
    setMovSaving(true)
    try {
      await estoqueApi.registrarMovimentacao(movProduto.id, data as any)
      toast.success('Movimentação registrada!')
      setMovOpen(false); setMovProduto(null); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setMovSaving(false) }
  }

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(debounced.toLowerCase()) ||
    (p.categoria ?? '').toLowerCase().includes(debounced.toLowerCase())
  )

  const displayList = tab === 'alertas' ? alertas : filtered
  const valorTotal  = produtos.reduce((s, p) => s + p.precoUnitario * p.quantidadeAtual, 0)

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Gestão"
        title="Estoque"
        subtitle={`${produtos.length} produtos cadastrados`}
        actions={
          <Button variant="primary" icon="bx bx-plus"
            onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
            Novo produto
          </Button>
        }
      />

      <div className={styles.body}>
        {/* ── KPI Row ───────────────────────────── */}
        <div className={styles.kpiRow}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard label="Total de produtos" value={produtos.length} icon="bx bx-package" aosDelay={0} />
              <StatCard label="Valor em estoque" value={fmt(valorTotal)} icon="bx bx-wallet-alt" aosDelay={60} />
              <StatCard
                label="Alertas de estoque"
                value={alertas.length}
                icon="bx bx-error"
                variant={alertas.length > 0 ? 'danger' : 'light'}
                sub={alertas.length > 0 ? 'produtos abaixo do mínimo' : 'Tudo ok'}
                aosDelay={120}
              />
            </>
          )}
        </div>

        {/* ── Toolbar ───────────────────────────── */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'todos'   ? styles['tab--active'] : ''}`} onClick={() => setTab('todos')}>
              Todos os produtos
            </button>
            <button className={`${styles.tab} ${tab === 'alertas' ? styles['tab--active'] : ''}`} onClick={() => setTab('alertas')}>
              Alertas
              {alertas.length > 0 && <span className={styles.alertBadge}>{alertas.length}</span>}
            </button>
          </div>

          {tab === 'todos' && (
            <div className={styles.searchWrap}>
              <i className="bx bx-search" />
              <input className={styles.searchInput} value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto ou categoria..." />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')}>
                  <i className="bx bx-x" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Tabela ────────────────────────────── */}
        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
            </div>
          ) : displayList.length === 0 ? (
            <EmptyState
              icon={tab === 'alertas' ? 'bx bx-check-circle' : 'bx bx-package'}
              title={tab === 'alertas' ? 'Sem alertas' : 'Nenhum produto encontrado'}
              description={tab === 'alertas' ? 'Todo o estoque está dentro do mínimo.' : 'Cadastre produtos para gerenciar o estoque.'}
              action={tab === 'todos' ? { label: 'Cadastrar produto', icon: 'bx bx-plus', onClick: () => setModalOpen(true) } : undefined}
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th className={styles.alignCenter}>Qtd. atual</th>
                    <th className={styles.alignCenter}>Mín.</th>
                    <th className={styles.alignRight}>Preço unit.</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayList.map((item: any, i: number) => {
                    const p = tab === 'alertas'
                      ? produtos.find(pr => pr.id === item.id) ?? item
                      : item as Produto
                    const critico = p.quantidadeAtual === 0
                    const baixo   = p.quantidadeAtual <= p.quantidadeMin && p.quantidadeAtual > 0

                    return (
                      <tr key={p.id} className={critico ? styles.rowCritico : baixo ? styles.rowBaixo : ''}>
                        <td>
                          <div className={styles.prodNome}>
                            <span>{p.nome}</span>
                            {p.validade && <span className={styles.validade}>Val: {p.validade}</span>}
                          </div>
                        </td>
                        <td><span className={styles.categoria}>{p.categoria ?? '—'}</span></td>
                        <td className={styles.alignCenter}>
                          <span className={`${styles.qtd} ${critico ? styles.qtdCritico : baixo ? styles.qtdBaixo : ''}`}>
                            {p.quantidadeAtual} {p.unidade}
                          </span>
                        </td>
                        <td className={styles.alignCenter}>
                          <span className={styles.qtdMin}>{p.quantidadeMin} {p.unidade}</span>
                        </td>
                        <td className={styles.alignRight}>
                          <span className={styles.preco}>{fmt(p.precoUnitario)}</span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.actionBtn}
                              onClick={() => { setMovProduto(p); setMovOpen(true) }}
                              title="Registrar movimentação">
                              <i className="bx bx-transfer" />
                            </button>
                            <button className={styles.actionBtn}
                              onClick={() => { setEditTarget(p); setModalOpen(true) }}
                              title="Editar">
                              <i className="bx bx-edit" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
        title={editTarget ? `Editar — ${editTarget.nome}` : 'Novo produto'} size="md">
        <ProdutoForm initial={editTarget} onSubmit={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined) }} saving={saving} />
      </Modal>

      <Modal open={movOpen} onClose={() => { setMovOpen(false); setMovProduto(null) }}
        title="Registrar movimentação" size="sm">
        {movProduto && (
          <MovForm produto={movProduto} onSubmit={handleMov}
            onClose={() => { setMovOpen(false); setMovProduto(null) }} saving={movSaving} />
        )}
      </Modal>
    </div>
  )
}