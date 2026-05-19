# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Specification

All architecture, API design, database schema, component API, visual design, and build order are documented in [`relationship-map-spec.md`](./relationship-map-spec.md). Read it before implementing anything.

## Project Status

No implementation exists yet — this is a spec-only repository. The spec includes a suggested build order (section "Suggested Build Order") to follow when starting implementation.

## Stack

- **Frontend:** React + `@xyflow/react` (React Flow v11+) + d3-force, built with Vite, packaged as a component library
- **Backend:** FastAPI (Python) + SQLite
- **Key constraint:** The FastAPI router must be mountable as a sub-app (`app.mount("/relmap", relmap_app)`); database path via `RELMAP_DB_PATH` env var

## Intended Commands

Once scaffolded:

```
# Frontend
npm run dev / npm run build / npm run test

# Backend
RELMAP_DB_PATH=./dev.db uvicorn main:app --reload
pytest
```
