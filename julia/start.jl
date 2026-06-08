#=
QUICK START — Load this file in the Julia REPL to get started immediately.

Usage (from the julia/ directory):
    julia> include("start.jl")

Or from anywhere:
    julia> include("/path/to/julia/start.jl")

This activates the project, loads the package, and creates an organism for you.
=#

# Activate the project
import Pkg
Pkg.activate(@__DIR__)
Pkg.instantiate()

# Load the package
using RSHIPOrganism

# Create a default organism
org = create_organism("MY-ORGANISM")

println()
println("  ✓ Organism created: $(org.designation)")
println("  ✓ AI engine ready (embedding dim: $(org.ai.embedding_dim))")
println("  ✓ Embedding store ready")
println()
println("  Try these commands:")
println("    pulse!(org)                        # heartbeat")
println("    process_signal(org, randn(64))     # process a signal")
println("    embed_text(org, \"hello world\")     # text → embedding")
println("    ai_classify(org, randn(64))        # classify signal")
println("    ai_complete(org, \"the organism\")   # generate text")
println("    organism_status(org)               # full status")
println("    embedding_status(org)              # embedding store info")
println()
println("  AI & Embeddings:")
println("    v = embed_text(org, \"quantum coherence\")")
println("    embed_and_store!(org, \"memory entry\", Dict{String,Any}(\"tag\"=>\"test\"))")
println("    search_similar(org, randn(64); top_k=3)")
println("    ai_reason(org, randn(64), \"what is this?\")")
println()
