# Performance — universal checks

Reference for the **Performance** dimension subagent. Covers algorithmic complexity, data-layer hot paths, allocation
and memory pressure, and runtime cost. Apply only items relevant to the diff under review. The orchestrator will also
pass stack-specific files (`<stack>.md` in this directory) when the changed-file list matches a stack.

## Universal checks

- [ ] Algorithmic complexity considered for code that runs on user-controlled input sizes — no accidental `O(n²)` over
      a list that can grow
- [ ] Loops do not repeat work that could be hoisted outside (recomputing the same constant, re-querying the same
      value)
- [ ] Hot paths do not allocate inside the loop where a pre-allocated structure or reused buffer would do
- [ ] String building uses the language's idiomatic builder (StringBuilder, `String::with_capacity`,
      `array.join('')`); no quadratic concatenation in a loop
- [ ] I/O is batched where the API allows; serial round-trips replaced with batch / pipeline / multi calls
- [ ] No synchronous calls inside event loops, request handlers, or async contexts where a blocking call stalls the
      runtime
- [ ] Caching, memoisation, or precomputation considered for expensive pure computations that repeat
- [ ] Lazy evaluation used for data the consumer may not actually need (large lists, heavy joins)
- [ ] Resources (file handles, sockets, db connections) are released promptly; pooling used where the cost of
      creation is high

## Database / data layer

- [ ] No N+1 query patterns — joins, batch fetching, or `IN` lookups used instead of per-row queries
- [ ] Queries use indexed columns in `WHERE`, `JOIN`, and `ORDER BY`; new query patterns come with an index plan
- [ ] Pagination used for endpoints that can return unbounded result sets; no `SELECT *` from tables of unknown
      size
- [ ] Transactions kept short — long-running transactions block writers and inflate the rollback segment
- [ ] No chatty patterns in tight loops (one query per item) — fetch once, iterate in memory
- [ ] Read replicas / cache layers used where strong consistency is not required
- [ ] Bulk inserts / updates use the database's bulk API (`COPY`, `INSERT ... VALUES (...), (...)`, `UPSERT`),
      not row-at-a-time
