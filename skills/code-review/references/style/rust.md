# Style / Maintainability — Rust checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch Rust files.

- [ ] `cargo clippy` passes; no `#[allow(clippy::...)]` without a justification comment
- [ ] `cargo fmt` applied
- [ ] `derive` macros used appropriately (`Debug`, `Clone`, `PartialEq`, `Eq`, `Hash`, `Default`) — not auto-derived
      where the semantics are wrong
- [ ] `pub` minimal — every `pub` symbol is something the consumer needs
- [ ] Documentation comments (`///`) on every public item; examples in doctests where they aid understanding
- [ ] Module structure follows Rust idioms — `mod.rs` or `module_name.rs`, modules align with conceptual boundaries
- [ ] Error types implement `Display` and `std::error::Error`; `Debug` derived; `thiserror` / `anyhow` consistent with
      project convention
