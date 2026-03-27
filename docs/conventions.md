# Конвенции код‑стайла и нейминга

## 1. Именование файлов и сущностей

- Файлы React‑компонентов: `PascalCase.tsx` (`LandingPage.tsx`).
- Файлы модулей/утилит: `kebab-case.ts` (`match-3-logic.ts`).
- Компоненты: `PascalCase`.
- Функции, переменные: `camelCase`.
- Константы: `SCREAMING_SNAKE_CASE` (только глобальные/конфигурационные).

## 2. Структура клиентских модулей

- `pages/` — страницы, привязанные к роутам.
- `features/` — бизнес‑фичи (игра, форум, лидерборд).
- `widgets/` — композиции нескольких фич/компонентов (header, layout, etc.).
- `shared/`:
  - `ui/` — переиспользуемые UI‑компоненты.
  - `api/` — клиентская логика API.
  - `lib/` — хелперы, hooks, утилиты.
  - `styles/` — общие стили (pcss).

## 3. CSS / PCSS

- Используем PostCSS (`.pcss`).
- Базовый reset: `normalize.pcss`.
- Глобальный базовый стиль: `base.pcss`.
- Тематические стили лендинга: `landing.pcss`.

Именование классов — BEM‑подобное:

- Блок: `.landing-header`
- Элемент: `.landing-header__inner`
- Модификатор: `.landing-header--dark`, `.landing--dark-neon`.

Не используем вложенность более чем на 2–3 уровня.

## 4. TS/React

- Строгий TypeScript (no implicit any).
- Функциональные компоненты + hooks.
- Не использовать default‑export для React‑компонентов (всегда `export const ...`).

## 5. Git / PR‑флоу

- Ветки:
  - feature: `feature/<short-name>`
  - fix: `fix/<short-name>`
- Коммиты — осмысленные, на английском (`feat: add match-3 core`, `fix: adjust dark theme contrast`).
- PR:
  - краткое описание; если есть, ссылка на задачу.
  - чек‑лист: lint, тесты, сборка.