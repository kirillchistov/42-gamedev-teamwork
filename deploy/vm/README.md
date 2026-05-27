# Первичная настройка ВМ для автодеплоя

Выполните **один раз** на сервере в Яндекс.Облаке (по SSH).

## Две ВМ в проекте (пример)

| ВМ | IP | Назначение |
|----|-----|------------|
| `team-42-cosmic-vm-3` (каталог Практикума) | `158.160.85.253` | учебная / командная |
| `team-42-cosmic-vm-kir` (личный каталог) | `158.160.241.203` | личные эксперименты |

В **GitHub Secrets** указывается **одна** целевая ВМ (`YC_VM_HOST` = её публичный IP).  
Пустой `sudo docker ps` на свежей ВМ — **нормально**: Docker установлен, стек Cosmic Match ещё не поднимали.

### Проверка с локальной машины (Yandex CLI)

```bash
# Практикум
yc compute ssh --id epdu7isvccu4ktfvinpq --login yc-user -- bash -s < scripts/verify-vm-setup.sh

# Личная ВМ
yc compute ssh --id fv4cbmmef94okseq8t9l --login yc-user -- bash -s < scripts/verify-vm-setup.sh
```

Или по SSH вручную на ВМ: `bash scripts/verify-vm-setup.sh` (после копирования скрипта).

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
