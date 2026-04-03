# bioAI


## Version: 0.8.7

```
bioAI
├─ README.md
├─ backend
│  ├─ Dockerfile
│  ├─ api
│  │  ├─ __init__.py
│  │  ├─ admin.py
│  │  ├─ apiconfig.py
│  │  ├─ apps.py
│  │  ├─ authentication.py
│  │  ├─ media
│  │  ├─ migrations
│  │  │  ├─ 0001_initial.py
│  │  │  ├─ 0002_alter_project_id.py
│  │  │  ├─ 0003_alter_user_id.py
│  │  │  ├─ 0004_rename_aisteps_project_available_trusted_literatures.py
│  │  │  ├─ 0005_alter_project_editors_alter_project_viewers.py
│  │  │  └─ __init__.py
│  │  ├─ models.py
│  │  ├─ permissions.py
│  │  ├─ serializers.py
│  │  ├─ static
│  │  │  ├─ bioAIPrototype
│  │  │  │  ├─ scripts.js
│  │  │  │  └─ styles.css
│  │  │  └─ svg
│  │  │     ├─ account.svg
│  │  │     └─ close_small.svg
│  │  ├─ templates
│  │  │  └─ bioAIPrototype
│  │  │     └─ edit.html
│  │  ├─ tests.py
│  │  ├─ urls.py
│  │  ├─ utils
│  │  │  └─ backend.py
│  │  └─ views.py
│  ├─ bioAI
│  │  ├─ __init__.py
│  │  ├─ asgi.py
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ wsgi.py
│  ├─ db.sqlite3
│  ├─ docker-compose.yml
│  ├─ manage.py
│  └─ requirements.txt
└─ frontend
   ├─ README.md
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ public
   │  └─ vite.svg
   ├─ src
   │  ├─ App.css
   │  ├─ App.jsx
   │  ├─ assets
   │  │  └─ react.svg
   │  ├─ components
   │  │  ├─ 404.jsx
   │  │  ├─ AxiosInstance.jsx
   │  │  ├─ getCookie.jsx
   │  │  ├─ inputTags.jsx
   │  │  ├─ layout.jsx
   │  │  ├─ overlay.jsx
   │  │  ├─ project-card.jsx
   │  │  └─ spinner.jsx
   │  ├─ hooks
   │  ├─ icons
   │  │  ├─ close.svg
   │  │  └─ delete.svg
   │  ├─ images
   │  │  └─ Image404.jpg
   │  ├─ index.css
   │  ├─ main.jsx
   │  ├─ pages
   │  │  ├─ create.jsx
   │  │  ├─ edit.jsx
   │  │  ├─ index.jsx
   │  │  └─ project.jsx
   │  └─ styles.css
   └─ vite.config.js
```

**Beta release goal at 1.0.0**