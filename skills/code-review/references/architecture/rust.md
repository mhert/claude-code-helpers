# Architecture — Rust checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch Rust
files.

- [ ] `pub` visibility minimal — only what consumers need is exposed
- [ ] Module structure follows Rust idioms (`mod.rs` or `module_name.rs`); modules align with conceptual boundaries
- [ ] Trait design favours small, focused traits over large catch-alls
- [ ] Error types implement `std::error::Error` and convert via `From` impls — no string-typed errors in libraries
- [ ] Generics and trait bounds are constrained where they matter, free where they do not
- [ ] No `Arc<Mutex<...>>` as a default — shared mutability needs justification
