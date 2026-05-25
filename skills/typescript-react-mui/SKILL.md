---
name: typescript-react-mui
description: "Use for creating or refactoring TypeScript React 19 components in MUI 7 projects on Vite or Next.js App Router. Selects a mode (Patch / Leaf / Folder Component / Feature / Page / Setup) from the request and applies only that mode's rules — never escalates to a full feature scaffold for a prop rename. Conventions: bounded-context layout with a four-layer split inside each feature (`domain` / `application` / `infrastructure` / `ui`), Zod-first domain types with anti-corruption parsing at API boundaries, branded IDs, three-layer component split (hook / component / styles), mechanical layer-boundary enforcement via `eslint-plugin-boundaries`, MUI 7 (slots, no deep imports, `cssVariables: true`, theme module augmentation), strict TypeScript, no `null` in code we write (`Option<T>` from fp-ts for optionality, `Result<T, E>` / `ResultAsync<T, E>` from neverthrow for fallibility — adapters never throw), named exports, 100% test coverage on changed code."
version: 1.0.0
---
# typescript-react-mui

Author and refactor TypeScript React 19 components on MUI 7 by first classifying the user's request into a **mode**
(Patch / Leaf / Folder Component / Feature / Page / Setup) and applying only that mode's rules. Default to the least
invasive mode that fits — never escalate to a full feature scaffold for a prop rename. Feature work uses a four-layer
split inside each feature (`domain` / `application` / `infrastructure` / `ui`) on top of a bounded-context layout
(`src/domains/<domain>/<feature>/` + `src/shared/` + `src/app/`). The `domain/` layer is Zod-first with branded IDs;
`infrastructure/` exposes plain async adapters that parse responses through schemas; `ui/` keeps the three-layer
split (hook / component / styles) inside a folder-per-non-trivial-component. Layer boundaries are enforced
mechanically via `eslint-plugin-boundaries`. DDD tactical patterns are pragmatic — Zod schemas + branded IDs are the
default; class entities and aggregates appear only when concrete triggers fire. Atomic Design is vocabulary, not
folders. Works in Vite and Next.js App Router; stack-specific concerns live in the stack-adapter section.

## When to use

Trigger this skill whenever the work touches a `.tsx` file (or a `.ts` file holding a domain schema, a port
interface, an adapter function, a hook, or a styled-components module) in a project using:

- React 19 (`react@^19`)
- MUI 7 (`@mui/material@^7`)
- TypeScript
- Zod 4 (`zod@^4`) — the domain layer's definition language. The skill's schema APIs (`.brand()`, `.readonly()`,
  `.transform()`) target v4; pin the major version in Setup.
- A bundler / framework supported by this skill: **Vite** or **Next.js (App Router)**

Specific invocations and the mode they imply:

- "fix typo", "rename prop", "update copy", "fix import", single-line bug fix → **Patch**
- "presentational component", "leaf component" → **Leaf**
- "create a component", "add a hook to this component", "extract the hook", "refactor this component" →
  **Folder Component**
- "scaffold a feature", "add API integration", "new domain entity" → **Feature**
- "scaffold a page", "new route", "new screen" → **Page**
- "set up the project", "initialize the repo", "configure ESLint" → **Setup**

**Do not** use:

- For non-MUI projects (Tailwind-only, CSS-Modules-only, headless-UI). The folder structure rules still apply, but
  the MUI-specific phases don't.
- For Next.js Pages Router projects — only App Router is covered here.
- To restructure files the user didn't ask to restructure. Match scope to request.

## Core principles

26 principles grouped by topic, ordered by importance for a platform / multi-team React + MUI 7 codebase.
Architectural and modal rules come first; engineering disciplines and stack-specific idioms follow. The opening
**Rule precedence** subsection resolves conflicts when two principles or principles-vs-framework requirements
disagree.

### Rule precedence

When two rules conflict, resolve in this order (highest wins):

1. **Framework requirements.** Next.js page-shaped files needing default exports, `'use client'` on interactive
   components, `'use server'` for Server Actions. Frameworks override skill conventions; the exception stays local
   (one file, documented).
2. **Existing repository conventions.** If the project follows a different pattern (flat `components/`, different
   folder names, different test runner), conform to the existing convention for new work in the same area. Migrate
   only on explicit request.
3. **Mode scope.** Do not expand scope beyond the user's request. Patch never restructures; Leaf never scaffolds
   layers; Folder Component never spawns a feature.
4. **Public API stability.** Do not change exported shapes unless the user asked for a breaking change.
5. **Layer boundaries** for new or moved code (principle 4).
6. **Skill conventions** for new isolated code.
7. **Skill defaults** (everything below).

If a rule conflicts with a framework requirement, the framework wins and the exception is scoped locally with a
short justifying comment.

### Architecture and layering

#### 1. Domain-based organisation; bounded contexts as the top-level cut

`src/domains/<domain>/<subdomain>` is the **bounded context** (Billing, Catalog, Identity, Shipping) — coarse,
typically 5–10 across the whole product. `<feature>` is a use-case slice within it (`orders`, `payment-methods`,
`product-search`). Cross-domain primitives live in `src/shared/`. The routing layer (`src/app/`) consumes features;
features never consume routes.

**Domain selection rubric** when the bounded context isn't obvious:

1. What business capability owns the data?
2. Which backend / API namespace would this map to?
3. Would this concept still exist if the UI route changed?
4. Which team would own the rules and reviews?

| Usually good | Usually wrong (route or layer disguised as domain) |
| --- | --- |
| `identity`, `billing`, `catalog`, `orders`, `shipping` | `dashboard`, `settings`, `admin`, `pages`, `components` |

#### 2. Layered separation inside every feature: `domain` / `application` / `infrastructure` / `ui`

Logic, orchestration, adapters, and presentation change for different reasons; they live in different folders. A
feature **may** contain up to four layers; create only the ones that have content. Never scaffold empty layers.

- **`domain/`** — pure TypeScript: Zod schemas, branded ID types, discriminated unions, pure helper functions,
  optional class entities and aggregates. **No React, no `@tanstack/react-query`, no `@mui/*`, no `fetch`.** The
  same code runs server-side and client-side without modification.
- **`application/`** — use cases. **Optional and rare.** Appears only when a concrete trigger fires (see principle
  11). Use cases are plain async functions that **import their adapters directly** from `infrastructure/`; the data
  hook in `ui/hooks/` invokes them via `useMutation`. **No React, no MUI.**
- **`infrastructure/`** — adapters. HTTP clients in `infrastructure/http/`, server-only persistence in
  `infrastructure/server/` (importable only from Server Components / Actions), other external-system bridges.
  Adapters call `Schema.parse()` on responses so the rest of the system sees only validated domain types.
- **`ui/`** — React + MUI. Data hooks (TanStack Query wrappers), components (the three-layer split applies inside),
  and pages.

The arrows point inward: `ui → application → infrastructure → domain` — because use cases import their adapters
directly, `application` depends on `infrastructure`, and `ui` may also call `infrastructure` adapters directly via
its data hooks. Concrete adapters depend only on `domain` schemas (and on port interfaces declared in `domain/`
when interfaces exist), never on `application/` or `ui/`.

The `domain/` layer exists at two scopes: **bounded-context-wide** (`domains/<domain>/<subdomain>/domain/`) holds
canonical entities the whole bounded context shares; **feature-local**
(`domains/<domain>/<subdomain>/<feature>/domain/`) holds entities, schemas, and helpers that only this feature
knows about. Lift-on-second-use: a type used by one feature stays in the feature; the moment a second feature in
the same bounded context needs it, lift it to `domains/<domain>/<subdomain>/domain/`.

#### 3. `index.ts` is the contract — feature barrels publish a narrow surface

Anything not exported from a feature's `index.ts` is private to that feature. Sibling features inside a bounded
context import each other only via the bounded context's `index.ts`; cross-domain consumers import only via the
*other* domain's `index.ts`. Layers within a feature (`domain/`, `application/`, `infrastructure/`) are private to
that feature unless explicitly re-exported.

**Feature `index.ts` may export:**

- Page components and their props types
- Reusable feature components intended for other features / routes to consume
- Public domain types (`Order`, `OrderId`) when other features in this or sibling domains genuinely need them
- Public hooks when explicitly needed by other features (rare — usually a code smell)

**Feature `index.ts` must not export:**

- Component-local hooks (e.g. `useOrderTable` that only `OrderTable` consumes)
- Component styles
- `infrastructure/` adapters (the `useFoo` data hook is the boundary, not the adapter)
- `application/` use cases (called via the data hook, not externally)
- Test helpers and fixtures
- Private domain helpers

Barrel files contain re-exports only — no logic, no inline types, no side effects.

#### 4. Layer-boundary ESLint enforcement

The four-layer split is mechanical, not aspirational. `eslint-plugin-boundaries` is configured so that:

- `domain/` may import only from `domain/` (same bounded context) and `shared/domain/`.
- `application/` may import from `domain/`, `shared/domain/`, and `infrastructure/` (use cases import their
  adapters directly).
- `infrastructure/` may import from `domain/`, `shared/domain/`, and HTTP / DB clients — never from `application/`
  or `ui/`. Importing `application/` would invert the use-case→adapter arrow and create a cycle.
- `ui/` may import from anything inside its feature / domain, from `shared/`, and from other domains' `index.ts`
  barriers.
- `src/app/` may import from domain barriers and `shared/`; no domain ever imports from `src/app/`.

`boundaries/element-types` governs only these **internal** cross-layer imports. The "no React / MUI / TanStack /
`fetch`" rule for `domain/` and `application/` is a separate mechanism: Setup also ships a `boundaries/external`
rule (blocking those packages from the isomorphic layers) and a scoped `no-restricted-globals` rule (blocking the
`fetch` global there). Element-types alone would let `import React from "react"` through a domain file unflagged.

Configuration is shipped in Setup mode below. If you find yourself reaching for `eslint-disable boundaries/*`,
the layering is wrong — fix the structure, not the lint.

### UI structure

#### 5. Three-layer component split inside `ui/`: hook / component / styles

Inside `ui/components/<Component>/`, three files own three orthogonal concerns:

- `useComponent.ts` — state, effects, derived values, handlers. No JSX. **No `@mui/material` imports with one
  narrow exception:** `useMediaQuery` is permitted in hooks for responsive behavioural state (deciding which
  component tree to render). Responsive *styling* still belongs in `Component.styles.ts`.
- `Component.tsx` — composition: calls the hook, wires the result into MUI primitives.
- `Component.styles.ts` — appearance: `styled()` definitions, reusable `sx` factories.

When the API adds a field, the hook changes. When the layout changes, the component changes. When spacing tweaks,
the styles change. Most days, exactly one file changes.

#### 6. Folder-per-non-trivial-component; file for leaves — concrete trigger list

A component earns a folder when it owns **any** of:

- State (`useState`, `useReducer`)
- Effects (`useEffect`, `useLayoutEffect`)
- Data fetching (any hook from `ui/hooks/`)
- Non-trivial derived values (more than a single inline computation)
- Reusable styles (more than one `styled()` or a repeated `sx` factory)
- Dedicated tests

**A props type alone does not earn a folder.** A presentational component with a typed props interface and no items
from the list above stays as a single file in the parent folder. Promote to a folder the moment a second concern
appears.

Apply the **"open the file" test** before committing to a shape: imagine a teammate opens `Component.tsx` cold.
Can they tell what it renders in 30 seconds? If JSX is hidden behind 200 lines of `useEffect`, the hook needs to
come out — that's a folder.

#### 7. Page convention: route entry vs. page component; placement by composition scope

A **page** is a route-bound, screen-level composition. Two concerns are kept separate:

- **Route entry** — lives in `src/app/`. In Next.js, `page.tsx` (which default-exports); in Vite, whatever the
  router calls a route file. The route file is **thin**: handles route params, metadata, loaders, framework
  default-export requirements. It re-exports a named page component.
- **Page component** — lives by composition scope:

| Scope | Location | Example |
| --- | --- | --- |
| Single-feature | `domains/<domain>/<subdomain>/<feature>/ui/<FeaturePage>/` | `.../orders/ui/OrdersPage/` |
| Within one domain | `domains/<domain>/<subdomain>/ui/pages/<DomainPage>/` | `.../billing/ui/pages/DashboardPage/` |
| Cross-domain | `src/app/<route>/<Page>/` (route-local) | `src/app/dashboard/DashboardPage/` |

The routing layer is the only place allowed to compose across bounded contexts; sibling features cannot import
each other directly, so cross-context composition naturally lands in `src/app/`.

Page components are full folder components with the three-layer split. The suffix `XxxPage` is mandatory and
greppable. Pages contain composition only — no domain data-fetching at the page level (that's in the feature
components or hooks), no domain logic. URL params + page-level UI state (active tab, modal open) are the page's
business.

**Templates** (Atomic Design vocabulary): in Next.js, `layout.tsx` plays that role; in Vite, layout shells with
slots (`AppShell`, `DashboardTemplate`) live in `shared/ui/templates/`. Pages consume templates.

#### 8. Atomic Design is vocabulary, not folders

Brad Frost's taxonomy (atoms / molecules / organisms / templates / pages) is encouraged for Storybook organisation,
Figma libraries, and team communication. **It does not appear in the codebase.** `shared/ui/` is flat —
`shared/ui/Button/`, not `shared/ui/atoms/Button/`. Generic, design-system-shaped components live in `shared/ui/`;
domain-specific organisms live in `domains/<x>/<feature>/ui/components/`. The only atomic-vocabulary folder
allowed in code is `shared/ui/templates/` for layout shells with slots.

The reason: in real platform codebases, the atom/molecule/organism boundary collapses under pressure (a button
with an icon — atom or molecule?) and the categorisation debate produces no shippable value. Domain boundaries
and the four-layer split are load-bearing; atomic-folder boundaries aren't.

### Domain and data

#### 9. Zod-first domain types with anti-corruption parsing at every API boundary

Domain entities and external data shapes are defined as Zod schemas. The TypeScript type is
`z.infer<typeof FooSchema>`. Adapters in `infrastructure/http/*Api.ts` parse every response through the schema
before the rest of the system sees the data — this is the anti-corruption layer.

UI-only view models that never cross an API / persistence / domain boundary may be plain TypeScript types — Zod
is overkill for a local "active tab" state shape.

Each schema lives in its own file at `domain/<TypeName>.ts`:

```ts
// domains/billing/domain/Order.ts
import { z } from "zod";
import { OrderIdSchema } from "./OrderId";
import { MoneySchema } from "./Money";

export const OrderStatusSchema = z.enum(["pending", "paid", "shipped"]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z
  .object({
    id: OrderIdSchema,
    status: OrderStatusSchema,
    total: MoneySchema,
  })
  .readonly();

export type Order = z.infer<typeof OrderSchema>;
```

The schema's `.readonly()` makes the inferred type read-only at the boundary; mutation is the opt-in.

#### 10. Branded IDs

Every entity identifier is a branded type. Prevents accidental ID-swapping at compile time, zero runtime cost.
Two equivalent forms — prefer the Zod-branded variant when the ID also needs runtime parsing (it does, at API
boundaries):

```ts
// Zod-branded — preferred
export const OrderIdSchema = z.string().brand<"OrderId">();
export type OrderId = z.infer<typeof OrderIdSchema>;

// Pure type brand — only when no runtime parsing is needed
export type SessionId = string & { readonly __brand: "SessionId" };
```

Passing an `OrderId` where a `CustomerId` is expected is a compile error.

#### 11. Pragmatic DDD tier — concrete triggers, not "when complexity demands"

Default for any new entity:

- Zod schema (defines the type and validates at boundaries)
- Branded ID
- Pure helper functions in `domain/` for derived values

**No `application/` folder by default.** Create `application/` only when **at least two** of these are true:

- The operation calls 2+ external adapters
- The operation has rollback / compensation logic
- The operation coordinates validation across multiple domain objects
- The same orchestration is consumed by 2+ UI flows

Otherwise the data hook in `ui/hooks/` calls the adapter directly via `useMutation`.

**No class entity by default.** Promote a Zod-schema-only entity to a class entity (private constructor + static
factory) only when **at least one** is true:

- The entity has invariants enforced across 2+ operations (e.g. "can't ship if total < $10", "can't modify a
  paid order")
- A state machine drives the entity through 3+ statuses with rules about valid transitions
- The feature is offline-first and must enforce rules locally before sync
- A multi-step form has cross-step invariants spanning 2+ steps

**No aggregate by default.** Promote to an aggregate (a cluster of entities + value objects treated as a single
consistency boundary) only when invariants span 2+ entities **and** a single point of write is required.

**No repository port interface by default.** Introduce a port at `domain/<X>Repository.ts` only when **at least
one** is true:

- A second adapter implementation exists or is planned (HTTP ↔ IndexedDB, REST ↔ GraphQL)
- A documented dual-backend rollout is in progress

Default: plain async adapter functions in `infrastructure/http/<name>Api.ts`, imported directly by use cases and
data hooks.

#### 12. Three state homes — local UI, server (TanStack Query), cross-cutting client (Zustand)

| State kind | Tool | Lives in |
| --- | --- | --- |
| Local UI state (drafts, sort keys, modals) | `useState` / `useReducer` | The component's hook (`useComponent.ts`) |
| Server state | TanStack Query; Server Components for initial fetch | `<feature>/ui/hooks/`; route Server Component |
| Cross-cutting client state (auth, theme) | Zustand | `domains/<x>/ui/store.ts` or `shared/state/` |

**One pattern for data hooks — full custom hooks for both reads and writes.** No `queryOptions` factories by
default. Adapters return `ResultAsync` (principle 14); data hooks bridge to TanStack Query with `.match` and
wrap TanStack's nullable surface in `Option`:

```ts
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryError } from "@/shared/lib/queryError";
import { type HttpError } from "@/shared/lib/http";

// reads
type UseOrders = Readonly<{
  orders: O.Option<ReadonlyArray<Order>>;
  error: O.Option<HttpError>;
  isLoading: boolean;
}>;

export function useOrders(customerId: string): UseOrders {
  const query = useQuery<ReadonlyArray<Order>, QueryError<HttpError>>({
    queryKey: ["billing", "orders", customerId] as const,
    queryFn: () => fetchOrders(customerId).match(ok => ok, e => { throw new QueryError(e) }),
  });
  return {
    orders: O.fromNullable(query.data),
    error: pipe(O.fromNullable(query.error), O.map(e => e.failure)),
    isLoading: query.isLoading,
  };
}

// writes
export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation<Order, QueryError<HttpError>, CheckoutInput>({
    mutationFn: (input) =>
      checkoutOrder(input).match(ok => ok, e => { throw new QueryError(e) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing", "orders"] }),
  });
}
```

If RSC prefetching later becomes a real requirement, reach for the `queryOptions` factory pattern *then* — not
pre-emptively. The adapter functions in `infrastructure/http/*` are already reusable; the Server Component imports
the adapter directly and calls `queryClient.prefetchQuery({ queryKey, queryFn })` with a matching key.

Don't put server data in Zustand or Redux. Context is for stable values only (theme, current user); not a global
store, since every consumer re-renders.

### TypeScript discipline

#### 13. Strict TypeScript — no `any`, `readonly` by default, narrow `as`

Reach for `unknown` when the type is genuinely uncertain, then narrow with a type guard. Use generics for reusable
abstractions.

**Allowed without comment:**

- `as const` (literal narrowing)
- `satisfies` (assertion with inference preservation)
- Narrowing after Zod's `.parse()` when the inferred type is too wide for the local use
- Test fixture narrowing (`const fixture = { id: "x", ... } as Order`) when the schema-based factory would be
  noisier than the cast and the test reads better

**Requires an explanatory comment:**

- Casting `unknown` to a concrete type without runtime validation
- Casting third-party library output (adapter boundary)
- Escaping `readonly` or branded types

**Forbidden:**

- `any` in production or test code
- `as unknown as Foo` (same code smell, twice)

Type component props, hook returns, function arguments, and shared object fields as `readonly` (or wrap with
`Readonly<T>` / `ReadonlyArray<T>` / `readonly T[]`) unless local mutation is required. Mutable is the opt-in:

- **Component props:** `export type FooProps = Readonly<{ ... }>` — React treats props as immutable; the type
  makes it enforceable.
- **Hook returns:** declare an explicit `Readonly<{ ... }>` return type — the inferred return on an object literal
  is mutable.
- **Function arguments:** prefer `ReadonlyArray<Row>` over `Row[]`; `Readonly<{ ... }>` over `{ ... }`.
- **Domain types from Zod:** schemas use `.readonly()` on objects and arrays so the inferred type is read-only
  end to end.

Mutability remains for values whose *purpose* is mutation: `useRef().current`, local builder objects inside a
function, reducer accumulators.

#### 14. Banish `null` — `Option` for optionality, `Result` for fallibility

`null` does not appear in code we write. Optional values are `Option<T>` from **fp-ts**; fallible operations
return `Result<T, E>` (synchronous) or `ResultAsync<T, E>` (asynchronous) from **neverthrow**. The two libraries
split the work: `fp-ts` owns `Option`; `neverthrow` owns `Result` and its async sibling. Don't reach for
`fp-ts/Either` — `neverthrow.Result` is the project's `Either`, and mixing both produces two ways to spell the
same thing. Both libraries are installed in Setup mode.

`fp-ts` is in maintenance mode (its successor is Effect), so the skill deliberately uses only its `Option` (plus
`pipe` / `function`) — a small, stable surface that stays shallow and swappable. Do **not** expand `fp-ts` usage
beyond `Option`; everything fallible is already `neverthrow.Result`. This keeps the option to migrate `Option` to
Effect (or a hand-rolled two-case union) later a localised change.

**Imports — the canonical forms:**

```ts
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { ok, err, okAsync, errAsync, ResultAsync, type Result } from "neverthrow";
```

`O.` is the idiomatic fp-ts namespace alias; named imports from neverthrow keep call sites terse.

**Rules:**

- **Adapters never throw.** Functions in `infrastructure/` return `ResultAsync<T, AdapterError>` where
  `AdapterError` is a tagged union (`{ kind: "Network"; cause: unknown } | { kind: "Http"; status: number } |
  { kind: "Parse"; issues: ReadonlyArray<z.ZodIssue> } | ...`). HTTP errors, parse failures, and timeouts are
  values, not exceptions.
- **Pure domain helpers that can fail return `Result<T, E>`.** Currency mismatch, invariant violations, state
  transition rejections — return `err({ kind, ... })`, never throw. Class entities use the same convention:
  static factory returns `Result<Entity, DomainError>` instead of throwing in the constructor.
- **Optional values are `Option<T>`.** Return types, hook return fields, and stored state never use an explicit
  `T | null` or `T | undefined` union in code we write. The optional-property / optional-parameter marker (`x?: T`)
  is **not** that union and stays allowed — under `exactOptionalPropertyTypes` (Setup) `x?: T` means "may be
  absent", distinct from `x: T | undefined` ("present, possibly `undefined`"). Use `?` for "the caller may omit
  this"; use `Option<T>` for "this slot carries presence/absence as a value".
- **`useState<Option<T>>(O.none)`**, never `useState<T | null>(null)`. The reducer / setter calls `O.some(value)`
  or `O.none` directly.
- **Third-party `null` boundaries** (React refs, DOM queries, library returns) stay `null` on the third-party
  side. The *first thing our code does* is wrap with `O.fromNullable`; the rest of the file sees `Option<T>`.

```ts
  const elt = O.fromNullable(ref.current);
```

- **TanStack Query bridge.** TanStack's `queryFn` / `mutationFn` signal errors by throwing, and TanStack stores
  whatever is thrown verbatim in `query.error`. Throwing the bare tagged failure object would both trip
  `no-throw-literal` and force a dishonest `Option<Error>` on the hook surface (the value stored is really an
  `HttpError`, not an `Error`). Wrap the tagged failure in a one-line `Error` subclass so the thrown value is a
  real `Error` while the typed failure rides along on `.failure`:

```ts
  // shared/lib/queryError.ts
  export class QueryError<E> extends Error {
    constructor(readonly failure: E) {
      super("QueryError");
      this.name = "QueryError";
    }
  }
```

  Throw it at the boundary, and parameterise the query's error type so `query.error` is `QueryError<HttpError>`:

```ts
  queryFn: () => fetchOrders(id).match(ok => ok, e => { throw new QueryError(e) })
```

  Wrap TanStack's nullable surface (`data: T | undefined`, `error: QueryError<HttpError> | null`) inside the data
  hook so consumers see only `Option`, and unwrap `.failure` so the surfaced error is the honest tagged type — not
  `Error`:

```ts
  type UseOrders = Readonly<{
    orders: O.Option<ReadonlyArray<Order>>;
    error: O.Option<HttpError>;
    isLoading: boolean;
  }>;

  export function useOrders(customerId: string): UseOrders {
    const query = useQuery<ReadonlyArray<Order>, QueryError<HttpError>>({
      queryKey: ["billing", "orders", customerId] as const,
      queryFn: () => fetchOrders(customerId).match(ok => ok, e => { throw new QueryError(e) }),
    });
    return {
      orders: O.fromNullable(query.data),
      error: pipe(O.fromNullable(query.error), O.map(e => e.failure)),
      isLoading: query.isLoading,
    };
  }
```

- **Zod ↔ Option bridge** — define one helper for nullable wire fields so the inferred domain type lands as
  `Option<T>`:

```ts
  // shared/lib/zodOption.ts
  import { z } from "zod";
  import * as O from "fp-ts/Option";

  export const OptionFromNullable = <T extends z.ZodTypeAny>(schema: T) =>
    schema.nullable().transform(v => O.fromNullable(v));
```

```ts
  // domains/billing/domain/Order.ts (excerpt)
  export const OrderSchema = z.object({
    id: OrderIdSchema,
    note: OptionFromNullable(z.string()),   // inferred as Option<string>
  }).readonly();
```

  For Zod `.optional()` (the key may be absent), do the same lift to `Option` at first use rather than letting
  `T | undefined` propagate.

**HTTP helper** — adapters share one tiny `getJson` / `postJson` helper so per-adapter code stays a single
expression:

```ts
// shared/lib/http.ts
import { ResultAsync, ok, err, okAsync, errAsync } from "neverthrow";
import { z } from "zod";

export type HttpError =
  | Readonly<{ kind: "Network"; cause: unknown }>
  | Readonly<{ kind: "Http"; status: number }>
  | Readonly<{ kind: "Parse"; issues: ReadonlyArray<z.ZodIssue> }>;

function request<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  init?: RequestInit,
): ResultAsync<z.infer<S>, HttpError> {
  return ResultAsync.fromPromise(
    fetch(url, init),
    (cause): HttpError => ({ kind: "Network", cause }),
  )
    // Every branch returns a ResultAsync (via okAsync / errAsync) so the chain has one uniform
    // type — mixing a sync Result and a ResultAsync in a single .andThen callback fights inference.
    .andThen((r): ResultAsync<unknown, HttpError> => {
      if (!r.ok) return errAsync({ kind: "Http", status: r.status });
      if (r.status === 204) return okAsync(undefined);
      return ResultAsync.fromPromise(
        r.json() as Promise<unknown>,
        (cause): HttpError => ({ kind: "Network", cause }),
      );
    })
    .andThen(json => {
      const parsed = schema.safeParse(json);
      return parsed.success
        ? ok<z.infer<S>, HttpError>(parsed.data)
        : err<z.infer<S>, HttpError>({ kind: "Parse", issues: parsed.error.issues });
    });
}

export function getJson<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
): ResultAsync<z.infer<S>, HttpError> {
  return request(url, schema);
}

export function postJson<S extends z.ZodTypeAny>(
  url: string,
  body: unknown,
  schema: S,
  init?: Omit<RequestInit, "body" | "method">  & { method?: "POST" | "PUT" | "PATCH" | "DELETE" },
): ResultAsync<z.infer<S>, HttpError> {
  return request(url, schema, {
    ...init,
    method: init?.method ?? "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
```

**Allowed `null`** — narrow list, do not extend without adding an entry here:

- React ref initial value (`useRef<HTMLElement>(null)` — React's API, not ours).
- The single line that bridges a third-party `T | null` into `Option<T>`.
- The inside of `OptionFromNullable` and the inside of the data hook before wrapping TanStack Query's surface.
- The inside of `getJson` (it converts third-party throws into `Result`; callers see no `null`).

Anything else producing or consuming `null` is a bug — fix it at the boundary.

**Allowed `undefined`** — narrow list, do not extend without adding an entry here:

- The optional-property / optional-parameter marker (`x?: T`, `init?: RequestInit`, `ref?: React.Ref<…>`). This
  is the absence marker, not a value-carrying `T | undefined` union — see the optional-values rule above.
- The same third-party boundary the `null` list covers: TanStack Query's `data: T | undefined`, wrapped with
  `O.fromNullable` inside the data hook before any consumer sees it.
- The inside of the HTTP helper: `ok(undefined)` for a `204 No Content` and the `body === undefined` no-body
  branch of `postJson`, plus passing `undefined` as the positional "no body" argument (`postJson(url, undefined,
  z.void())`).

Anything else producing or consuming a `T | undefined` value is a bug — model it as `Option<T>` instead.

#### 15. Discriminated unions for variants

When a component has variants, model them so the compiler forces correct call sites and additions of new variants
don't reshape existing ones:

```tsx
export type AlertProps =
  | Readonly<{ variant: "info"; message: string }>
  | Readonly<{ variant: "error"; message: string; onRetry: () => void }>;
```

Optional booleans are a lie when only meaningful in one branch (`onRetry?: () => void` if it's only meaningful
when `variant: 'error'`).

#### 16. type for props and shared types; interface only for declaration merging

Theme module augmentation needs `interface`; nothing else does. The choice is load-bearing: the skill leans on
discriminated unions, `Readonly<>` wrappers, and `Omit<MuiButtonProps, …> & { intent }` narrowing — all of which
read awkwardly through `interface`. Enforce with `@typescript-eslint/consistent-type-definitions: ['error',
'type']`. If the base config does the opposite (e.g.` standard-with-typescript`), override the rule.

### React 19

#### 17. React 19 idioms — refs as props, useActionState, no forwardRef, no React.FC

Refs are props. Type the prop as `ref?: React.Ref<HTMLX>` and forward it directly:

```tsx
export type SubmitButtonProps = Readonly<{
  ref?: React.Ref<HTMLButtonElement>;
  label: string;
}>;

export function SubmitButton({ ref, label }: SubmitButtonProps) {
  return <button ref={ref}>{label}</button>;
}
```

For forms, prefer `useActionState` + `<form action={…}>` over manual `onSubmit` plumbing — pending state and
result state come for free; composes with `useOptimistic`. On Next.js the action can be a Server Action marked
with `'use server'`; on Vite it's just an async client function.

Don't use `React.FC` — type the props parameter directly. Use `use()` for conditional context where `useContext`
cannot be called.

#### 18. No reflexive memoisation (React Compiler)

With `babel-plugin-react-compiler` on, skip `useMemo` / `useCallback` unless you've measured a problem or
memoisation is semantically required (referential identity passed to a third-party API). The compiler memoises
correctly more often than humans do.

#### 19. 'use client' on Next.js component files only

**Project convention:** in Next.js App Router, any file rendering MUI components is treated as a Client Component
unless the project has established a server-compatible MUI pattern. Every component file using hooks, state, refs,
browser APIs, or MUI client components starts with `'use client'`.

The directive belongs **only on the component file** (`Component.tsx`). The hook (`useComponent.ts`), styles
(`Component.styles.ts`), and per-function helper files inherit the boundary from whatever component imports them
and do *not* need their own directive. The `domain/`, `application/`, and `infrastructure/` layers are isomorphic
— same code runs in Server Components, Server Actions, Client Components, scripts, and tests. They never carry
`'use client'`.

On Vite this directive does not exist; do not add it.

### MUI 7

#### 20. MUI 7 conventions — slots / slotProps, no deep imports, cssVariables, theme augmentation

Use `slots` / `slotProps` instead of legacy `*Component` / `*Props`:

```tsx
<Accordion
  slots={{ transition: CustomTransition }}
  slotProps={{ transition: { unmountOnExit: true } }}
/>
```

Imports go one level deep, never deeper. `import Button from "@mui/material/Button"` is correct;
`import … from "@mui/material/Button/internals/x"` is forbidden — v7's `exports` field blocks deeper paths.

`createTheme({ cssVariables: true, colorSchemes: { light: true, dark: true } })` — CSS variables make dark-mode
toggles flicker-free, work cleanly with SSR, and are reachable from non-MUI CSS.

Module-augment the theme for custom tokens; don't cast or stringify:

```ts
declare module "@mui/material/styles" {
  interface Palette {
    brand: { subtle: string; bold: string };
  }
  interface PaletteOptions {
    brand?: { subtle: string; bold: string };
  }
}
```

`Hidden` was removed. Use `useMediaQuery(theme.breakpoints.up('md'))` instead.

When mixing CSS sources (Tailwind v4, hand-written CSS), opt into CSS layers via the matching provider
(`enableCssLayer` on `StyledEngineProvider` or `AppRouterCacheProvider`) to avoid specificity wars.

#### 21. sx for one-offs, styled() for anything reused

If you'd copy-paste an `sx` object more than once, it's a styled component. Styled components get semantic names
(`HeaderCell`, `EmptyState`, `Toolbar`), not visual names (`BoldGrayCell`, `Centered24pxBox`). When the design
changes, you rename a value, not a hundred imports.

#### 22. Wrapper transparency

When a wrapper accepts a forwarded MUI prop (`sx`, `disabled`, `onClick`, `aria-*`), it forwards it transparently
— or documents the override in the component's JSDoc. Silent overrides break caller expectations:

```tsx
import Button, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";

export type AppButtonProps = Readonly<
  Omit<MuiButtonProps, "color"> & { intent: "primary" | "danger" | "neutral" }
>;

export function AppButton({ intent, ...rest }: AppButtonProps) {
  const color = ({ primary: "primary", danger: "error", neutral: "inherit" } as const)[intent];
  return <Button color={color} {...rest} />;
}
```

The `...rest` spread forwards every base prop the wrapper didn't claim.

### Engineering disciplines

#### 23. One unit per file; types live with the unit; no dump files

A file holds exactly one **unit** — one component, one hook, one function, one class, or one schema/type. Types
that belong to a unit (props, return shape, local state, internal discriminators) live inline in that unit's file,
not in a sibling `Component.types.ts`. Shared types each get their own file named after the type (`Order.ts`,
`OrderStatus.ts`); a tightly-coupled cluster (entity + its supporting union) may share a file.

**Pragmatic exception:** small private helper types/functions that only the owning unit uses may stay inline in
the same file. Don't create a separate file for a one-line private helper.

**Forbidden filenames — never create these:** `types.ts`, `Component.types.ts`, `utils.ts`, `helpers.ts`,
`constants.ts`, `common.ts`, `misc.ts`, `shared.ts`, `index.ts` *containing logic* (barrel re-exports only).
Per-component constants files like `OrderTable.constants.ts` are allowed but `*.constants.ts` is usually a smell
— prefer naming the file after what it holds (`orderStatusLabels.ts`, `paginationDefaults.ts`).

Enforce with `eslint-plugin-check-file` via `check-file/filename-blocklist: ['error', {
'**/{types,utils,helpers,constants,common,misc,shared}.ts': '*', '**/*.types.ts': '*' }]`.

#### 24. Named exports only — no export default

Default exports rename themselves at every import site, drop out of `grep`, and confuse IDE auto-import.

Exception: files a framework **requires** to default-export — Next.js page-shaped files (`page.tsx`, `layout.tsx`,
`loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`, `global-error.tsx`, `middleware.ts`)
and tool configs (`next.config.*`, `vite.config.*`). At required-default boundaries, re-export a named symbol:

```tsx
// src/app/orders/page.tsx
import { OrdersPage } from "@/domains/billing/orders";
export default OrdersPage;
```

Enforce with `eslint-plugin-import` (`no-default-export` + `no-anonymous-default-export`), with the override scoped
to those files only.

#### 25. 100% unit-test coverage on changed code — with mechanical definition

Every change ships with tests. Coverage is enforced via the test runner's gate (Vitest `--coverage` with
`lines` / `branches` / `functions` / `statements` thresholds at 100) wired into CI.

**"Changed code" means, mechanically:**

- For **new files**: every line counted.
- For **modified existing files**: tests cover every changed branch and every changed visible state.

It does **not** mean "every existing line of every file touched by the diff". A one-line change in a 500-line file
needs a test for that one line, not a backfill of the other 499.

**Guards:**

- Do not write meaningless tests just to hit the gate. A test must exercise the behaviour it asserts; tautological
  tests (re-implementing the production logic in the assertion) are worse than a coverage gap.
- If 100% forces a contortion (`default:` arm on an exhaustive union, a branch the compiler already rules out),
  remove the unreachable branch — coverage gaps point at dead code, not at the rule.
- If the repo has a different coverage gate (lower threshold, exclusion globs), follow the repo's gate and explain
  any deviation in the PR description.
- No new `/* istanbul ignore */` / `/* v8 ignore */` to dodge the gate — reserved for documented adapter
  boundaries only.

Per-layer test strategy:

- **`domain/`** — pure Node tests, no DOM. Schemas, branded IDs, pure helpers, class-entity invariants.
- **`application/`** — pass mock adapter functions (plain async stubs) to the use case under test.
- **`infrastructure/`** — MSW at the network boundary. The adapter under test runs unchanged; MSW intercepts.
  Do **not** introduce context-injected client wrappers — MSW already inverts the dependency at the right place.
- **`ui/`** — Vitest + React Testing Library + MSW. Prefer `getByRole` over `getByTestId`. Hooks may have their
  own `renderHook` tests.

#### 26. Clean code — names, size, comments

Identifiers reveal intent (`sortedRows`, not `data`; `isEmailValid`, not `flag`; `submitOrderError`, not `err`).
Functions stay small and single-purpose — ~20 lines is a good ceiling, and any function that needs an internal
section comment is asking to be split. DRY, but use the rule of three: don't pre-emptively abstract two similar
lines. Comments explain *why*, not *what* — the *what* should be obvious from the names; if it isn't, fix the
names instead of writing a comment.

## Workflow

The workflow is **mode-driven**. Always classify the user's request into exactly one mode and apply only that
mode's rules. Default to the least invasive mode that fits.

### Mode selection

| Request shape | Mode | What to do |
| --- | --- | --- |
| Typo, copy change, prop rename, import fix, single-line bug fix | **Patch** | Minimal edit; no restructuring |
| New presentational component (no state / effects / fetch) | **Leaf** | One `.tsx` in parent folder |
| Component with state / effects / data / styles / tests | **Folder Component** | Three-layer split in a folder |
| New API-backed UI slice or domain entity | **Feature** | Four-layer split inside `<feature>/` |
| New route or screen-level composition | **Page** | Thin route entry + page component |
| Repo init, ESLint setup, theme config | **Setup** | Once-per-repo conventions only |

Mode selection rules:

- Verbs that imply Patch: "fix", "rename", "typo", "update copy".
- Verbs that imply scaffolding: "add", "create", "scaffold" — pick Leaf / Folder Component / Feature / Page by
  the *object* of the request.
- "Refactor this component" is Folder Component unless the user explicitly broadens to a feature.
- Setup is invoked only explicitly. Never auto-escalate to Setup from a component task.
- Do **not** scaffold empty layers, repository ports, class entities, aggregates, or `application/` use cases
  unless their concrete trigger fires (principle 11).

### Patch mode

Apply the smallest edit that satisfies the request. Don't move files, don't introduce layers, don't write tests
for code you didn't change (but **do** update tests for code you did change, if the change altered behaviour). Run
the project's type / test checks if they're already configured. If the patch crosses into a different mode (e.g.
a "rename" turns out to require extracting a hook), stop and confirm the scope change.

### Leaf mode

Single file in the parent folder. Named export. Inline props type wrapped in `Readonly<>`. No `useState` /
`useEffect` / data fetching / `styled()` definitions. If you need any of those, switch to Folder Component mode.

```tsx
// domains/billing/orders/ui/components/StatusBadge.tsx
"use client"; // Next.js App Router only

import Chip from "@mui/material/Chip";
import { type OrderStatus } from "@/domains/billing/domain/Order";

const colors = { pending: "warning", paid: "success", shipped: "info" } as const;

export function StatusBadge({ status }: Readonly<{ status: OrderStatus }>) {
  return <Chip size="small" color={colors[status]} label={status} />;
}
```

Tests: one behaviour test per visible state (here: per `status` value).

### Folder Component mode

The three-layer split inside a folder. Use the running example `OrderTable` in `domains/billing/orders/`.

**Folder location:**

- Default: `domains/<domain>/<feature>/ui/components/<Component>/`
- Cross-domain primitive: `src/shared/ui/<Component>/`
- Sub-component used by exactly one parent: nested in the parent's folder

**Files:**

| File | Responsibility | May import |
| --- | --- | --- |
| `Component.tsx` | Composition; `'use client'` if Next.js | The hook, styles, MUI primitives, children |
| `useComponent.ts` | Logic only; no JSX | React, data hooks, domain types, pure helpers, `useMediaQuery` |
| `Component.styles.ts` | `styled()` + reusable `sx` factories | `@mui/material/styles`, MUI primitives being styled |
| `Component.test.tsx` | Behaviour tests with RTL + MSW | Vitest, RTL, MSW, the component, the hook (`renderHook`) |
| `index.ts` | Re-export the component + its props type only | The component file |

**1. The hook — `useComponent.ts`:**

```ts
// domains/billing/orders/ui/components/OrderTable/useOrderTable.ts
import { useMemo, useState } from "react";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { useOrders } from "@/domains/billing/orders/ui/hooks/useOrders";
import { type Order } from "@/domains/billing/domain/Order";
import { type HttpError } from "@/shared/lib/http";
import { sortOrders } from "./sortOrders";

type SortKey = "date" | "amount";

type UseOrderTable = Readonly<{
  rows: ReadonlyArray<Order>;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  isLoading: boolean;
  error: O.Option<HttpError>;
}>;

export function useOrderTable(customerId: string): UseOrderTable {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const { orders, isLoading, error } = useOrders(customerId);
  const sorted = useMemo(
    () =>
      pipe(
        orders,
        O.map(list => sortOrders(list, sortKey)),
        O.getOrElseW(() => [] as ReadonlyArray<Order>),
      ),
    [orders, sortKey],
  );
  return { rows: sorted, sortKey, onSortChange: setSortKey, isLoading, error };
}
```

The component-local hook wraps the data hook (`useOrders`), not the adapter directly. Two consumers of `useOrders`
share the same TanStack Query cache entry because they share the same query key. The hook return surfaces `error`
as `Option<HttpError>` per principle 14 — the honest tagged failure unwrapped from `QueryError`, never
`Error | null`.

**Splitting the hook (SRP).** When the hook accumulates 3+ unrelated state groups (sort + filters + pagination +
selection) or returns 8+ keys, split into composable sub-hooks (`useTableSort`, `useTableFilters`) and compose them
in a top-level hook. Don't pre-emptively split.

**2. The styles — `OrderTable.styles.ts`:**

```ts
import { styled } from "@mui/material/styles";
import TableCell from "@mui/material/TableCell";

export const HeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightMedium,
  backgroundColor: theme.palette.background.default,
}));

export const EmptyState = styled("div")(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));
```

**3. The component — `OrderTable.tsx`:**

```tsx
"use client"; // Next.js App Router only — omit on Vite

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import * as O from "fp-ts/Option";
import { useOrderTable } from "./useOrderTable";
import { HeaderCell, EmptyState } from "./OrderTable.styles";

export type OrderTableProps = Readonly<{ customerId: string }>;

export function OrderTable({ customerId }: OrderTableProps) {
  const { rows, onSortChange, isLoading, error } = useOrderTable(customerId);

  if (isLoading) return <EmptyState>Loading…</EmptyState>;
  if (O.isSome(error)) return <EmptyState>Couldn't load orders.</EmptyState>;
  if (rows.length === 0) return <EmptyState>No orders yet.</EmptyState>;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <HeaderCell onClick={() => onSortChange("date")}>Date</HeaderCell>
          <HeaderCell onClick={() => onSortChange("amount")}>Amount</HeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.id}</TableCell>
            <TableCell>{r.total.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**4. The barrel — `index.ts`:**

```ts
export { OrderTable, type OrderTableProps } from "./OrderTable";
```

**5. Tests** use Vitest + React Testing Library + MSW; assert what the user sees (`getByRole`), not internal state.
Behaviour tests cover the golden path and every visible state (loading, error, empty, populated).

### Feature mode

Use Feature mode for a new domain entity, a new API integration, or a new feature slice. Create the four-layer
skeleton **only for layers that have content** — never scaffold empty folders.

**Skeleton** (only the folders you actually need):

```
src/domains/<domain>/
  domain/                            # bounded-context-wide entities
    Order.ts                         # Zod schema + inferred type
    OrderId.ts                       # branded ID
  <feature>/
    domain/                          # feature-specific extensions (only if any exist)
    application/                     # only if a use case meets the trigger (principle 11)
    infrastructure/
      http/<name>Api.ts              # plain async functions; Zod-parse responses
    ui/
      hooks/use<Thing>.ts            # cross-component data hooks
      components/<Component>/        # any folder components in this slice
      <FeaturePage>/                 # if a page is part of this slice
    actions.ts                       # only if Next.js Server Actions used
    index.ts                         # public surface (see principle 3 for what may/may not export)
  index.ts                           # domain barrel (re-exports public surface of features)
```

Continuing the running example — adding the `orders` feature to the `billing` domain:

**Domain — `domains/billing/domain/Money.ts`** (canonical, shared across billing features):

```ts
import { z } from "zod";
import { ok, err, type Result } from "neverthrow";

export const MoneySchema = z
  .object({
    amount: z.number().int(),
    currency: z.enum(["USD", "EUR", "GBP"]),
  })
  .readonly();

export type Money = z.infer<typeof MoneySchema>;

export type CurrencyMismatchError = Readonly<{
  kind: "CurrencyMismatch";
  a: Money["currency"];
  b: Money["currency"];
}>;

export function addMoney(a: Money, b: Money): Result<Money, CurrencyMismatchError> {
  if (a.currency !== b.currency) {
    return err({ kind: "CurrencyMismatch", a: a.currency, b: b.currency });
  }
  return ok({ amount: a.amount + b.amount, currency: a.currency });
}
```

(Plus `Order.ts` and `OrderId.ts` as shown in principles 9 and 10.)

**Infrastructure adapter — `domains/billing/orders/infrastructure/http/ordersApi.ts`** (uses the shared
`getJson` / `postJson` helpers from principle 14):

```ts
import { z } from "zod";
import { ResultAsync } from "neverthrow";
import { getJson, postJson, type HttpError } from "@/shared/lib/http";
import { OrderSchema, type Order } from "@/domains/billing/domain/Order";

export function fetchOrders(customerId: string): ResultAsync<ReadonlyArray<Order>, HttpError> {
  return getJson(`/api/customers/${customerId}/orders`, z.array(OrderSchema).readonly());
}

export function saveOrder(order: Order): ResultAsync<Order, HttpError> {
  return postJson(`/api/orders/${order.id}`, order, OrderSchema, { method: "PUT" });
}

export function authorisePayment(order: Order): ResultAsync<void, HttpError> {
  return postJson(`/api/orders/${order.id}/payment`, undefined, z.void());
}
```

Adapters return `ResultAsync<T, HttpError>` (principle 14). They never throw; HTTP failures, network failures,
and schema-parse failures land as `HttpError` values the caller can branch on.

**Optional use case — `application/checkoutOrder.ts`** (only because it meets the trigger: 2 adapters +
multi-step orchestration):

```ts
import { type ResultAsync } from "neverthrow";
import { type Order } from "@/domains/billing/domain/Order";
import { type HttpError } from "@/shared/lib/http";
import { saveOrder, authorisePayment } from "../infrastructure/http/ordersApi";

export type CheckoutInput = Readonly<{ order: Order }>;

export function checkoutOrder(input: CheckoutInput): ResultAsync<Order, HttpError> {
  return authorisePayment(input.order).andThen(() => saveOrder(input.order));
}
```

Use cases compose `ResultAsync` chains (`.andThen`, `.map`, `.mapErr`, `.orElse`). Short-circuit on the first
error; success values flow through.

Use cases **import their adapters directly** by default. Pass adapters as arguments only when there are multiple
runtime implementations, the use case is shared across environments, or tests genuinely require replacing several
side effects.

**Data hook — `ui/hooks/useOrders.ts` and `useCheckout.ts`:** see principle 12.

**Barrel — `index.ts`:**

```ts
export { OrdersPage, type OrdersPageProps } from "./ui/OrdersPage";
export { OrderTable, type OrderTableProps } from "./ui/components/OrderTable";
// Domain types exported only if other features / routes need them:
export { type Order, type OrderId } from "@/domains/billing/domain/Order";
// Do NOT export from infrastructure/, application/, or ui/hooks/.
```

### Page mode

A page is route-bound and screen-level. Two parts kept separate per principle 7:

**Page component — `domains/billing/orders/ui/OrdersPage/OrdersPage.tsx`:**

```tsx
"use client";

import { OrderTable } from "../components/OrderTable";
import { PageShell, PageTitle } from "./OrdersPage.styles";

export type OrdersPageProps = Readonly<{ customerId: string }>;

export function OrdersPage({ customerId }: OrdersPageProps) {
  return (
    <PageShell>
      <PageTitle>Orders</PageTitle>
      <OrderTable customerId={customerId} />
    </PageShell>
  );
}
```

**Route entry — `src/app/orders/page.tsx` (Next.js):**

```tsx
import { OrdersPage } from "@/domains/billing/orders";

type RouteParams = Readonly<{ params: Promise<{ customerId: string }> }>;

export default async function Page({ params }: RouteParams) {
  const { customerId } = await params;
  return <OrdersPage customerId={customerId} />;
}
```

The route entry is thin: handles params, metadata, framework default-export, and delegates composition to the
named page component.

### Setup mode

Apply **once per repo**. Only invoke when the user explicitly says "set up the project", "initialize the repo",
"configure ESLint", or similar. Never auto-escalate to Setup from a component task.

The full, step-by-step recipe lives in **`references/setup.md`** — read it and apply it in order; don't
paraphrase from memory. It covers: stack scaffold (Vite / Next.js), the dependency set with rationale, strict
`tsconfig.json`, the complete ESLint config (layer boundaries, server-only path block, type-definitions, default
exports, filename blocklist, react-hooks, react-compiler), React Compiler wiring per stack, the augmented theme,
the stack-specific MUI provider, the Vitest 100%-coverage gate plus the MSW test bootstrap, the `shared/lib/`
no-`null` helpers (`http.ts`, `zodOption.ts`), and the folder skeleton. The reference ends with a verification
checklist — Setup is done only when every box is ticked.

`references/setup.md` is the single source of truth for Setup; the Setup-mode rows in this skill's Quality
checklist mirror its final checklist.

## Special cases

### Stack adapter

The skill targets two stacks. The architectural rules are identical; only the integration points differ.

#### Vite

- **Routing layer:** `src/app/routes/` or your router's convention. Routes import features via domain barriers.
- **`'use client'`:** does not exist; do not add it.
- **MUI provider:** `StyledEngineProvider` + `ThemeProvider` + `CssBaseline`.

```tsx
  import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
  import CssBaseline from "@mui/material/CssBaseline";
  import { theme } from "@/theme";

  export function App({ children }: { children: React.ReactNode }) {
    return (
      <StyledEngineProvider enableCssLayer>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }
```

- **Data fetching:** TanStack Query throughout.

#### Next.js (App Router)

- **Routing layer:** `src/app/`, file-system routing.
- **`'use client'`:** principle 19.
- **MUI provider:** `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter` (or v14 for Next.js 14), in
  the root `layout.tsx`.

```tsx
  // src/app/layout.tsx
  import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
  import { ThemeProvider } from "@mui/material/styles";
  import CssBaseline from "@mui/material/CssBaseline";
  import { theme } from "@/theme";

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en">
        <body>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    );
  }
```

- **Server Components:** prefer Server Components for non-interactive route-level composition; don't force the
  three-layer split onto a simple Server Component. Cross into a Client Component (with the split) the moment the
  UI needs interactivity.
- **Data fetching:** initial data in a Server Component via `await fetchX(...)` from the adapter. Hand to the
  client page as props, or hydrate TanStack Query with `HydrationBoundary` + `dehydrate`.
- **Server Actions:** when a form fits, define an action in `<feature>/actions.ts` with `'use server'` and use it
  as the `useActionState` action. Server Actions parse inputs through a Zod schema before any domain or DB call —
  `'use server'` does not mean "the input is safe".

### Refactoring an existing inline component (Folder Component mode)

When asked to "refactor this component" or "split this component":

1. Identify the seams: state, effects, queries, derived values, handlers → hook. `styled()` and reusable `sx` →
   styles. JSX → component.
2. Move the hook out first; verify the test still passes.
3. Move the styles out next; verify rendering didn't shift.
4. Trim the component to composition only.
5. Add an `index.ts` if missing; update import sites once at the end instead of touching them as you go.
6. On Next.js: confirm `'use client'` is on the component file (not the hook or styles file).

When the existing component mixes data-fetching into the component-local hook (e.g. calls `fetch` directly inside
`useEffect`), also:

7. Extract the network call into `<feature>/infrastructure/http/<name>Api.ts` as a plain async function that
   parses through a Zod schema (creating the schema in `<feature>/domain/` if it doesn't exist yet).
8. Wrap the adapter in a data hook at `<feature>/ui/hooks/<useThing>.ts`.
9. Have the component-local hook consume the data hook.

### Code-splitting and virtualisation — concrete thresholds

Two performance items the React Compiler doesn't do for you:

- **Virtualise a list only when it can exceed \~100 visible rows OR profiling shows render cost.** Do not virtualise
  static lists under 100 items. Use TanStack Virtual or `@mui/x-data-grid` for tables.
- **Code-split only when one is true:** the component is a route-level entry, the component is below-the-fold and
  heavy (chart, editor, map, rich-text), or its imported package cost exceeds ~100 KB gzipped. Do not pre-emptively
  split small components.

On Vite, code-split with `React.lazy` + `Suspense`. On Next.js App Router, the framework code-splits each route
segment automatically; use `next/dynamic` for client components heavy enough to defer below the fold.

## Anti-patterns

### Mode misapplication

- **Patch escalating to refactor.** A prop rename turning into a full layer split. Stay in Patch.
- **Feature mode without a real feature.** Creating `domain/`, `application/`, `infrastructure/`, and `ui/`
  folders for a feature with one read and one component. Use Folder Component or Leaf mode.
- **Empty layer scaffold.** Creating empty `application/` or `infrastructure/server/` "for later". Create layers
  only when content exists.
- **Setup mode auto-escalation.** Touching ESLint config because you're "in the area". Setup is invoked
  explicitly.

### Architecture and layering

- **The Mixed-Layer Feature** — `Order.ts` (domain), `api.ts` (infrastructure), `useOrders.ts` (ui), and
  `OrderTable.tsx` (ui) all sitting in `<feature>/`. Move each to its layer.
- **The Sibling Reach** — `import { useFooTable } from "../OtherComponent/useOtherComponent"`. Lift the hook to
  `<feature>/ui/hooks/` (or higher).
- **The Domain Reach** — importing from another domain's internals (not via its `index.ts`). Either lift to
  `shared/` or the boundary is wrong.
- **The Page-Domain** — naming a domain after a route group (`dashboard`, `settings`). Pick a real business
  bounded context.
- **The Route → Domain Import** — a domain importing from `src/app/`. One-way arrow.
- **The Atomic-Folder Trap** — `shared/ui/atoms/`, `shared/ui/molecules/`, `shared/ui/organisms/` (principle 8).
- **The Feature Barrel Leak** — exporting `useOrderTable` (component-local) or `ordersApi` (infrastructure) from
  the feature `index.ts` (principle 3).
- **Premature port interface.** Declaring `OrderRepository` when only one adapter exists and no second is planned
  (principle 11).
- **Premature use case.** Wrapping a single `fetch` in `application/checkoutOrder.ts`. Call the adapter directly
  from the data hook.

### Domain layer (`domain/`)

- **Skipping Zod and using a hand-rolled `type`.** The schema is the anti-corruption layer.
- **Returning the raw `fetch().json()` as a domain type.** Always `Schema.parse()` at the boundary.
- **Stringly-typed IDs.** Brand them (principle 10).
- **Domain importing React / TanStack / MUI.** ESLint enforces it.
- **Premature class entity.** Promote only when a trigger fires (principle 11).
- **Mutating an entity in place.** Class entities return new instances.
- **Throwing from a pure helper.** Domain helpers that can fail return `Result<T, E>`; static factories on class
  entities return `Result<Entity, DomainError>` instead of throwing in the constructor (principle 14).

### Infrastructure (`infrastructure/`)

- **Hooks in infrastructure/.** Adapters return `ResultAsync`; hooks live in `ui/hooks/`.
- **`useQuery` inside the adapter.** Adapters must be callable from a Server Component, a test, or a script.
- **Missing `Schema.parse()`.** A `fetch` returning `.json()` as the inferred type is a hole.
- **Server-only secrets in `infrastructure/http/`.** Anything importing a server-only client belongs in
  `infrastructure/server/`.
- **Adapter throwing.** `throw new Error("Failed to fetch …")` from an adapter — return an `err({ kind: "Http",
  status })` value instead (principle 14).
- **Adapter returning `Promise<T>` instead of `ResultAsync<T, E>`.** Callers lose typed errors and have to
  re-introduce `try / catch`.

### UI layer (`ui/`)

- **Container vs. presentational dogma** — wrong axis with hooks. Split is hook / component / styles.
- **The God-Hook** — accumulating unrelated state groups in a single return. Split once you cross 3 unrelated
  groups or 8 return keys.
- **The Kitchen-Sink Hook Return.** Return only what the component consumes.
- **The Logic-In-JSX** — `data.filter(...).sort(...).map(...)` inline in the return. Hook.
- **Visual-name styled components** — `BoldGrayCell`. Name for what they are.
- **`queryOptions` factories by default** — adds a second pattern alongside `useMutation`. Default to full custom
  hooks for both reads and writes (principle 12).
- **MUI imports in `useComponent.ts`** beyond `useMediaQuery`. Styling APIs belong in `Component.styles.ts`.

### React 19

- **Still using `forwardRef`.** Use a `ref` prop.
- **Manual `onSubmit` everywhere.** Prefer `useActionState` when the form fits.
- **Reflexive `useMemo` / `useCallback`** with the React Compiler on.
- **Stray `'use client'`** on `useComponent.ts`, `Component.styles.ts`, or any non-UI layer file.

### TypeScript

- **`any` to bypass a tricky type.** Use `unknown` and narrow.
- **`as` to make a value match** outside the allow-list in principle 13.
- **Optional booleans for variants.** Discriminated union.
- **`React.FC`.** Type the props directly.
- **Extending `MuiButtonProps` without `Omit`.** Wrappers exist to *remove* options.
- **Mixing `type` and `interface`.** Use `type`; reserve `interface` for declaration merging.
- **Lifting a one-use type out of its unit.** Inline.
- **Stringly-typed APIs.** Literal unions.
- **Mutable arrays / objects in props or hook returns.**
- **Mutating function arguments.**
- **`export default` outside framework boundaries.**
- **Anonymous default export** (forbidden even at framework boundaries).

### Null, `Option`, `Result`

- **`T | null` or `T | undefined` as a value-carrying return type, hook return field, or stored state.** Use
  `Option<T>` from fp-ts (principle 14). The optional marker `x?: T` is fine — that's absence, not a `| undefined`
  value union.
- **`useState<T | null>(null)`.** Use `useState<Option<T>>(O.none)`.
- **`throw new Error(...)` from an adapter or pure domain helper.** Return `err({ kind, ... })` from `neverthrow`.
  Errors are values.
- **`try { ... } catch` around a domain or adapter call.** Use `.match` / `.mapErr` / `.andThen` on the
  `Result` / `ResultAsync`. The only `try / catch` lives inside `getJson` / `postJson` — the boundary that
  produces the `Result` in the first place.
- **Untagged error type.** `Result<T, Error>` is a regression — `Error` carries no structure. Use a tagged union
  (`{ kind: "Network"; cause: unknown } | { kind: "Http"; status: number } | ...`).
- **Mixing `fp-ts/Either` and `neverthrow.Result` in the same codebase.** Pick `neverthrow.Result`. `fp-ts` is
  imported only for `Option` (and `pipe` / `function`).
- **Bare `Promise<T>` from an adapter.** Adapters return `ResultAsync<T, AdapterError>`. The hook bridge is
  responsible for re-throwing into TanStack Query, not the adapter.
- **Letting third-party `null` leak past the boundary.** `ref.current`, `document.querySelector(...)`,
  `localStorage.getItem(...)` — the first thing the consumer does is `O.fromNullable(...)`; the rest of the file
  never sees `null`.
- **Custom "Maybe" / "Option" / "Result" helpers** when fp-ts and neverthrow already cover it. Use the libraries.

### MUI 7

- **Deep imports past one level.** Breaks at runtime.
- **Legacy `*Component` / `*Props` props.** Use `slots` / `slotProps`.
- **`sx` everywhere, no `styled()`.** Promote repeated `sx` to styled components.
- **`Hidden`.** Removed; `useMediaQuery`.
- **Type assertions on `theme.palette`.** Module-augment.
- **`cssVariables: false`.** Turning CSS variables on early avoids SSR / dark-mode pain.
- **Wrong provider for the stack.** `StyledEngineProvider` in Next.js App Router or `AppRouterCacheProvider` in
  Vite produces subtle hydration / styling bugs.
- **Silent override of forwarded MUI props.** Forward via `...rest`, or document the override.
- **`styled()` defined inside the component function.** Module scope only — defining inline re-creates the styled
  component on every render and breaks Emotion's cache.

### Next.js App Router

- **Missing `'use client'`** on a component that uses hooks, state, refs, or MUI client components.
- **Server Component using a hook.** Hooks are client-only.
- **Importing `src/app/` from a domain.** One-way arrow.
- **Importing `infrastructure/server/` from a client component.** ESLint's `import/no-restricted-paths` blocks it.
- **Re-implementing TanStack Query in Server Components.** Server Components fetch via the adapter; hydrate when
  you need both.
- **Server Action without input validation.** `'use server'` does not mean "input is safe". Parse through a Zod
  schema before any domain or DB call.

### State and data

- **Server data in Zustand or Redux.** TanStack Query exists.
- **Context as a global store.** Every consumer re-renders.
- **Context-injected API client to "enable testing".** MSW already inverts at the network boundary.
- **Unstable `queryKey`** (freshly-allocated object or string in render). Use a structured array literal.

### Testing

- **`getByTestId` when `getByRole` would work.**
- **Snapshot-only tests.**
- **Mocking the implementation instead of the network.** MSW intercepts at the network layer.
- **Skipping the regression test for "simple" fixes.**
- **Tests that pass without exercising the bug.** A regression test must fail on broken code.
- **`any` or `as unknown as Foo` in test code.**
- **Manual-only verification.**
- **Tautological tests** that re-implement production logic in the assertion.
- **`/* istanbul ignore */` to dodge the gate.**

### Code quality

- **Mega-functions.** Over ~20 lines or with internal section comments.
- **Useless names.** `data`, `result`, `flag`, `temp`.
- **Comments narrating the code.**
- **Premature abstraction** at two similar lines.
- **Duplication across files** when a shared layer would do.

## Quality checklist

Walk the checklist for the mode you applied. Items tagged with the principle number they enforce.

### All modes

- [ ] Mode selected matches the request shape; scope not expanded
- [ ] Rule precedence respected (framework > repo convention > skill conventions, principle 0)
- [ ] Tests cover changed code with no meaningless padding (principle 25)

### Patch mode

- [ ] Edit is minimal; no files moved, no layers introduced
- [ ] If behaviour changed, tests for the changed branches updated; otherwise no test changes

### Leaf mode

- [ ] Single file in the parent folder; named export; inline `Readonly<>` props type
- [ ] No state / effects / data fetching / `styled()` definitions — if any appeared, mode should have been Folder
      Component (principle 6)

### Folder Component mode

- [ ] Folder contains `Component.tsx`, `useComponent.ts`, `Component.styles.ts`, `Component.test.tsx`, `index.ts`
      (principle 5)
- [ ] Hook contains no JSX and no `@mui/material` imports except `useMediaQuery` (principle 5)
- [ ] Component contains no data-fetching, no derived-state computation, no inline `styled()` definitions
      (principle 5)
- [ ] Hook stays under 3 unrelated state groups and 8 return keys (or has been split)
- [ ] Hook returns only the keys the component consumes
- [ ] No React.FC, no forwardRef; refs are typed as a ref? prop (principle 17)
- [ ] On Next.js: `'use client'` on the component file only (principle 19)
- [ ] Props use `Readonly<{...}>`; hook returns are explicit `Readonly<{...}>` (principle 13)
- [ ] Wrapper components forward MUI base props transparently or document the override (principle 22)
- [ ] Hook return surfaces `error` / optional values as `Option<…>`, never `… | null` or `… | undefined`
      (principle 14)
- [ ] `useState<Option<T>>(O.none)` instead of `useState<T | null>(null)` (principle 14)

### Feature mode

- [ ] Layers created only where content exists; no empty `application/` or `infrastructure/server/` (principle 1)
- [ ] `<domain>` is a real bounded context, not a route grouping (principle 2; rubric applied)
- [ ] Canonical entities at `domains/<x>/domain/`; feature-private at `<feature>/domain/` (principle 1)
- [ ] Every adapter parses responses through `Schema.parse()` (principle 9)
- [ ] Adapters return `ResultAsync<T, AdapterError>` — they never throw (principle 14)
- [ ] Use cases compose with `.andThen` / `.map` / `.mapErr`; no `try / catch` and no `await` of a `ResultAsync`
      without `.match` (principle 14)
- [ ] Data hooks bridge to TanStack Query via `.match(ok => ok, e => { throw new QueryError(e) })`, parameterise
      the query/mutation error type as `QueryError<…>`, and wrap `data` / `error` in `Option`, unwrapping
      `.failure` so the surfaced error is the tagged type, not `Error` (principle 14)
- [ ] Pure domain helpers that can fail return `Result<T, DomainError>` (principle 14)
- [ ] Every entity ID is a branded type (principle 10)
- [ ] Domain layer has no React / MUI / TanStack Query / `fetch` imports (principles 2, 4)
- [ ] Data hooks at `<feature>/ui/hooks/` are full custom hooks for both reads and writes (principle 12)
- [ ] `application/` exists only if its trigger fired (principle 11); use cases import adapters directly
- [ ] Class entities / aggregates / repository ports exist only with their triggers (principle 11)
- [ ] `index.ts` exports only public surface (principle 3); no `infrastructure/` or `application/` leak

### Page mode

- [ ] Page component placement matches composition scope (principle 7)
- [ ] Page component carries the `XxxPage` suffix; full folder component
- [ ] Route entry is thin (re-exports a named page; handles params / metadata only)
- [ ] Page contains no data-fetching and no domain logic

### Setup mode

- [ ] Every box in the `references/setup.md` verification checklist is ticked — that list is the source of truth
      for Setup (strict `tsconfig`, the full ESLint rule set, React Compiler, theme, stack MUI provider, the
      Vitest 100%-coverage gate + MSW bootstrap, the `shared/lib/` no-`null` helpers, and the folder skeleton)

### Cross-cutting (always)

- [ ] `shared/ui/` is flat — no `atoms/` / `molecules/` / `organisms/` folders (principle 8)
- [ ] No dump filenames (`types.ts`, `*.types.ts`, `utils.ts`, …) (principle 23)
- [ ] No `export default` outside framework-required files (principle 24)
- [ ] No `any`; `as` casts only inside principle 13's allow-list
- [ ] No `null` or value-carrying `T | null` / `T | undefined` in code we write outside the narrow allow-lists;
      optional `x?: T` markers are fine (principle 14)
- [ ] No `throw` from a domain helper, use case, or adapter; errors are tagged values returned via
      `Result` / `ResultAsync` (principle 14)

## When to seek clarification

The skill defaults to proceeding with a safe choice. Ask only when the decision genuinely depends on information
only the user has.

**Proceed without asking:**

- **Component shape genuinely ambiguous.** Default to Leaf. Promote when the second concern appears.
- **Bounded context not obvious AND surrounding files reveal an existing domain.** Use the existing domain.
- **Bounded context cannot be inferred and the work is route-local.** Place in `src/app/<route>/` and note the
  promotion path in the PR.
- **Refactor scope unclear within a single component.** Default to the minimum split (extract the hook, leave
  styles inline) and confirm if the user wanted more.

**Do ask:**

- **Existing project diverges significantly from the conventions.** When the codebase already has a flat
  `components/`, `hooks/`, `utils/` structure or a v1-style layout with hundreds of files, ask whether to follow
  existing conventions for new work, migrate domain-by-domain, or treat the project as out-of-scope.
- **Scaffolding a reusable feature whose public API will outlive this PR.** Confirm the bounded context name and
  the public surface before locking in the barrel.
- **Headless UI / Radix / Tailwind already in the project.** Ask whether the new component should layer on those
  instead of MUI primitives.
- **Server vs. client genuinely unclear (Next.js).** When the work could plausibly stay in a Server Component (no
  interactivity yet, but likely soon), ask before forcing the boundary.

## Related skills

- **`code-review`** (sibling skill in this repo) — runs after the work lands. Its architecture and testing agents
  catch leaks across the layer or domain boundary, missing schema validation at adapter boundaries, missing test
  coverage on any of the four layers, and missing `'use client'` directives on Next.js.
- **`git-commit`** (sibling skill in this repo) — naturally takes over once the work compiles and tests pass. The
  four-layer split tends to produce neat per-layer commits when desired (one for the schema, one for the adapter,
  one for the hook, one for the component) or a single feature commit per slice.
