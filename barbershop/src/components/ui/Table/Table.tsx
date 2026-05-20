import type { ReactNode } from 'react'
import { SkeletonRow } from '../Skeleton/Skeleton'
import EmptyState from '../EmptyState/EmptyState'
import styles from './Table.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type Align = 'left' | 'center' | 'right'

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: Align
  render: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyDesc?: string
  emptyIcon?: string
  onRowClick?: (row: T) => void
  className?: string
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyTitle = 'Nenhum resultado',
  emptyDesc,
  emptyIcon = 'bx bx-search-alt',
  onRowClick,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          {/* Head */}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={styles[`align--${col.align ?? 'left'}`]}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {/* Loading — skeleton rows */}
            {loading && Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className={styles.skeletonRow}>
                <td colSpan={columns.length}>
                  <SkeletonRow cols={columns.length} />
                </td>
              </tr>
            ))}

            {/* Dados */}
            {!loading && data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`${styles.row} ${onRowClick ? styles['row--clickable'] : ''}`}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick
                  ? (e) => { if (e.key === 'Enter') onRowClick(row) }
                  : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={styles[`align--${col.align ?? 'left'}`]}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Estado vazio — fora da tabela para não quebrar o layout */}
      {!loading && data.length === 0 && (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDesc}
          size="sm"
        />
      )}
    </div>
  )
}