# Setup recipe — typescript-react-mui

Apply **once per repo**, only when the user explicitly asks ("set up the project", "initialize the repo",
"configure ESLint", or similar). Never auto-run Setup from a component task. Work through the steps in order;
each one is the mechanical enforcement of a principle in `SKILL.md` (the principle number is noted inline).

This recipe targets two stacks — **Vite** and **Next.js (App Router)**. The architectural rules are identical;
only the scaffold command, the React Compiler wiring, and the MUI provider differ. Steps that diverge call out
both stacks explicitly.

## 1. Scaffold the stack

- **Vite + React-SWC:** `npm create vite@latest` → choose the `react-swc-ts` template.
- **Next.js (App Router):** `npx create-next-app@latest --ts --app --eslint`. App Router only — Pages Router is
  out of scope for this skill.

## 2. Dependencies

```sh
# runtime — both stacks
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled \
  zod@^4 @tanstack/react-query fp-ts neverthrow

# runtime — Next.js only (App Router MUI cache provider)
npm i @mui/material-nextjs

# dev — both stacks
npm i -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event msw \
  eslint-plugin-boundaries eslint-plugin-import eslint-plugin-check-file \
  eslint-plugin-react-hooks typescript-eslint \
  babel-plugin-react-compiler eslint-plugin-react-compiler

# dev — React plugin for Vitest (both stacks; on Vite it also drives the dev/build pipeline)
npm i -D @vitejs/plugin-react
```

What each non-obvious dependency buys:

- **`fp-ts` + `neverthrow`** — required by principle 14. `fp-ts` owns `Option<T>`; `neverthrow` owns
  `Result<T, E>` and `ResultAsync<T, E>`. Do **not** also adopt `fp-ts/Either` — pick `neverthrow.Result` and
  keep `fp-ts` for `Option` (and `pipe` / `function`) only. `fp-ts` is in maintenance mode (its successor is
  Effect); confining its use to `Option` keeps that dependency a small, swappable surface — don't grow it.
- **`typescript-eslint`** — the unified flat-config package. It supplies the `tseslint.config(...)` helper, the
  parser, and the rule plugin in one install (replacing the older split `@typescript-eslint/parser` +
  `@typescript-eslint/eslint-plugin`), which is what the flat `eslint.config.js` below expects.
- **`zod@^4`** — the domain layer's definition language and the anti-corruption parser at every boundary
  (principles 9, 14). Pin the major version: the skill's schema APIs (`.brand()`, `.readonly()`, `.transform()`,
  `z.infer`) target Zod 4. Don't float across majors — a v3 → v4 jump changes inferred types under you.
- **`@tanstack/react-query`** — server-state home (principle 12). The only place adapters get bridged into React.
- **`msw`** — network-boundary mock for tests (principle 25). Inverts the dependency at the right place, so no
  context-injected client wrappers are needed.
- **`eslint-plugin-boundaries`** — mechanical layer-boundary enforcement (principle 4).
- **`eslint-plugin-check-file`** — `filename-blocklist` for dump files (principle 23).
- **`babel-plugin-react-compiler` + `eslint-plugin-react-compiler`** — the compiler removes the need for reflexive
  `useMemo` / `useCallback` (principle 18); the ESLint plugin flags code that breaks the compiler's rules.

## 3. `tsconfig.json`

Turn strictness up before there's code to fight you. `exactOptionalPropertyTypes` is load-bearing for principle
14: it makes `x?: T` ("may be absent") distinct from `x: T | undefined` ("present, possibly `undefined`").

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "moduleResolution": "bundler",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`exactOptionalPropertyTypes` occasionally bites when spreading props into a third-party component or building an
options object the library types as `{ x?: T }` while your value is `T | undefined`. The fix is to model the value
as `Option<T>` (principle 14) and only materialise the optional key when present, or to narrow before the spread —
**never** to disable the flag. It is load-bearing for the `x?: T` vs `x: T | undefined` distinction.

## 4. ESLint

`eslint.config.js` is flat config: each plugin is imported and registered in a `plugins` object, and the
`settings` / `rules` excerpts in 4a–4d slot into config objects. The runnable skeleton the excerpts fit into:

```js
// eslint.config.js
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import checkFile from "eslint-plugin-check-file";
import reactHooks from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";
import tseslint from "typescript-eslint";

export default tseslint.config(
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
      import: importPlugin,
      "check-file": checkFile,
      "react-hooks": reactHooks,
      "react-compiler": reactCompiler,
    },
    settings: { /* 4a: boundaries/elements */ },
    rules: { /* 4a–4c: boundaries, import, check-file, react-hooks, react-compiler */ },
  },
  // 4b (Next.js server-only zone) and 4d (external + fetch overrides) are additional config objects.
);
```

The 4a–4d blocks below show the `settings` / `rules` shape only; drop each into the skeleton above.

### 4a. Domain + layer boundaries (principle 4)

```jsonc
// settings + rules block of eslint.config.js
{
  "settings": {
    "boundaries/elements": [
      { "type": "domain-shared", "pattern": "src/shared/domain/**" },
      { "type": "ui-shared", "pattern": "src/shared/ui/**" },
      { "type": "lib-shared", "pattern": "src/shared/{hooks,lib,state}/**" },
      { "type": "domain", "pattern": "src/domains/*/domain/**" },
      { "type": "feature-domain", "pattern": "src/domains/*/*/domain/**" },
      { "type": "feature-application", "pattern": "src/domains/*/*/application/**" },
      { "type": "feature-infrastructure", "pattern": "src/domains/*/*/infrastructure/**" },
      { "type": "feature-ui", "pattern": "src/domains/*/*/ui/**" },
      { "type": "domain-ui", "pattern": "src/domains/*/ui/**" },
      { "type": "domain-barrel", "pattern": "src/domains/*/index.ts" },
      { "type": "feature-barrel", "pattern": "src/domains/*/*/index.ts" },
      { "type": "app", "pattern": "src/app/**" }
    ]
  },
  "rules": {
    "boundaries/element-types": ["error", {
      "default": "disallow",
      "rules": [
        { "from": "domain", "allow": ["domain", "domain-shared"] },
        { "from": "feature-domain", "allow": ["domain", "feature-domain", "domain-shared"] },
        { "from": "feature-application",
          "allow": ["domain", "feature-domain", "feature-infrastructure", "domain-shared"] },
        { "from": "feature-infrastructure",
          "allow": ["domain", "feature-domain", "domain-shared"] },
        { "from": "feature-ui",
          "allow": ["domain", "feature-domain", "feature-application", "feature-infrastructure",
                    "feature-ui", "domain-ui", "domain-shared", "ui-shared", "lib-shared",
                    "domain-barrel"] },
        { "from": "domain-ui",
          "allow": ["domain", "feature-barrel", "domain-shared", "ui-shared", "lib-shared"] },
        { "from": "domain-barrel", "allow": ["feature-barrel", "domain-ui"] },
        { "from": "feature-barrel",
          "allow": ["feature-domain", "feature-ui"] },
        { "from": "app", "allow": ["domain-barrel", "ui-shared", "lib-shared"] }
      ]
    }]
  }
}
```

The `feature-barrel` allow-list **omits `feature-infrastructure` and `feature-application`** — that's principle 3
made mechanical. The barrel can only re-export from `feature-domain` (public domain types) and `feature-ui`
(public components and pages).

The `feature-infrastructure` allow-list **omits `feature-application`**: use cases import adapters directly
(`application → infrastructure`), so the reverse edge would invert the arrow and let an import cycle form. The
dependency order is `ui → application → infrastructure → domain` (principle 2).

### 4b. Server-only path block (Next.js only)

Forbid `infrastructure/server/**` from any client component:

```jsonc
{
  "rules": {
    "import/no-restricted-paths": ["error", {
      "zones": [{
        "target": "src/**/*.{ts,tsx}",
        "from": "src/domains/*/*/infrastructure/server/**",
        "except": [
          "src/domains/*/*/actions.ts",
          "src/app/**/{page,layout,route,loading,error,not-found}.tsx"
        ],
        "message": "Server-only adapters can only be imported from Server Components / Actions."
      }]
    }]
  }
}
```

### 4c. The remaining rules

- `@typescript-eslint/consistent-type-definitions: ['error', 'type']` — `type` over `interface` (principle 16).
- `eslint-plugin-import`: `no-default-export` + `no-anonymous-default-export` (principle 24). Scope the
  default-export override to framework-required files only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`,
  `not-found.tsx`, `template.tsx`, `default.tsx`, `global-error.tsx`, `middleware.ts`, `*.config.*`).
- `eslint-plugin-check-file`: `filename-blocklist` for dump files (principle 23) —
  `['error', { '**/{types,utils,helpers,constants,common,misc,shared}.ts': '*', '**/*.types.ts': '*' }]`.
- `eslint-plugin-react-hooks@^5` — rules-of-hooks + exhaustive-deps.
- `eslint-plugin-react-compiler` — `react-compiler/react-compiler: 'error'`.

### 4d. Isomorphic-layer purity — external packages and the `fetch` global (principles 2, 4)

`boundaries/element-types` (4a) governs only **internal** cross-layer imports; it does **not** see external npm
packages, so on its own it lets `import React from "react"` through a `domain/` file unflagged. Two extra rules
close that hole and make the "no React / MUI / TanStack / `fetch` in `domain/` and `application/`" claim real.

`boundaries/external` blocks the framework packages from the isomorphic layers:

```jsonc
{
  "rules": {
    "boundaries/external": ["error", {
      "default": "allow",
      "rules": [
        {
          "from": ["domain", "feature-domain", "domain-shared"],
          "disallow": ["react", "react-dom", "@mui/*", "@emotion/*", "@tanstack/react-query"],
          "message": "The domain layer is isomorphic — no React, MUI, Emotion, or TanStack Query."
        },
        {
          "from": ["feature-application"],
          "disallow": ["react", "react-dom", "@mui/*", "@emotion/*", "@tanstack/react-query"],
          "message": "Use cases are plain async functions — no React, MUI, or TanStack Query."
        }
      ]
    }]
  }
}
```

`fetch` is a global, not an import, so no import rule can catch it. Add a scoped `no-restricted-globals` override
(a separate flat-config object, since it targets only the isomorphic folders) — these layers do I/O only through
an `infrastructure/` adapter:

```js
{
  files: [
    "src/domains/*/domain/**",
    "src/domains/*/*/domain/**",
    "src/domains/*/*/application/**",
    "src/shared/domain/**",
  ],
  rules: {
    "no-restricted-globals": ["error", {
      name: "fetch",
      message: "Domain and application layers must not perform I/O — call an infrastructure adapter.",
    }],
  },
}
```

## 5. React Compiler wiring (principle 18)

**Vite** — feed the Babel plugin to `@vitejs/plugin-react`:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ babel: { plugins: [["babel-plugin-react-compiler", { target: "19" }]] } })],
  resolve: { alias: { "@": "/src" } },
});
```

**Next.js** — one flag:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { reactCompiler: true },
};

export default nextConfig;
```

## 6. Theme (principles 20)

One source of truth in `src/theme/`. `cssVariables: true` makes dark-mode toggles flicker-free and SSR-safe;
module augmentation keeps custom tokens type-safe (no casts).

```ts
// src/theme/index.ts
import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    brand: { subtle: string; bold: string };
  }
  interface PaletteOptions {
    brand?: { subtle: string; bold: string };
  }
}

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  palette: { brand: { subtle: "#eef2ff", bold: "#4f46e5" } },
});
```

## 7. MUI provider

Stack-specific. Use the exact provider for the stack — the wrong one produces subtle hydration / styling bugs.
The full provider snippets live in the **Stack adapter** section of `SKILL.md`:

- **Vite:** `StyledEngineProvider enableCssLayer` + `ThemeProvider` + `CssBaseline`.
- **Next.js:** `AppRouterCacheProvider` (from `@mui/material-nextjs/v15-appRouter`, or `v14` for Next.js 14) with
  `options={{ enableCssLayer: true }}` in the root `layout.tsx`, wrapping `ThemeProvider` + `CssBaseline`.

## 8. Vitest + MSW (principle 25)

Coverage is gated at 100 on changed code. Wire the gate and the MSW network boundary once.

**Vite** — Vitest reads `vite.config.ts`; add a `test` block (or a separate `vitest.config.ts`):

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
}));
```

**Next.js** — Vitest needs its own config with the React plugin:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
  resolve: { alias: { "@": "/src" } },
});
```

**Shared setup file** — jest-dom matchers + the MSW lifecycle:

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```ts
// src/test/mswServer.ts
import { setupServer } from "msw/node";

// Per-test handlers are registered with server.use(...) inside the test.
export const server = setupServer();
```

`onUnhandledRequest: "error"` makes a missing handler a hard failure — tests can never silently hit the real
network.

## 9. Folder skeleton (both stacks)

```
src/
  domains/
    <domain>/                # bounded context
      domain/                # bounded-context-wide entities, schemas, branded IDs
      ui/
        pages/               # OPTIONAL — cross-feature pages inside this domain
      <feature>/             # use-case slice
        domain/              # feature-specific entities, schemas, helpers
        application/         # OPTIONAL — only with concrete trigger (principle 11)
        infrastructure/
          http/              # HTTP adapters — ResultAsync<T, HttpError>
          server/            # OPTIONAL — server-only adapters (Next.js)
        ui/
          hooks/             # cross-component data hooks
          components/
          <FeaturePage>/     # OPTIONAL — single-feature page
        actions.ts           # OPTIONAL — Next.js Server Actions
        index.ts             # public surface
      index.ts               # domain barrel
  shared/
    domain/                  # cross-domain VOs (Money, Email, Address)
    ui/                      # MUI wrappers + design-system primitives (FLAT — not atomic)
      templates/             # layout shells with slots (AppShell, DashboardTemplate)
    hooks/
    lib/
      http.ts                # getJson / postJson — ResultAsync<T, HttpError> (principle 14)
      zodOption.ts           # OptionFromNullable Zod combinator (principle 14)
      queryError.ts          # QueryError<E> — TanStack Query throw boundary wrapper (principle 14)
    state/                   # cross-cutting Zustand stores
  test/
    mswServer.ts             # shared MSW server
  theme/
  app/                       # Vite routes OR Next.js App Router root
```

## 10. `shared/lib/` helpers (principle 14)

Create all three files exactly as published in **principle 14** of `SKILL.md` — they are the no-`null` boundary
the rest of the codebase depends on:

- `shared/lib/http.ts` — the `request` core plus `getJson` / `postJson`, returning `ResultAsync<T, HttpError>`.
  Adapters never throw; HTTP / network / parse failures are `HttpError` values.
- `shared/lib/zodOption.ts` — `OptionFromNullable`, the Zod combinator that lands nullable wire fields as
  `Option<T>` in the inferred domain type.
- `shared/lib/queryError.ts` — `QueryError<E>`, the one-line `Error` subclass thrown at the TanStack Query
  boundary so what's stored in `query.error` is a real `Error` carrying the tagged failure on `.failure`. Lets the
  data hook surface `Option<HttpError>` instead of a dishonest `Option<Error>`.

## Verification checklist

- [ ] Stack scaffolded (Vite `react-swc-ts` or Next.js `--ts --app --eslint`)
- [ ] Runtime deps installed, incl. `fp-ts` + `neverthrow` (and `@mui/material-nextjs` on Next.js)
- [ ] Dev deps installed, incl. `msw`, `@vitejs/plugin-react` (needed by Vitest on both stacks), the three
      boundary/import/check-file plugins, react-hooks, react-compiler
- [ ] `zod` pinned to `^4` (the skill's schema APIs target Zod 4)
- [ ] `tsconfig.json` has `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [ ] `eslint-plugin-boundaries` configured with the layered rule set, and `feature-infrastructure` does **not**
      allow `feature-application` (no `application ↔ infrastructure` cycle) (principle 4)
- [ ] `boundaries/external` blocks `react` / `@mui/*` / `@emotion/*` / `@tanstack/react-query` from `domain/` and
      `application/`, and a scoped `no-restricted-globals` blocks `fetch` there (principles 2, 4)
- [ ] `import/no-restricted-paths` server-only block in place (Next.js)
- [ ] `consistent-type-definitions`, `no-default-export`, `filename-blocklist`, react-hooks, react-compiler rules on
- [ ] React Compiler wired (Vite Babel plugin / Next.js `experimental.reactCompiler`)
- [ ] Theme with `cssVariables: true` and module augmentation
- [ ] MUI provider matches the stack (principle: Stack adapter)
- [ ] Vitest configured with the 100% coverage gate; `vitest.setup.ts` wires jest-dom + the MSW lifecycle
- [ ] `shared/lib/http.ts`, `shared/lib/zodOption.ts`, and `shared/lib/queryError.ts` created per principle 14
- [ ] Folder skeleton in place
