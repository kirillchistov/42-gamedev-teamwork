# GitHub Action: автодеплой (задача 9.5)

Описание решения **«Настроить Action для автодеплоя»** для монорепозитория Cosmic Match (`42-gamedev-teamwork`).

Связанные документы: [yacloud-deploy.md](yacloud-deploy.md) (ВМ и образы), [nginx-config.md](nginx-config.md) (прод перед Node), [forum-server-infra.md](forum-server-infra.md) (Docker).

Материалы курса: раздел «CI/CD» и «Деплоим проект» в [NginX-courseware.txt](NginX-courseware.txt).

---

## Цель

После пуша в целевую ветку автоматически:

1. Проверить код (lint, typecheck, tests) — **уже есть**.
2. Собрать Docker-образы **client** и **server**.
3. Опубликовать образы в registry.
4. (Опционально) обновить приложение на ВМ в Яндекс.Облаке без ручного SCP.

Ручной деплой по SCP из курса заменяем пайплайном **CI + CD**.

---

## Что уже есть в репозитории

| Workflow | Файл | Триггер | Назначение |
|----------|------|---------|------------|
| **Lint** | [`.github/workflows/checks.yml`](../.github/workflows/checks.yml) | PR, push в `main` / `dev` | eslint, typecheck, server build, client/server tests, smoke-сборка GH Pages |
| **GitHub Pages** | [`.github/workflows/gh-pages.yml`](../.github/workflows/gh-pages.yml) | push в `main`, `dev`, `sprint_*` | Статика на Pages (без SSR, без форума на Node) |

Это **CI** (проверки). Для **CD** добавляется отдельный workflow — ниже.

---

## Рекомендуемая схема (как в курсе + наш стек)

```text
push main (или stable)
    │
    ├─► checks.yml (как сейчас)
    │
    └─► build_and_push.yml
            ├─ docker build Dockerfile.client → ghcr.io/.../client:<sha>
            ├─ docker build Dockerfile.server → ghcr.io/.../server:<sha>
            └─ (опционально) deploy.yml по SSH на ВМ → docker compose pull && up -d
```

Образы: [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) (`ghcr.io`), как в уроке про Облако.

---

## Настройки репозитория GitHub (один раз)

По [инструкции курса](NginX-courseware.txt) (раздел «Настройка репозитория»):

1. **Visibility** — для бесплатного pull образов из GHCR без токена на ВМ репозиторий часто делают **public** (или на ВМ логин в `ghcr.io` с PAT).
2. **Settings → Actions → General → Workflow permissions** — **Read and write permissions** (чтобы `GITHUB_TOKEN` мог пушить packages).

---

## Workflow 1: сборка и push образов

Файл (создать): `.github/workflows/build_and_push.yaml`

```yaml
name: Build and push Docker images

on:
  push:
    branches:
      - main
      # при необходимости: - stable

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Lowercase owner for GHCR
        run: echo "OWNER_LC=${GITHUB_REPOSITORY_OWNER,,}" >> "$GITHUB_ENV"

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push client
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile.client
          push: true
          tags: |
            ghcr.io/${{ env.OWNER_LC }}/42-gamedev-teamwork/client:${{ github.sha }}
            ghcr.io/${{ env.OWNER_LC }}/42-gamedev-teamwork/client:latest

      - name: Build and push server
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile.server
          push: true
          tags: |
            ghcr.io/${{ env.OWNER_LC }}/42-gamedev-teamwork/server:${{ github.sha }}
            ghcr.io/${{ env.OWNER_LC }}/42-gamedev-teamwork/server:latest
```

После успешного run: **Packages** в репозитории → скопировать тег `ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>` для [yacloud-deploy.md](yacloud-deploy.md).

---

## Workflow 2 (опционально): автодеплой на ВМ

Отдельный job или workflow `deploy.yml`, триггер — успешный `build_and_push` или `workflow_dispatch`.

**Секреты репозитория** (Settings → Secrets):

| Secret | Содержимое |
|--------|------------|
| `YC_VM_HOST` | Публичный IP ВМ (статический) |
| `YC_VM_USER` | Пользователь SSH (например `ubuntu` / `yc-user`) |
| `YC_VM_SSH_KEY` | Приватный ключ (публичный — на ВМ при создании) |
| `GHCR_TOKEN` | PAT с `read:packages`, если образы приватные |

**Шаги на ВМ** (скрипт по SSH):

```bash
cd /opt/cosmic-match   # каталог с docker-compose.prod.yml
export CLIENT_IMAGE=ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>
export SERVER_IMAGE=ghcr.io/<owner>/42-gamedev-teamwork/server:<sha>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
```

На ВМ лежит `docker-compose.prod.yml` с полями `image:` вместо `build:` (см. [yacloud-deploy.md](yacloud-deploy.md)).

Инструменты: [`appleboy/ssh-action`](https://github.com/appleboy/ssh-action) или `scp` + `ssh` в bash.

---

## Ветки и окружения

| Ветка | CI (checks) | CD (образы) | Куда деплоится |
|-------|-------------|-------------|----------------|
| `dev` | да | опционально только build без deploy | — |
| `main` | да | build + push; deploy — по решению команды | прод / демо ВМ |

Не смешивать с **gh-pages**: статика на Pages остаётся отдельным workflow, полный стек — только Docker + облако.

---

## Переменные окружения при деплое

На ВМ в `.env` (не в git):

- `POSTGRES_*`, `SERVER_PORT`, `CLIENT_PORT` (внутри compose)
- `PRAKTIKUM_API_URL=https://ya-praktikum.tech`
- **`VITE_YANDEX_OAUTH_REDIRECT_URI=https://<ваш-домен>`** — после смены URL прод (см. [project-yandex-oauth.md](project-yandex-oauth.md))

Пересборка client-образа нужна при изменении `VITE_*` на этапе build (ARG в Dockerfile или env-file при `docker build`).

---

## Проверка готовности (9.5)

- [ ] `checks.yml` зелёный на PR.
- [ ] `build_and_push.yaml` публикует два образа в GHCR.
- [ ] На ВМ после push (или ручного pull) поднимаются `client`, `server`, `postgres`, `migrate`.
- [ ] Сайт открывается по `https://<домен>/` (через nginx, [nginx-config.md](nginx-config.md)).
- [ ] В README или этом файле указаны ветка-триггер и список secrets.

---

## Альтернативы (кратко)

| Вариант | Когда |
|---------|--------|
| Только GHCR + ручной `docker compose` на ВМ | Минимум для сдачи облака (курс) |
| SSH deploy из Action | Полный автодеплой (9.5) |
| GitLab CI / Jenkins | Коммерческие проекты (курс) |

---

## Ссылки

- [GitHub Actions — Docker publish](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [Хабр: CI для новичков](https://habr.com/ru/articles/346380/) (упоминание в курсе)
- [yacloud-deploy.md](yacloud-deploy.md)
