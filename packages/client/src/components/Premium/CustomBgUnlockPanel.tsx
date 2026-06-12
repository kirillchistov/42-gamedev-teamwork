import React, { useRef, useState } from 'react'

import {
  isCustomBgUnlocked,
  PRICES,
  unlockCustomBg,
} from '../../game/monetization/economy'
import { useWallet } from '../../game/monetization/useWallet'
import {
  isAllowedArenaPhotoHref,
  setArenaCustomPhotoUrl,
} from '../../game/match3/match3ArenaBackground'
import { Button } from '../../shared/ui'

type CustomBgUnlockPanelProps = {
  urlDraft: string
  onUrlDraftChange: (value: string) => void
  onApplied?: (message: string) => void
}

export function CustomBgUnlockPanel({
  urlDraft,
  onUrlDraftChange,
  onApplied,
}: CustomBgUnlockPanelProps) {
  const { wallet, refresh } = useWallet()
  const [unlocked, setUnlocked] = useState(() => isCustomBgUnlocked())
  const fileRef = useRef<HTMLInputElement | null>(null)

  const tryUnlock = (currency: 'credits' | 'crystals') => {
    const res = unlockCustomBg(currency)
    if (!res.ok) {
      onApplied?.(res.reason)
      return
    }
    setUnlocked(true)
    refresh()
    onApplied?.('Загрузка своего фона разблокирована')
  }

  const applyUrl = () => {
    if (!unlocked) {
      onApplied?.('Сначала разблокируйте загрузку фона')
      return
    }
    const t = urlDraft.trim()
    if (!t) {
      onApplied?.('Введите URL или загрузите файл')
      return
    }
    const ok = setArenaCustomPhotoUrl(t)
    onApplied?.(
      ok
        ? 'Свой фон сохранён'
        : 'Некорректный адрес. Разрешены https://… или /icons/…'
    )
  }

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unlocked) {
      onApplied?.('Сначала разблокируйте загрузку фона')
      e.target.value = ''
      return
    }
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      onApplied?.('Нужен файл изображения')
      e.target.value = ''
      return
    }
    const objectUrl = URL.createObjectURL(file)
    if (!isAllowedArenaPhotoHref(objectUrl)) {
      onApplied?.('Не удалось использовать этот файл')
      e.target.value = ''
      return
    }
    onUrlDraftChange(objectUrl)
    setArenaCustomPhotoUrl(objectUrl)
    onApplied?.(`Файл «${file.name}» применён (хранится в сессии браузера)`)
    e.target.value = ''
  }

  return (
    <div className="premium-panel premium-custom-bg">
      <div className="premium-panel__header">
        <h3>Свой фон арены</h3>
        <span
          className={`premium-price-badge ${
            unlocked
              ? 'premium-price-badge--new'
              : 'premium-price-badge--premium'
          }`}>
          {unlocked ? 'Разблокировано' : 'Премиум'}
        </span>
      </div>
      {!unlocked ? (
        <>
          <p className="premium-muted">
            Разблокируйте загрузку URL или файла с устройства. Баланс:{' '}
            {wallet.credits} кр. · {wallet.crystals} крист.
          </p>
          <div className="premium-stack premium-stack--row">
            <Button variant="primary" onClick={() => tryUnlock('credits')}>
              {PRICES.customBg.credits} кредитов
            </Button>
            <Button variant="outline" onClick={() => tryUnlock('crystals')}>
              {PRICES.customBg.crystals} кристаллов
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="premium-muted">
            Вставьте ссылку или выберите картинку с устройства.
          </p>
          <div className="premium-custom-bg__row">
            <input
              type="url"
              value={urlDraft}
              placeholder="https://… или /icons/…"
              onChange={e => onUrlDraftChange(e.target.value)}
            />
            <Button variant="outline" onClick={applyUrl}>
              Применить URL
            </Button>
            <Button variant="flat" onClick={() => fileRef.current?.click()}>
              Файл…
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFilePick}
            />
          </div>
        </>
      )}
    </div>
  )
}
