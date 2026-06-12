import React, { useState } from 'react'

import {
  readFeatureRequests,
  submitFeatureRequest,
  type FeatureRequestCategory,
} from '../../game/monetization/economy'
import { Button } from '../../shared/ui'

const CATEGORY_OPTIONS: Array<{
  value: FeatureRequestCategory
  label: string
}> = [
  { value: 'field', label: 'Тип поля / сетка' },
  { value: 'tiles', label: 'Доп. фишки / бустеры' },
  { value: 'branding', label: 'Брендирование / косметика' },
  { value: 'other', label: 'Другое' },
]

type FeatureRequestFormProps = {
  onSubmitted?: (message: string) => void
}

export function FeatureRequestForm({ onSubmitted }: FeatureRequestFormProps) {
  const [category, setCategory] = useState<FeatureRequestCategory>('field')
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [budget, setBudget] = useState('')
  const [recent, setRecent] = useState(() => readFeatureRequests())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const entry = submitFeatureRequest({
        category,
        title,
        details,
        budgetCrystals: budget ? Number(budget) : undefined,
      })
      setRecent(readFeatureRequests())
      setTitle('')
      setDetails('')
      setBudget('')
      onSubmitted?.(`Заявка «${entry.title}» сохранена локально (демо)`)
    } catch (err) {
      onSubmitted?.(
        err instanceof Error ? err.message : 'Не удалось отправить заявку'
      )
    }
  }

  return (
    <section className="premium-card premium-feature-request">
      <div className="premium-card__header">
        <h2>Заказ новой фичи</h2>
        <span className="premium-chip">Демо-очередь</span>
      </div>
      <p className="premium-muted">
        Опишите идею: новый тип поля, фишки, брендирование. Заявки сохраняются в
        браузере до подключения бэкенда.
      </p>
      <form className="premium-feature-request__form" onSubmit={handleSubmit}>
        <label className="premium-feature-request__field">
          Категория
          <select
            value={category}
            onChange={e =>
              setCategory(e.target.value as FeatureRequestCategory)
            }>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="premium-feature-request__field">
          Название
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Например: поле 10×10 с льдом"
            maxLength={120}
          />
        </label>
        <label className="premium-feature-request__field">
          Описание
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={4}
            placeholder="Что должно появиться в игре и как это влияет на геймплей"
            maxLength={2000}
          />
        </label>
        <label className="premium-feature-request__field">
          Бюджет в кристаллах (необязательно)
          <input
            type="number"
            min={0}
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="120"
          />
        </label>
        <Button type="submit" variant="primary">
          Отправить заявку
        </Button>
      </form>
      {recent.length > 0 ? (
        <ul className="premium-offer-list premium-feature-request__list">
          {recent.slice(0, 5).map(item => (
            <li key={item.id} className="premium-offer-row">
              <div>
                <div>{item.title}</div>
                <div className="premium-soft-note">
                  {CATEGORY_OPTIONS.find(c => c.value === item.category)?.label}
                  {item.budgetCrystals
                    ? ` · ~${item.budgetCrystals} крист.`
                    : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
