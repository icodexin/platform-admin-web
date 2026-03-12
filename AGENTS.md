# sys-admin-web Agent Context

## Project Overview

- This repository is a frontend admin system built with React 19, TypeScript, and Vite.
- The UI foundation is Tailwind CSS v4 plus shadcn/ui.
- The target product is a comprehensive admin console for:
  - user management for students and teachers
  - sensor data monitoring
  - system service management and monitoring

## Current Architecture Snapshot

- The project is currently a minimal scaffold, not a full business app yet.
- Existing structure is very light:
  - `src/main.tsx`: mounts `App` with `StrictMode`
  - `src/App.tsx`: placeholder page only
  - `src/components/ui/button.tsx`: existing shadcn/ui button
  - `src/lib/utils.ts`: shared `cn` utility
- Styling and design system status:
  - Tailwind CSS v4 is configured through `@tailwindcss/vite`
  - `src/index.css` already contains shadcn-compatible theme tokens and CSS variables
  - `components.json` uses shadcn `new-york` style, `neutral` base color, `lucide` icons, and `@/*` aliases
- Tooling and runtime status:
  - Vite dev server runs on port `3000`
  - Vite proxy already forwards `/auth` and `/api` to `http://localhost:8000`
  - TypeScript is in strict mode
- State and app infrastructure status:
  - `zustand` and `axios` are already installed
  - `react-router-dom`, `@tanstack/react-query`, `react-hook-form`, and related business libraries are not yet installed at this stage
  - There is no router layer, request layer, auth layer, layout system, or feature modules yet

## Mandatory Development Conventions

### UI and Components

- Always follow shadcn/ui conventions.
- When a new shadcn/ui component is needed, first install the official component with `pnpm`, then adapt it for project needs.
- Do not create imitation replacements for existing shadcn/ui components from scratch when an official shadcn component exists.
- Reuse `src/components/ui/*` as the base UI layer.
- Keep pages and components clean, spacious, modern, and admin-grade. Avoid noisy decoration and avoid generic demo-style layouts.
- Preserve a consistent visual language across pages: stable spacing, clear hierarchy, restrained color usage, and good dashboard readability.

### Tech Stack Expectations

- Use `pnpm` as the package manager.
- Use `react-router-dom` for routing.
- Use `react-hook-form` for forms.
- Use `@tanstack/react-query` for server state management.
- Use `zustand` for local/client state.
- Use `axios` for HTTP request encapsulation.
- Add other libraries only when justified by business needs, and keep the stack modern and maintainable.

### API Integration Rules

- Backend base runtime is local `http://localhost:8000`.
- During frontend development, prefer relative requests through the existing Vite proxy:
  - `/auth/*`
  - `/api/*`
- The primary API reference is `docs/openapi.md`.
- The backend OpenAPI schema can also be fetched anytime from `GET /api/openapi.json`.
- When local documentation and runtime schema need cross-checking, use `docs/openapi.md` plus `/api/openapi.json` together.
- Do not invent request fields or response shapes when `docs/openapi.md` already defines them.
- Authentication is Bearer Token based.
- Current known auth endpoints:
  - `POST /auth/token`
  - `POST /auth/refresh`
  - `POST /auth/logout`
- Current known user endpoints include:
  - `POST /api/users/`
  - `GET /api/users/`
  - `GET /api/users/me`
  - `GET /api/users/{user_id}`
  - `PUT /api/users/{user_id}`
  - `POST /api/users/me/deactivate`

## Recommended App Architecture For Future Work

- Follow a feature-first structure while keeping shared app infrastructure separate.
- Prefer organizing new code roughly as:

```text
src/
  app/                 # app bootstrap, providers, router, layouts
  components/          # shared components
    ui/                # shadcn/ui base components
    common/            # reusable business-agnostic components
  features/            # feature modules
    auth/
    users/
    sensors/
    services/
  lib/                 # axios client, query helpers, utils, constants
  hooks/               # shared hooks
  stores/              # zustand stores
  types/               # shared TS types
```

- Keep route-level pages in `app` or inside feature modules depending on scale, but avoid scattering business logic directly in `App.tsx`.
- Separate concerns clearly:
  - UI primitives in `components/ui`
  - reusable business components in `components/common` or feature folders
  - API clients and request helpers in `lib`
  - cross-page client state in `stores`
  - server cache and async data flow in React Query

## Domain Notes To Preserve

- The system will support at least `student`, `teacher`, and `admin` user types.
- User management must respect backend permission semantics described in `docs/openapi.md`.
- Sensor monitoring pages should emphasize real-time readability, status visibility, alert clarity, and efficient scanning.
- System service management pages should emphasize service status, health, operations, and logs/metrics visibility.

## Implementation Guidance For Future Agents

- Before introducing a new shared UI capability, check whether shadcn already provides the component and install it officially first.
- Before implementing API code, read `docs/openapi.md` and align forms, DTOs, query params, and permission handling to it.
- Prefer building the app foundation in this order:
  1. app shell and route structure
  2. global providers
  3. axios client and auth/token flow
  4. react-query integration
  5. zustand stores for client-only state
  6. feature modules such as auth and users
- Favor maintainable abstractions over premature generalization. This project is currently small, so shared layers should be introduced only when there is repeated use.

## Commit Convention

- Commit messages should follow Conventional Commits structure.
- Preferred format: `type(scope): 中文摘要`.
- Use concise Chinese summaries that describe the actual change, not vague intent.
- Common types include:
  - `feat`: 新功能或新能力
  - `fix`: 缺陷修复
  - `refactor`: 重构但不改变外部行为
  - `docs`: 文档更新
  - `style`: 不影响逻辑的样式或格式调整
  - `test`: 测试相关改动
  - `chore`: 构建、依赖、脚本或杂项维护
- If a scope is clear, include it, for example:
  - `feat(api): 封装认证与用户接口`
  - `fix(auth): 修复停用用户登录态处理`
