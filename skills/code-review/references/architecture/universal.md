# Architecture — universal checks

Reference for the **Architecture** dimension subagent. Covers layering, coupling, single responsibility, dependency
direction, and module boundaries. Apply only items relevant to the diff under review. The orchestrator will also pass
stack-specific files (`<stack>.md` in this directory) when the changed-file list matches a stack.

## Universal checks

- [ ] Each unit (class, function, module, component) has one clear responsibility — easy to summarise in a single
      sentence without "and"
- [ ] Dependencies flow in one direction; no module depends on something further "up" the layer stack
- [ ] Public surface is minimal — internals are hidden behind an interface that says what the unit *does*, not how
- [ ] No circular dependencies between modules or packages
- [ ] Cross-cutting concerns (logging, auth, telemetry) live in dedicated layers, not duplicated in every handler
- [ ] Configuration values are injected, not hardcoded inside business logic
- [ ] Side effects (I/O, network, time, randomness) are isolated behind interfaces so the core logic stays pure
- [ ] Function and module sizes are reasonable — when a file grows past comfortable scanning, it is usually doing
      too much

## Coupling and cohesion

- [ ] No leaky abstractions — callers do not need to know about implementation details to use the unit correctly
- [ ] Data structures shared across boundaries are explicit DTOs / value objects, not internal entities
- [ ] No "god objects" or "god functions" that orchestrate everything
- [ ] Avoid speculative generality — interfaces with one concrete implementation that will not get a second
- [ ] Avoid premature abstraction — three similar lines is better than a wrong abstraction
- [ ] Public symbols that exist solely to be testable are a smell; refactor for testability instead

## Error and result design

- [ ] Errors carry the context the caller needs to act on (not just a message — type, cause chain, identifying ids)
- [ ] Result types distinguish "expected failure" (handled) from "bug" (panic / abort) at the type level where the
      language allows it
- [ ] Cancellation, timeouts, and back-pressure are designed in, not bolted on after the fact
