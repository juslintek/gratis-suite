# Repository guidance

`gratis-suite` coordinates the Gratis WordPress plugin suite. This repository contains suite documentation, Docker Compose development setup, helper scripts, and Playwright E2E specs; plugin and theme source lives in separate `gratis-*` repositories and is mounted from sibling directories by `docker-compose.yml`.

Read `RULES.md` before suite work and consult the relevant reference: `ARCHITECTURE.md`, `WP-CLI.md`, `EXPECTATIONS.md`, or `docs/STATUS.md`. Keep claims grounded in implementation; this repository does not contain the plugin source.

For local development, `./setup.sh` starts the Docker Compose WordPress, MariaDB, and Redis stack and installs a local site. It uses local development credentials and writes to Docker volumes. Run E2E only against that local site: from `tests/e2e`, install dependencies with `npm ci`, install Chromium with `npm run install:browser`, then run `BASE_URL=http://localhost:8080 npm test`. Production checks must be read-only; never enable destructive specs outside local development.

Keep credentials and environment-specific values out of tracked files. Treat Docker volumes and WordPress databases as persistent data; inspect the target before reset, cleanup, migration, or other writes. Do not add speculative production configuration or claim deployment without evidence.
