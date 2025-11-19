## Purpose
Short, actionable guidance for AI coding agents working on the bioAI Django prototype.

Keep directions concrete: this repo is a small Django app (project: `bioAI`, app: `bioAIPrototype`) that integrates with Ollama via LangChain. Focus on editing Django models/views/templates, and the AI prompt/validation flow in `bioAIPrototype`.

## Big picture (what to know first)
- Django project: top-level Django project code is under `bioAI/` (contains `manage.py` and inner `bioAI/` package).
- Single main app: `bioAIPrototype/` (templates, static, models, views live here).
- LLM integration: views use `langchain_ollama.ChatOllama` (see `bioAIPrototype/views.py`) to call a local Ollama model `llama3.2:3b` and then validate responses with a pydantic model defined in `bioAIPrototype/models.py`.
- Data persistence: SQLite (`db.sqlite3`) and Django models; generated AI step data is stored in a JSONField on `Project`.

## Key files to inspect (quick jump list)
- `bioAI/bioAI/settings.py` — settings, INSTALLED_APPS, AUTH_USER_MODEL = "bioAIPrototype.user" and static/media settings.
- `bioAI/bioAI/manage.py` — Django CLI.
- `bioAI/bioAIPrototype/models.py` — Project, User, and the pydantic AIGeneratedResearchSteps used to validate LLM output.
- `bioAI/bioAIPrototype/views.py` — LLM prompt composition, `chat.invoke(...)` calls, response validation, and Project creation flow.
- `bioAI/bioAIPrototype/urls.py` — route names and path shapes (e.g., `/create`, `/project/<id>`).
- `bioAI/bioAIPrototype/templates/` and `bioAI/bioAIPrototype/static/` — UI and JS (see `static/bioAIPrototype/scripts.js`), which uses fetch + CSRF tokens to call backend endpoints.

## Developer workflows & commands (concrete)
- From repository root, recommended workflow:
  - `cd bioAI`
  - `python manage.py migrate`
  - `python manage.py createsuperuser` (if needed)
  - `python manage.py runserver`
- Run tests: `cd bioAI && python manage.py test`

## Integration points & external deps (must have locally)
- Ollama: the code expects a local Ollama runtime and the model referenced in `views.py` (`llama3.2:3b`). Ensure Ollama is installed and the model is available.
- Python deps: `requirements.txt` lists `Django==5.1.2`, `ollama`, `langchain-ollama`, `langchain-core`, and `markdown2`.

## Project-specific patterns & gotchas
- AI-first flow: `create` view builds detailed instruction prompts, calls the LLM, then validates the returned JSON via the pydantic `AIGeneratedResearchSteps` model before saving to `Project.AIsteps` (JSONField). When changing prompts or schema, update both the prompt example and the pydantic model.
- Validation is explicit: do not bypass `AIGeneratedResearchSteps.model_validate_json` — downstream code assumes the saved JSON has `available_trusted_literatures`.
- CSRF + fetch: frontend JS (`static/bioAIPrototype/scripts.js`) explicitly reads the CSRF cookie and attaches `X-CSRFToken` to POST calls — preserve this pattern when adding endpoints called from client-side code.
- Custom user model: `AUTH_USER_MODEL = "bioAIPrototype.user"` and `User` extends `AbstractUser` in `models.py`. Ensure migrations are run before creating users.
- CharField usage: some `CharField()` declarations in `models.py` lack `max_length` (e.g., `topic = models.CharField()`); that is non-standard and may break migrations/generated code. If modifying models, prefer explicit `max_length` and re-run migrations.

## Examples extracted from the codebase
- Prompt + validation example (from `views.create`):
  - Compose a prompt that requests a specific JSON schema (example is printed and used as the canonical format).
  - Call `chat.invoke([HumanMessage(content=ai_prompt)])` and then `AIGeneratedResearchSteps.model_validate_json(response.content)`.
- Frontend POST example (from `static/bioAIPrototype/scripts.js`):
  - `fetch('/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf_token }, body: JSON.stringify({ title, description }) })`

## When editing or extending the code
- If adding new AI-driven endpoints: include a clear example JSON schema in the prompt and add a pydantic validator model in `models.py` used before saving.
- Preserve existing URL names (used by templates): `index`, `create`, `login`, `logout`, `register`, `project`, `delete`, `edit`.

## Quick checklist for PRs
- Run migrations locally and ensure app starts: `cd bioAI && python manage.py migrate && python manage.py runserver`.
- Verify any JS fetch callers include CSRF headers and that endpoint returns JSON when called by client code.
- If you change the LLM prompt/schema, update the pydantic model and add a small test exercising the validation.

## Questions for the reviewer
- Do you want agent guidance to auto-run Ollama (install instructions) or assume it's managed externally?

---
If anything here is unclear or you want the guidance expanded (examples for testing, CI, or local Ollama setup), tell me which area to expand next.
