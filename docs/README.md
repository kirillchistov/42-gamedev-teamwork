# Документация по игре

Этот раздел описывает текущую архитектуру Match-3, игровые механики и план развития проекта.

## Быстрый старт (установка и запуск)
1. Убедитесь, что установлены 'node', 'yarn', 'docker' (по необходимости).
2. Из корня проекта выполните:
   - 'yarn bootstrap'
3. Для разработки:
   - 'yarn dev' - клиент + сервер;
   - 'yarn dev:client' - только клиент;
   - 'yarn dev:server' - только сервер.
4. Полезные команды:
   - 'yarn test'
   - 'yarn lint'
   - 'yarn build'

## Структура документов
- ['game-play.md'](./game-play.md) - сценарий и игровые механики.
- ['game-engine.md'](./game-engine.md) - устройство игрового движка и runtime API.
- ['project-structure.md'](./project-structure.md) - структура монорепозитория и зоны ответственности.
- ['game-visuals.md'](./game-visuals.md) - визуальный слой, Canvas API, иконки, VFX и оптимизация.
- ['project-roadmap.md'](./project-roadmap.md) - дорожная карта работ с учетом S7.

## Связанные материалы
- ['game-improvements-s7.md'](./game-improvements-s7.md) - требования и приоритеты ближайших улучшений.
- ['game-backlog.md'](https://github.com/users/kirillchistov/projects/5) - backlog / kanban проекта.
