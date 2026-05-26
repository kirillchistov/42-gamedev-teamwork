# Настроить GitHub Action: автодеплой (9.5)

Связанные документы: [yacloud-deploy.md](yacloud-deploy.md) (ВМ и образы), [nginx-config.md](nginx-config.md) (прод перед Node), [forum-server-infra.md](forum-server-infra.md) (Docker).

---

## Цель

После пуша в целевую ветку автоматически:

1. Проверить код (lint, typecheck, tests) — **уже есть**.
2. Собрать Docker-образы **client** и **server**.
3. Опубликовать образы в registry.
4. (Опционально) обновить приложение на ВМ в Яндекс.Облаке без ручного SCP.

Ручной деплой по SCP заменяем пайплайном **CI + CD**.

---

## Что уже есть в репозитории

| Workflow | Файл | Триггер | Назначение |
|----------|------|---------|------------|
| **Lint** | [`.github/workflows/checks.yml`](../.github/workflows/checks.yml) | PR, push в `main` / `dev` | eslint, typecheck, tests |
| **GitHub Pages** | [`.github/workflows/gh-pages.yml`](../.github/workflows/gh-pages.yml) | push в `main`, `dev`, `sprint_*` | статика на Pages |
| **Build** | [`.github/workflows/build_and_push.yaml`](../.github/workflows/build_and_push.yaml) | push `main`, `dev`, `sprint_9` | образы client/server → GHCR |
| **Deploy** | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | после успешного build на `main`, `workflow_dispatch` | SSH → ВМ, `docker compose` prod |

**CI** — checks + Pages. **CD** — build + deploy.

---

## Рекомендуемая схема (как в материалах ЯП + наш стек)

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

Образы: [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) ('ghcr.io'), как в уроке про Облако.

---

## Настройки репозитория GitHub (один раз)

1. **Visibility** — для бесплатного pull образов из GHCR без токена на ВМ репозиторий часто делают **public** (или на ВМ логин в 'ghcr.io' с PAT).
2. **Settings → Actions → General → Workflow permissions** — **Read and write permissions** (чтобы 'GITHUB_TOKEN' мог пушить packages).

---

## Workflow 1: сборка и push образов

Файл: ['.github/workflows/build_and_push.yaml'](../.github/workflows/build_and_push.yaml)

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
            ghcr.io/${{ env.OWNER_LC }}/${{ github.event.repository.name }}/client:${{ github.sha }}
            ghcr.io/${{ env.OWNER_LC }}/${{ github.event.repository.name }}/client:latest

      - name: Build and push server
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile.server
          push: true
          tags: |
            ghcr.io/${{ env.OWNER_LC }}/${{ github.event.repository.name }}/server:${{ github.sha }}
            ghcr.io/${{ env.OWNER_LC }}/${{ github.event.repository.name }}/server:latest
```

После успешного run: **Packages** в репозитории → скопировать тег 'ghcr.io/<owner>/42-gamedev-teamwork/client:<sha>' для [yacloud-deploy.md](yacloud-deploy.md).

---

## Workflow 2: автодеплой на ВМ

Файл: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)

**Когда запускается**

- автоматически после успешного **Build and push** на ветке `main`;
- вручную: Actions → **Deploy to Yandex Cloud VM** → Run workflow (опционально указать `image_tag`).

**Секреты** (Settings → Secrets → Actions):

| Secret | Обязательно | Содержимое |
|--------|-------------|------------|
| `YC_VM_HOST` | да | публичный IP ВМ |
| `YC_VM_USER` | да | SSH-пользователь |
| `YC_VM_SSH_KEY` | да | приватный ключ PEM |
| `YC_DEPLOY_PATH` | нет | каталог на ВМ (по умолчанию `/opt/cosmic-match`) |
| `GHCR_TOKEN` | нет | PAT `read:packages`, если пакеты приватные |
| `GHCR_USER` | нет | GitHub username для `docker login` |

**Файлы в репозитории**

| Файл | Назначение |
|------|------------|
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | стек только из образов GHCR |
| [`scripts/deploy-on-vm.sh`](../scripts/deploy-on-vm.sh) | pull + up на сервере |
| [`deploy/vm/README.md`](../deploy/vm/README.md) | первичная настройка ВМ |

Первичная настройка сервера: [deploy/vm/README.md](../deploy/vm/README.md), облако: [yacloud-deploy.md](yacloud-deploy.md).

---

## Ветки и окружения

| Ветка | CI (checks) | CD (образы) | Куда деплоится |
|-------|-------------|-------------|----------------|
| 'dev' | да | опционально только build без deploy | — |
| 'main' | да | build + push; deploy — по решению команды | прод / демо ВМ |

Не смешивать с **gh-pages**: статика на Pages остаётся отдельным workflow, полный стек — только Docker + облако.

---

## Переменные окружения при деплое

На ВМ в '.env' (не в git):

- 'POSTGRES_*', 'SERVER_PORT', 'CLIENT_PORT' (внутри compose)
- 'PRAKTIKUM_API_URL=https://ya-praktikum.tech'
- **'VITE_YANDEX_OAUTH_REDIRECT_URI=https://<ваш-домен>'** — после смены URL прод (см. [project-yandex-oauth.md](project-yandex-oauth.md))

Пересборка client-образа нужна при изменении 'VITE_*' на этапе build (ARG в Dockerfile или env-file при 'docker build').

---

## Проверка готовности (9.5)

- [x] `build_and_push.yaml` — образы в GHCR.
- [x] `deploy.yml` — SSH-деплой + `docker-compose.prod.yml`.
- [ ] Секреты `YC_VM_*` заданы в GitHub.
- [ ] На ВМ: `.env`, сертификаты nginx, первый `workflow_dispatch` успешен.
- [ ] Сайт по `https://<домен>/` (см. [nginx-config.md](nginx-config.md)).

---

## Альтернативы (кратко)

| Вариант | Когда |
|---------|--------|
| Только GHCR + ручной 'docker compose' на ВМ | Минимум для сдачи облака (курс) |
| SSH deploy из Action | Полный автодеплой (9.5) |
| GitLab CI / Jenkins | Коммерческие проекты (курс) |

---

## Ссылки

- [GitHub Actions — Docker publish](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [Хабр: CI для новичков](https://habr.com/ru/articles/346380/) (упоминание в курсе)
- [yacloud-deploy.md](yacloud-deploy.md)
