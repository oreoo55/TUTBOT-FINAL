OpenRouter / OpenWater integration notes

This project can use OpenRouter/OpenWater (an OpenAI-compatible gateway).
Follow these steps to create and manage an API key and test the chatbot locally.

1) Create / manage API keys
- See OpenRouter docs: https://openrouter.ai/docs/guides/overview/auth/management-api-keys
- Create a new API key in the OpenRouter dashboard. Copy it to a secure location.

2) Set the key locally (do NOT commit it)
- Bash (temporary for session):

  export OPENAI_API_KEY="sk-or-..."
  export OPENAI_BASE_URL="https://api.openrouter.ai/v1"
  export OPENAI_MODEL="openrouter/free"

- Or set in a local `.env` that is excluded from git. Never commit real keys.

3) Restart backend so Laravel reads the env changes:

  cd backend
  php8.3 artisan serve --host 0.0.0.0 --port 8000

4) Test the chat endpoint via the Vite proxy (frontend dev server must be running):

  curl -s -X POST http://127.0.0.1:5174/api/ai/chat \
    -H 'Content-Type: application/json' \
    -d '{"conversation_id":null,"messages":[{"role":"user","content":"Say hello"}]}' | jq -r '.message.content'

5) Troubleshooting
- If you see `cURL error 6: Could not resolve host`, your environment cannot resolve `api.openrouter.ai` (DNS/network). Run the test from a machine with outbound DNS and HTTPS access.
- If 401 errors appear, check the key value and that it has not been revoked.
- Logs are written to `backend/storage/logs/laravel.log` when running the backend.

6) Production notes
- Store the key in your platform's secrets manager (GitHub Actions/Heroku/Netlify/Render/Cloud) and do NOT store it in repo.
- Optionally use `OPENAI_BASE_URL` to switch between providers (OpenAI vs OpenRouter).
