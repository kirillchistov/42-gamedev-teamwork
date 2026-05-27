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

Скрипт **не лежит на ВМ** — запускайте из **корня репозитория на Mac**, stdin передаётся на сервер:

```bash
cd /path/to/42-gamedev-teamwork

# Практикум (158.160.85.253)
yc compute ssh --id epdu7isvccu4ktfvinpq --login yc-user --identity-file ~/.ssh/id_ed25519 -- bash -s < scripts/verify-vm-setup.sh

# Личная ВМ (158.160.241.203)
yc compute ssh --id fv4cbmmef94okseq8t9l --login yc-user --identity-file ~/.ssh/id_ed25519 -- bash -s < scripts/verify-vm-setup.sh
```

Обычный SSH (если уже в сессии на ВМ — сначала скопируйте файл):

```bash
scp -i ~/.ssh/id_ed25519 scripts/verify-vm-setup.sh yc-user@158.160.241.203:/tmp/
ssh -i ~/.ssh/id_ed25519 yc-user@158.160.241.203 'bash /tmp/verify-vm-setup.sh'
```

На ВМ команда `bash scripts/verify-vm-setup.sh` сработает только если каталог репозитория уже есть на сервере.

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
