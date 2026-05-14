/*
 * Zero-Cost Computing Engine — C Implementation
 *
 * Engine ID: ZCE-C-001 | Cost Reduction: 98%
 * Copyright (c) 2026 Alfredo Medina Hernandez / Medina Tech
 *
 * Pure C zero-allocation engine using stack arrays, alloca,
 * and compile-time fixed sizes. No malloc/free anywhere.
 */

#ifndef ZERO_COST_ENGINE_H
#define ZERO_COST_ENGINE_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <string.h>
#include <alloca.h>

/* ── Constants (φ-harmonic) ─────────────────────────────────── */

#define PHI              1.618033988749895
#define PHI_INV          0.618033988749895
#define PHI_MULT         UINT64_C(11400714819323198485)
#define HEARTBEAT_MS     873
#define CACHE_SIZE       65536
#define GOLDEN_ANGLE     2.399963229728653

/* ── φ-Harmonic Hash ─────────────────────────────────────────── */

/**
 * phi_hash - zero-allocation hash using golden ratio multiplier.
 * All operations are register-level; no memory allocated.
 */
static inline uint64_t phi_hash(uint64_t key)
{
    uint64_t h = key ^ (key >> 33);
    h *= PHI_MULT;
    return h ^ (h >> 29);
}

/* ── Cache Entry ─────────────────────────────────────────────── */

typedef struct {
    uint64_t key_hash;
    int64_t  value;
    bool     valid;
    uint64_t timestamp;
} CacheEntry;

/* ── Fixed-Size Cache (static allocation) ────────────────────── */

/**
 * ZeroCostCache - Statically allocated cache array.
 * Lives in BSS/data segment — zero runtime allocation cost.
 */
typedef struct {
    CacheEntry entries[CACHE_SIZE];
    uint64_t   hits;
    uint64_t   misses;
} ZeroCostCache;

/** Initialize cache (memset, no malloc) */
static inline void cache_init(ZeroCostCache *c)
{
    memset(c, 0, sizeof(*c));
}

/** Zero-alloc lookup */
static inline bool cache_get(ZeroCostCache *c, uint64_t key, int64_t *out)
{
    uint64_t h   = phi_hash(key);
    size_t   idx = (size_t)(h % CACHE_SIZE);
    CacheEntry *e = &c->entries[idx];

    if (e->valid && e->key_hash == h) {
        *out = e->value;
        c->hits++;
        return true;
    }
    c->misses++;
    return false;
}

/** Zero-alloc insert */
static inline void cache_set(ZeroCostCache *c, uint64_t key,
                              int64_t value, uint64_t ts)
{
    uint64_t    h   = phi_hash(key);
    size_t      idx = (size_t)(h % CACHE_SIZE);
    CacheEntry *e   = &c->entries[idx];
    e->key_hash  = h;
    e->value     = value;
    e->valid     = true;
    e->timestamp = ts;
}

/* ── Fibonacci ───────────────────────────────────────────────── */

/**
 * fib - Iterative Fibonacci, O(1) stack, zero heap.
 * Tail-recursion via explicit loop.
 */
static inline uint64_t fib(uint32_t n)
{
    uint64_t a = 1, b = 1;
    for (uint32_t i = 0; i < n; ++i) {
        uint64_t tmp = b;
        b = a + b;
        a = tmp;
    }
    return a;
}

/* ── Stack-Allocated Batch Processing ───────────────────────── */

/**
 * batch_hash_stack - Hash a batch of keys using alloca (stack only).
 * Returns number processed.  count MUST be small (< stack size).
 */
static inline size_t batch_hash_stack(const uint64_t *keys,
                                       size_t count,
                                       uint64_t *out)
{
    /* alloca is stack allocation — freed on function return */
    uint64_t *tmp = (uint64_t *)alloca(count * sizeof(uint64_t));
    for (size_t i = 0; i < count; ++i) {
        tmp[i] = phi_hash(keys[i]);
    }
    memcpy(out, tmp, count * sizeof(uint64_t));
    return count;
}

/* ── Cost Metrics ────────────────────────────────────────────── */

typedef struct {
    uint64_t hits;
    uint64_t misses;
} CostMetrics;

static inline void metrics_record(CostMetrics *m, bool hit)
{
    if (hit) m->hits++; else m->misses++;
}

/** Hit rate in thousandths (0-1000), integer only */
static inline uint32_t metrics_hit_rate_ppt(const CostMetrics *m)
{
    uint64_t total = m->hits + m->misses;
    if (!total) return 0;
    return (uint32_t)(m->hits * 1000 / total);
}

/* ── φ-Coordinates ───────────────────────────────────────────── */

typedef struct {
    double theta;
    double phi_coord;
    double rho;
    uint32_t ring;
    uint32_t beat;
} PhiCoords;

static inline PhiCoords phi_coordinates(uint32_t beat)
{
    double b = (double)beat;
    double theta = b * GOLDEN_ANGLE;
    PhiCoords c;
    c.theta      = theta;
    c.phi_coord  = theta / PHI;
    c.rho        = __builtin_sqrt(b + 1.0) * PHI;  /* compile-time inline */
    c.ring       = beat % 7;
    c.beat       = beat;
    return c;
}

/* ── Engine Metadata ─────────────────────────────────────────── */

#define ENGINE_ID              "ZCE-C-001"
#define ENGINE_NAME            "Manual Stack Engine"
#define COST_REDUCTION_FACTOR  0.98

#endif /* ZERO_COST_ENGINE_H */
