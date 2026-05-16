# bioAI


## Version: 0.9.1


## Requirements to use (Docker)
   - Ollama on machine
   - Ollama can be accessed by all ports (0.0.0.0) instead of just local
   - Ollama has the following models:
      * Mistral:7b
      * Llama3.2:3b
      * Nomic Embed Text
   - Ollama on local port 11434

```
bioAI
├─ README.md
├─ backend
│  ├─ Dockerfile
│  ├─ api
│  │  ├─ __init__.py
│  │  ├─ admin.py
│  │  ├─ apps.py
│  │  ├─ authentication.py
│  │  ├─ migrations
│  │  │  ├─ 0001_initial.py
│  │  │  ├─ 0002_alter_project_id.py
│  │  │  ├─ 0003_alter_user_id.py
│  │  │  ├─ 0004_rename_aisteps_project_available_trusted_literatures.py
│  │  │  ├─ 0005_alter_project_editors_alter_project_viewers.py
│  │  │  ├─ 0006_doc.py
│  │  │  ├─ 0007_project_research_question_project_thesis.py
│  │  │  ├─ 0008_remove_project_objective.py
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
│  │  └─ views.py
│  ├─ bioAI
│  │  ├─ __init__.py
│  │  ├─ asgi.py
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ wsgi.py
│  ├─ docker-compose.yml
│  ├─ manage.py
│  ├─ rag
│  │  ├─ __init__.py
│  │  ├─ admin.py
│  │  ├─ apps.py
│  │  ├─ migrations
│  │  │  └─ __init__.py
│  │  ├─ models.py
│  │  ├─ tests.py
│  │  ├─ urls.py
│  │  ├─ utils
│  │  │  ├─ apiconfig.py
│  │  │  └─ backends.py
│  │  └─ views.py
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
   │  │  ├─ WYSIWYGEditor.jsx
   │  │  ├─ getCookie.jsx
   │  │  ├─ inputTags.jsx
   │  │  ├─ layout.jsx
   │  │  ├─ overlay.jsx
   │  │  ├─ project-card.jsx
   │  │  ├─ spinner.jsx
   │  │  └─ toolbar.jsx
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
   │  │  ├─ overview.jsx
   │  │  └─ project.jsx
   │  └─ styles.css
   └─ vite.config.js

```