#=
QUICK START — Load this file in the Julia REPL to get started immediately.

Usage (from the repository root):
    julia> include("julia/start.jl")

Or from the julia/ directory:
    julia> include("start.jl")

This activates the project, loads the SDK, and boots a live Organism.
=#

# Activate the project
import Pkg
Pkg.activate(@__DIR__)
Pkg.instantiate()

# Load the SDK
using RSHIPOrganism

# ── Boot a live Organism ──────────────────────────────────────────────────────
org = create_organism("RSHIP-RESEARCHER-001")

# Give it a few heartbeats so subsystems sync
for _ in 1:3
    pulse!(org)
end

println()
println("  ═══════════════════════════════════════════════════════════════")
println("  ORGANISM LIVE: $(org.designation)")
println("  ID:            $(org.id)")
println("  Heartbeats:    $(org.heartbeat_count)")
println("  φ accumulated: $(round(org.phi_accumulated, digits=6))")
println("  Coherence:     $(round(org.core.state.coherence, digits=4))")
println("  Sovereignty:   $(round(org.sovereign_core.state.sovereignty_score, digits=4))")
println("  Swarm agents:  $(length(org.swarm.agents))")
println("  Quantum qubits:$(org.quantum_register.n_qubits)")
println("  Memory nodes:  $(length(org.memory_graph.nodes))")
println("  ═══════════════════════════════════════════════════════════════")
println()
println("  ORGANISM OPERATIONS:")
println("    pulse!(org)                          # heartbeat across ALL subsystems")
println("    breathe!(org)                        # metabolic exchange")
println("    process_signal(org, randn(64))       # full signal pipeline")
println("    transform_data(org, randn(32), :phi) # φ-transform")
println("    synthesize_knowledge(org)            # crystallize intelligence")
println("    organism_status(org)                 # system vitals")
println("    full_diagnostic(org)                 # all 17 subsystems")
println()
println("  DIRECT ENGINE ACCESS:")
println("    OrganismCoreEngine.pulse!(org.core)")
println("    NeuralEngine.process!(org.neural, randn(64))")
println("    QuantumEngine.hadamard!(org.quantum_register, 1)")
println("    ResonanceEngine.step!(org.resonance_network, 0.1)")
println("    MedinaFieldEngine.evolve_field!(org.medina_field, 0.1)")
println("    SwarmEngine.optimize!(org.swarm, x -> -sum(x.^2), 50)")
println("    MemoryEngine.store!(org.memory_graph, randn(64))")
println()
println("  RESEARCHER TOOLS:")
println("    # Hypothesis testing")
println("    re = ResearcherEngine()")
println("    h = create_hypothesis(re, \"φ-resonance increases coherence\")")
println("    update_hypothesis!(re, h.id, 0.85; direction=:for)")
println()
println("    # Experiment pipelines")
println("    exp = design_experiment(re, \"coherence-test\", h.id)")
println("    run_experiment!(re, exp.id, [randn(10) for _ in 1:30])")
println()
println("    # Statistical analysis")
println("    analyze_timeseries(re, randn(200))")
println("    analyze_distribution(re, randn(100))")
println("    t_test(randn(30), randn(30) .+ 0.5)")
println("    anova_oneway([randn(20), randn(20) .+ 1, randn(20) .+ 2])")
println()
println("  AI TOOLS:")
println("    kmeans_cluster(randn(100, 4), 3)")
println("    detect_anomalies(randn(100, 4))")
println("    generate_insights(randn(200))")
println("    suggest_hypotheses(randn(200))")
println("    extract_patterns([randn(64) for _ in 1:20])")
println("    find_changepoints(vcat(randn(100), randn(100) .+ 3))")
println()
println("  RESEARCH LIBRARY:")
println("    generate_dataset(:chaos)              # logistic map")
println("    generate_dataset(:timeseries, n=500)  # trend + seasonal")
println("    generate_dataset(:cluster, n=300)     # 3 Gaussian clusters")
println("    generate_dataset(:anomaly)            # 10% contamination")
println("    benchmark_functions()                 # optimization benchmarks")
println()
println("  The Organism breathes. Nothing is separate.")
println()
