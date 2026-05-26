# Первичная настройка ВМ для автодеплоя

Выполните **один раз** на сервере в Яндекс.Облаке (по SSH).

## 1. Каталог проекта

```bash
sudo mkdir -p /opt/cosmic-match
sudo chown "$USER":"$USER" /opt/cosmic-match
cd /opt/cosmic-match
```

## 2. Файлы с репозитория

При первом деплое GitHub Actions скопирует `docker-compose.prod.yml`, `scripts/deploy-on-vm.sh` и `deploy/nginx/`.

Дополнительно создайте на ВМ `.env` (не в git), по образцу [`.env.sample`](../../.env.sample):

- `POSTGRES_PASSWORD` — надёжный пароль
- `SERVER_PORT`, `CLIENT_PORT`
- `NGINX_HTTP_PORT=80`, `NGINX_HTTPS_PORT=443`
- `VITE_YANDEX_OAUTH_REDIRECT_URI=https://<ваш-домен>` — после согласования с ментором

## 3. TLS для nginx

Сертификаты в `deploy/nginx/certs/` (Let's Encrypt или самоподписанные для теста).  
См. [nginx-config.md](../../docs/nginx-config.md) и [yacloud-deploy.md](../../docs/yacloud-deploy.md).

## 4. Секреты в GitHub

| Secret | Пример |
|--------|--------|
| `YC_VM_HOST` | `89.xxx.xxx.xxx` |
| `YC_VM_USER` | `ubuntu` |
| `YC_VM_SSH_KEY` | приватный ключ (PEM) |
| `YC_DEPLOY_PATH` | `/opt/cosmic-match` (опционально) |
| `GHCR_TOKEN` | PAT `read:packages`, если образы приватные |
| `GHCR_USER` | GitHub username (опционально) |

## 5. Environment в GitHub

В репозитории: **Settings → Environments → production** — можно включить required reviewers для прод-деплоя.

Workflow: [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).
