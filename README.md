### Clone the repository:

## Database

- create a postgrewdsql db

## Backend

### 1. Go to the root folder and perform the following commands:

`cd backend/`

### 2. Create and activate the virtual environment

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install required packages

```bash
pip install -r requirements.txt
```

### 4. Run the server

- Copy .env.example in .env and fill with your data (FRONTEND_URL should be http://localhost:5173)

```bash
python manage.py migrate
python manage.py runserver
```

NB se migrate da problemi:

```bash
pip install --force-reinstall -U setuptools
```

- Launch python manage.py flush && python manage.py loaddata db.json (it's a basic db with groups "admin", superadmin mail: root@root.root pass: root )

## Frontend

- Head back to the root folder
- Enter in `cd frontend/`
- Copy .env.example in .env and fill with your data (VITE_BACKEND_URL should be http://localhost:8000/api/)

### 1. Installing packages

```bash
yarn
```

### 2. Run the application

```bash
yarn dev
```

### 3. Build (static)

Frontend build outputs to `frontend/dist/`.

#### Build without generating sitemap

Use this if your backend is not reachable (or you want to debug the build output without calling the API):

```bash
cd frontend/
yarn build:no-sitemap
```

#### Build + generate sitemap + prerender (recommended for production)

This produces prerendered HTML per route (so `view-source:` contains correct `<title>`, canonical, Open Graph, JSON-LD, etc.).

Prerequisites on the machine that runs prerender:

```bash
cd frontend/
yarn
yarn playwright install chromium
```

Run:

```bash
cd frontend/
SITE_URL=https://test.superotech.ai PRERENDER_SITE_URL=https://test.superotech.ai yarn build:prerender
```

Notes:
- `SITE_URL` is used for `public/sitemap.xml` base URLs.
- `PRERENDER_SITE_URL` is used to rewrite canonical / `og:url` / JSON-LD URLs so they don’t end up as `http://127.0.0.1:<port>/...`.

### 3. Customize

- to remove theme, remove ThemeSwitcher from Sidebar component
- initially, the theme is always dark (class "dark" on root element), write tw class accordingly

- access_token lifetime is 5 minutes, refresh_token is 30 days

- only user admin can view page AdminPage
- roles are handled with component WithRole (frontend)
