# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS-based integration between **CrewNet** (volunteer management) and **CampOS/Odoo** (camp management) for Spejdernes Lejr. Runs in two modes: CLI tool or HTTP server with scheduled sync tasks.

## Commands

```bash
# Build
npm run build           # Compile TypeScript to dist/
npm run build:watch     # Watch mode

# Run
npm run cli -- <command>   # CLI mode (e.g. npm run cli -- event:getAll)
npm run server             # HTTP server on port 3000

# Code quality
npm run lint            # ESLint
npm run format          # Prettier

# Tests
npm test                # Jest
npm run test:cov        # With coverage
npm run test -- --testPathPattern=<file>  # Single test file
```

## Environment

Requires a `.env` file with:
- `token` — CrewNet API bearer token
- `event_id` — CrewNet event ID
- `apidomain` — CrewNet API base URL
- `duplicatedEmailUsers` — comma-separated list of user IDs allowed to share emails
- `server_dry_run=true` — skip writes in server mode
- `LOG_LEVEL=debug` — verbose logging

## Architecture

### Dual-mode entry points
- `src/cli.ts` — bootstraps NestJS with `nest-commander` for CLI
- `src/server.ts` — bootstraps HTTP server; cron jobs run automatically

### Core modules
- **`src/crewnet/`** — REST client for CrewNet API (`CrewnetService`)
- **`src/campos/`** — XMLRPC client for CampOS/Odoo (`CamposService`), includes country code mappings
- **`src/campctl/`** — orchestration layer (`CampCtlService`) that composes CrewNet + CampOS operations into high-level sync flows
- **`src/endpoints/`** — HTTP controllers (server mode only); `GET /guesthelper?partner=<id>` webhook
- **`src/commands/`** — nest-commander CLI command handlers, one file per command group

### Scheduled tasks (server mode)
| Task | Schedule |
|------|----------|
| `syncWorkplaceCategoriesAuto` | Every 10 min |
| `syncGuestHelpers` | xx:03 and xx:33 |
| `syncMemberContactInfo` | Once/hour at xx:20 |

### Key patterns
- All API calls go through `CrewnetService` or `CamposService`; `CampCtlService` never calls external APIs directly.
- Dry-run support is threaded through most write operations via `server_dry_run` env var.
- Email deduplication: users sharing emails are tracked in `duplicatedEmailUsers`; `+` alias addresses are also handled explicitly.
- Output utilities (`PDFService`, `ExcelJSService`, `XslxService`, `CSVService`, `JimpService`) are thin wrappers used by CLI commands for report/card generation.
