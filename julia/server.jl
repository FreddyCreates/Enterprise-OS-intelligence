#!/usr/bin/env julia
#=
JULIA ORGANISM LIVE SERVER

Official Designation: RSHIP-2026-JULIA-SERVER-001
Classification: Live JSON-RPC Server Over stdio

This is the entry point that the JavaScript bridge spawns. It:
  1. Loads all Julia Organism components
  2. Creates a live JuliaOrganism instance
  3. Reads JSON commands from stdin, one per line
  4. Writes JSON responses to stdout, one per line
  5. Runs until stdin is closed

Protocol:
  IN  → { "id": "<uuid>", "command": "<cmd>", "params": { ... } }
  OUT → { "id": "<uuid>", ...result fields... }
  ERR → { "id": "<uuid>", "error": "<message>" }

Start signal: prints "JULIA_READY\n" to stdout once loaded.

Usage:
  julia --project=. julia/server.jl [DESIGNATION]

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

using Pkg
Pkg.instantiate()   # no-op if deps already satisfied

# ── Locate the julia/ directory relative to this file ─────────────────────────
const JULIA_DIR = dirname(@__FILE__)

push!(LOAD_PATH, JULIA_DIR)

include(joinpath(JULIA_DIR, "organism_integration.jl"))
using .OrganismIntegration
using JSON

# ── Read optional designation from ARGV ───────────────────────────────────────
designation = length(ARGS) >= 1 ? ARGS[1] : "RSHIP-JULIA-LIVE-001"

# ── Boot the organism ─────────────────────────────────────────────────────────
const ORG = OrganismIntegration.create_organism(designation)

# ── Signal readiness ──────────────────────────────────────────────────────────
println("JULIA_READY")
flush(stdout)

# ── Main event loop ───────────────────────────────────────────────────────────
while !eof(stdin)
    line = readline()
    isempty(strip(line)) && continue

    response = try
        cmd = JSON.parse(line)
        OrganismIntegration.process_command(ORG, cmd)
    catch e
        id = try JSON.parse(line)["id"] catch; "" end
        Dict("id" => id, "error" => sprint(showerror, e))
    end

    println(JSON.json(response))
    flush(stdout)
end
