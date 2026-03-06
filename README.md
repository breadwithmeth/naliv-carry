# Naliv Carry (Courier Web App)

## Локальный запуск

```bash
npm install
npm run dev
```

## Продакшн-сборка

```bash
npm run build
```

После сборки публиковать нужно **только содержимое папки `dist/`**.

## Важно для деплоя

Если на проде видны ошибки:

- `Failed to load module script ... MIME type of ""`
- `manifest.webmanifest ... Syntax error`

это почти всегда означает, что сервер отдаёт исходники (`index.html` c `/src/main.tsx`) вместо собранных файлов из `dist`.

Проверка:

- неправильно: `https://<domain>/src/main.tsx` открывается в браузере
- правильно: `https://<domain>/assets/index-<hash>.js` отдаётся как JavaScript

## Nginx (пример)

```nginx
server {
  listen 80;
  server_name carry.naliv.kz;

  root /var/www/naliv-carry/dist;
  index index.html;

  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location = /manifest.webmanifest {
    add_header Content-Type application/manifest+json;
  }
}
```

После изменения конфига:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Роутинг

Если нельзя настроить SPA fallback (`try_files ... /index.html`), используйте hash-роутинг:

```env
VITE_ROUTER_MODE=hash
```
