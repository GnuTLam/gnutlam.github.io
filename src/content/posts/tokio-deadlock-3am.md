---
id:      2
title:   "Debugging a Tokio Deadlock at 3AM"
excerpt: "Post-mortem: one Mutex::lock, forty-seven minutes of stuck matchmaking, and the blame trail."
date:    "APR 14, 2026"
iso:     "2026-04-14"
tags:    ["rust", "tokio", "post-mortem"]
read:    "9 MIN READ"
preview: "DEADLOCK"
---

At 02:47 the matchmaking shard stopped pairing players. No crash, no panic, no error
log — just silence. Forty-seven minutes of stuck queues and a pager that would not
stop. This is the post-mortem.

## The symptom

Players entered the queue and never left it. CPU was near zero. The process was alive
and answering health checks. Everything looked *fine*, which is the worst possible
state for a 3AM debugging session.

```mermaid MATCHMAKING SHARD — STUCK STATE
flowchart LR
  P["player"] --> Q["queue 14,200 waiting"]
  Q -. blocked .-> M["matcher held lock"]
  M --> G["game"]
```

## Finding the lock

The matcher held a `tokio::sync::Mutex` while it called an async function that, under
load, awaited a network round-trip. Holding a lock across an `.await` point is the
classic Tokio footgun: the task yields *while holding the lock*, and the scheduler
happily parks it behind the very work that needs the lock to proceed.

```rust
// BEFORE — lock held across await, deadlocks under contention
let mut pool = self.pool.lock().await;
let candidate = self.fetch_candidate(&pool).await?;  // <-- awaits while locked
pool.insert(candidate);
```

The fix is ownership, not bigger locks. Pull the data out, drop the guard *before* the
await, and let the channel carry the result back.

```rust
// AFTER — guard dropped before the await; contention surface gone
let snapshot = {
    let pool = self.pool.lock().await;
    pool.snapshot()                       // cheap clone, guard drops here
};
let candidate = self.fetch_candidate(&snapshot).await?;
self.tx.send(candidate).await?;           // channel owns the hand-off
```

## How we caught it for good

- Added a Clippy lint for `MutexGuard` held across `await`
- Wrapped every lock acquisition in a 5s `timeout` that logs the holder's span
- Replaced two more shared-state hotspots with message passing

:::warn The real lesson
A deadlock is rarely a locking bug. It's an *ownership* bug wearing a lock as a
costume. When you find yourself reaching for a bigger mutex, reach for a channel
instead.
:::

> We shipped the fix at 03:41. Queues drained in ninety seconds. I went back to bed
> and wrote this the next morning, because the only thing worse than a 3AM deadlock is
> the same deadlock at 3AM next month.
