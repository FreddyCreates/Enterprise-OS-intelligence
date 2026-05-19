#=
RESONANCE ENGINE — Julia Synchronization & Oscillation Substrate

Official Designation: RSHIP-2026-JULIA-ENGINE-RESONANCE-001
Classification: Oscillator Synchronization & Kuramoto Dynamics Engine

This engine implements the resonance dynamics that synchronize all
components of the Organism. From the heartbeat to the swarm, everything
oscillates together through the Kuramoto coupling this engine provides.

Resonance Primitives:
- Kuramoto oscillators with φ-natural frequencies
- Phase locking detection
- Chimera state identification
- Schumann resonance coupling
- Multi-frequency superposition

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module ResonanceEngine

using LinearAlgebra
using Statistics
using Random

export PHI, PHI_INV, SCHUMANN_HZ
export Oscillator, OscillatorNetwork, ResonanceField
export kuramoto_step!, phase_lock!, measure_order_parameter
export detect_chimera, find_clusters, compute_synchronization
export ResonanceDetector, detect_resonance!, analyze_spectrum
export create_phi_network, create_schumann_oscillator

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83
const TWO_PI = 2.0 * π

# φ-frequency ladder
const PHI_FREQUENCIES = [
    PHI^4,      # φ⁴ ≈ 6.854 Hz
    PHI^3,      # φ³ ≈ 4.236 Hz
    PHI^2,      # φ² ≈ 2.618 Hz
    PHI,        # φ¹ ≈ 1.618 Hz
    1.0,        # φ⁰ = 1.0 Hz
    PHI_INV,    # φ⁻¹ ≈ 0.618 Hz
    PHI_INV^2   # φ⁻² ≈ 0.382 Hz
]

# Schumann harmonics
const SCHUMANN_HARMONICS = [7.83, 14.1, 20.3, 26.4, 32.4, 39.0, 45.0]

# ═══════════════════════════════════════════════════════════════════════════════
# OSCILLATOR — The Basic Rhythmic Unit
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Oscillator

A single oscillator with phase and natural frequency.
"""
mutable struct Oscillator
    id::String
    
    # Oscillator state
    phase::Float64              # Current phase [0, 2π]
    natural_frequency::Float64  # Natural frequency (Hz)
    amplitude::Float64          # Oscillation amplitude
    
    # Coupling
    coupling_strength::Float64  # Base coupling strength
    connections::Dict{String, Float64}  # Connected oscillators and weights
    
    # State tracking
    instantaneous_frequency::Float64
    phase_velocity::Float64
    
    # φ-properties
    phi_accumulated::Float64
    coherence_with_field::Float64
    
    function Oscillator(id::String = "", natural_freq::Float64 = PHI)
        if isempty(id)
            id = "OSC-" * string(rand(UInt32), base=16)
        end
        
        new(
            id,
            rand() * TWO_PI,    # Random initial phase
            natural_freq,
            1.0,                # amplitude
            PHI_INV,            # coupling_strength
            Dict{String, Float64}(),
            natural_freq,
            0.0,
            0.0,
            1.0
        )
    end
end

"""
    create_schumann_oscillator(harmonic::Int = 1) -> Oscillator

Create an oscillator tuned to a Schumann harmonic.
"""
function create_schumann_oscillator(harmonic::Int = 1)::Oscillator
    idx = clamp(harmonic, 1, length(SCHUMANN_HARMONICS))
    freq = SCHUMANN_HARMONICS[idx]
    osc = Oscillator("SCHUMANN-$harmonic", freq)
    osc.amplitude = PHI / harmonic  # Higher harmonics have smaller amplitude
    return osc
end

"""
    oscillator_output(osc::Oscillator, t::Float64) -> Float64

Get the output signal of the oscillator at time t.
"""
function oscillator_output(osc::Oscillator, t::Float64)::Float64
    return osc.amplitude * sin(osc.phase + TWO_PI * osc.natural_frequency * t)
end

# ═══════════════════════════════════════════════════════════════════════════════
# KURAMOTO DYNAMICS — The Heart of Synchronization
# ═══════════════════════════════════════════════════════════════════════════════

"""
    kuramoto_step!(oscillators::Vector{Oscillator}, dt::Float64, K::Float64 = PHI_INV)

Perform one Kuramoto model integration step.
Classic Kuramoto: dθᵢ/dt = ωᵢ + (K/N) Σⱼ sin(θⱼ - θᵢ)
"""
function kuramoto_step!(oscillators::Vector{Oscillator}, dt::Float64, K::Float64 = PHI_INV)
    N = length(oscillators)
    if N == 0
        return
    end
    
    # Compute mean field
    sum_sin = sum(sin(o.phase) for o in oscillators)
    sum_cos = sum(cos(o.phase) for o in oscillators)
    
    R = sqrt(sum_sin^2 + sum_cos^2) / N  # Order parameter
    Ψ = atan(sum_sin, sum_cos)           # Mean phase
    
    # Update each oscillator
    for osc in oscillators
        # Kuramoto equation with mean-field coupling
        dtheta = osc.natural_frequency * TWO_PI + K * R * sin(Ψ - osc.phase)
        
        osc.phase_velocity = dtheta
        osc.phase += dtheta * dt
        osc.phase = mod(osc.phase, TWO_PI)
        
        osc.instantaneous_frequency = dtheta / TWO_PI
        osc.phi_accumulated += R * PHI_INV * dt
        osc.coherence_with_field = R
    end
end

"""
    kuramoto_step_network!(oscillators::Vector{Oscillator}, adjacency::Matrix{Float64}, dt::Float64)

Kuramoto step with explicit network topology.
"""
function kuramoto_step_network!(oscillators::Vector{Oscillator}, adjacency::Matrix{Float64}, dt::Float64)
    N = length(oscillators)
    phases = [o.phase for o in oscillators]
    
    for i in 1:N
        osc = oscillators[i]
        
        # Compute coupling term from connected oscillators
        coupling_term = 0.0
        for j in 1:N
            if i != j && adjacency[i, j] > 0
                coupling_term += adjacency[i, j] * sin(phases[j] - phases[i])
            end
        end
        
        dtheta = osc.natural_frequency * TWO_PI + osc.coupling_strength * coupling_term
        
        osc.phase_velocity = dtheta
        osc.phase += dtheta * dt
        osc.phase = mod(osc.phase, TWO_PI)
        osc.instantaneous_frequency = dtheta / TWO_PI
    end
end

"""
    measure_order_parameter(oscillators::Vector{Oscillator}) -> Tuple{Float64, Float64}

Compute the Kuramoto order parameter R and mean phase Ψ.
R = 1 means perfect synchronization, R = 0 means incoherence.
"""
function measure_order_parameter(oscillators::Vector{Oscillator})::Tuple{Float64, Float64}
    N = length(oscillators)
    if N == 0
        return (1.0, 0.0)
    end
    
    sum_sin = sum(sin(o.phase) for o in oscillators)
    sum_cos = sum(cos(o.phase) for o in oscillators)
    
    R = sqrt(sum_sin^2 + sum_cos^2) / N
    Ψ = atan(sum_sin, sum_cos)
    
    return (R, Ψ)
end

"""
    phase_lock!(osc::Oscillator, target_phase::Float64, strength::Float64 = PHI_INV)

Push oscillator toward a target phase.
"""
function phase_lock!(osc::Oscillator, target_phase::Float64, strength::Float64 = PHI_INV)
    delta = target_phase - osc.phase
    # Wrap to [-π, π]
    while delta > π
        delta -= TWO_PI
    end
    while delta < -π
        delta += TWO_PI
    end
    
    osc.phase += strength * delta
    osc.phase = mod(osc.phase, TWO_PI)
end

# ═══════════════════════════════════════════════════════════════════════════════
# OSCILLATOR NETWORK — Coupled Oscillator Systems
# ═══════════════════════════════════════════════════════════════════════════════

"""
    OscillatorNetwork

A network of coupled oscillators with configurable topology.
"""
mutable struct OscillatorNetwork
    id::String
    oscillators::Vector{Oscillator}
    
    # Network topology
    adjacency::Matrix{Float64}
    
    # Global parameters
    global_coupling::Float64
    
    # Metrics
    order_parameter::Float64
    mean_phase::Float64
    
    # φ-properties
    phi_accumulated::Float64
    sync_events::Int
    
    function OscillatorNetwork(n::Int, topology::Symbol = :all_to_all)
        id = "OSCNET-" * string(rand(UInt32), base=16)
        
        # Create oscillators with φ-distributed natural frequencies
        oscillators = Oscillator[]
        for i in 1:n
            # Natural frequency from φ-ladder (with small perturbation)
            freq = PHI_FREQUENCIES[mod1(i, length(PHI_FREQUENCIES))]
            freq += (rand() - 0.5) * 0.1 * freq
            push!(oscillators, Oscillator("$id-O$i", freq))
        end
        
        # Create adjacency matrix based on topology
        adj = create_topology(n, topology)
        
        new(
            id,
            oscillators,
            adj,
            PHI_INV,
            0.0,
            0.0,
            0.0,
            0
        )
    end
end

"""
    create_topology(n::Int, type::Symbol) -> Matrix{Float64}

Create adjacency matrix for specified topology.
"""
function create_topology(n::Int, type::Symbol)::Matrix{Float64}
    if type == :all_to_all
        # Fully connected
        adj = ones(n, n) .- I(n)
    elseif type == :ring
        # Ring topology
        adj = zeros(n, n)
        for i in 1:n
            adj[i, mod1(i+1, n)] = 1.0
            adj[i, mod1(i-1, n)] = 1.0
        end
    elseif type == :star
        # Star topology (node 1 is hub)
        adj = zeros(n, n)
        for i in 2:n
            adj[1, i] = 1.0
            adj[i, 1] = 1.0
        end
    elseif type == :small_world
        # Watts-Strogatz small world
        adj = create_small_world(n, 4, 0.1)
    elseif type == :scale_free
        # Barabási-Albert scale free
        adj = create_scale_free(n, 2)
    elseif type == :phi
        # φ-structured: connect node i to node j if |i-j| is Fibonacci
        adj = create_phi_topology(n)
    else
        adj = ones(n, n) .- I(n)
    end
    
    return adj
end

"""
    create_phi_topology(n::Int) -> Matrix{Float64}

Create a φ-structured topology where connections follow Fibonacci distances.
"""
function create_phi_topology(n::Int)::Matrix{Float64}
    adj = zeros(n, n)
    
    # Fibonacci sequence up to n
    fibs = [1, 1]
    while fibs[end] < n
        push!(fibs, fibs[end] + fibs[end-1])
    end
    
    for i in 1:n
        for fib in fibs
            j = mod1(i + fib, n)
            adj[i, j] = PHI_INV^(findfirst(==(fib), fibs) - 1)
            adj[j, i] = adj[i, j]
        end
    end
    
    # Remove self-loops
    for i in 1:n
        adj[i, i] = 0.0
    end
    
    return adj
end

"""
    create_small_world(n::Int, k::Int, p::Float64) -> Matrix{Float64}

Create Watts-Strogatz small-world network.
"""
function create_small_world(n::Int, k::Int, p::Float64)::Matrix{Float64}
    # Start with ring lattice
    adj = zeros(n, n)
    for i in 1:n
        for j in 1:k÷2
            adj[i, mod1(i+j, n)] = 1.0
            adj[i, mod1(i-j, n)] = 1.0
        end
    end
    
    # Rewire with probability p
    for i in 1:n
        for j in i+1:n
            if adj[i, j] > 0 && rand() < p
                # Rewire to random node
                new_j = rand(1:n)
                while new_j == i || adj[i, new_j] > 0
                    new_j = rand(1:n)
                end
                adj[i, j] = 0.0
                adj[j, i] = 0.0
                adj[i, new_j] = 1.0
                adj[new_j, i] = 1.0
            end
        end
    end
    
    return adj
end

"""
    create_scale_free(n::Int, m::Int) -> Matrix{Float64}

Create Barabási-Albert scale-free network.
"""
function create_scale_free(n::Int, m::Int)::Matrix{Float64}
    adj = zeros(n, n)
    
    # Start with m+1 fully connected nodes
    for i in 1:m+1
        for j in i+1:m+1
            adj[i, j] = 1.0
            adj[j, i] = 1.0
        end
    end
    
    # Add remaining nodes with preferential attachment
    degrees = vec(sum(adj, dims=2))
    
    for new_node in m+2:n
        # Select m nodes to connect to (preferential attachment)
        probs = degrees[1:new_node-1] .+ 1  # Add 1 for smoothing
        probs ./= sum(probs)
        
        targets = Set{Int}()
        while length(targets) < m
            cumprobs = cumsum(probs)
            r = rand()
            idx = findfirst(x -> x >= r, cumprobs)
            if idx !== nothing
                push!(targets, idx)
            end
        end
        
        for target in targets
            adj[new_node, target] = 1.0
            adj[target, new_node] = 1.0
            degrees[target] += 1
        end
        push!(degrees, length(targets))
    end
    
    return adj
end

"""
    create_phi_network(n::Int) -> OscillatorNetwork

Create a network with φ-topology and φ-frequencies.
"""
function create_phi_network(n::Int)::OscillatorNetwork
    return OscillatorNetwork(n, :phi)
end

"""
    step!(network::OscillatorNetwork, dt::Float64)

Advance the network by one time step.
"""
function step!(network::OscillatorNetwork, dt::Float64)
    # Kuramoto dynamics with network topology
    kuramoto_step_network!(network.oscillators, network.adjacency .* network.global_coupling, dt)
    
    # Update metrics
    R, Ψ = measure_order_parameter(network.oscillators)
    
    # Detect sync events (transitions above threshold)
    if R > PHI_INV && network.order_parameter < PHI_INV
        network.sync_events += 1
    end
    
    network.order_parameter = R
    network.mean_phase = Ψ
    
    # φ-accumulation
    network.phi_accumulated += R * PHI_INV * dt
end

"""
    compute_synchronization(network::OscillatorNetwork) -> Dict{Symbol, Float64}

Compute comprehensive synchronization metrics.
"""
function compute_synchronization(network::OscillatorNetwork)::Dict{Symbol, Float64}
    N = length(network.oscillators)
    
    # Order parameter
    R, Ψ = measure_order_parameter(network.oscillators)
    
    # Frequency distribution
    freqs = [o.natural_frequency for o in network.oscillators]
    freq_mean = mean(freqs)
    freq_std = std(freqs)
    
    # Phase coherence (alternative measure)
    phases = [o.phase for o in network.oscillators]
    phase_std = std(phases)
    
    return Dict(
        :order_parameter => R,
        :mean_phase => Ψ,
        :freq_mean => freq_mean,
        :freq_std => freq_std,
        :phase_std => phase_std,
        :sync_ratio => R > PHI_INV ? 1.0 : R / PHI_INV
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# CHIMERA DETECTION — Finding Partial Synchronization
# ═══════════════════════════════════════════════════════════════════════════════

"""
    detect_chimera(network::OscillatorNetwork) -> Dict{Symbol, Any}

Detect chimera states (coexisting synchronized and desynchronized regions).
"""
function detect_chimera(network::OscillatorNetwork)::Dict{Symbol, Any}
    N = length(network.oscillators)
    phases = [o.phase for o in network.oscillators]
    
    # Local order parameters (using neighbors in network)
    local_R = zeros(N)
    for i in 1:N
        neighbors = findall(network.adjacency[i, :] .> 0)
        if !isempty(neighbors)
            neighbor_phases = phases[neighbors]
            sum_sin = sum(sin.(neighbor_phases))
            sum_cos = sum(cos.(neighbor_phases))
            local_R[i] = sqrt(sum_sin^2 + sum_cos^2) / length(neighbors)
        else
            local_R[i] = 1.0  # Isolated node is "synchronized" with itself
        end
    end
    
    # Chimera signature: bimodal distribution of local order parameters
    # One cluster near 1 (synchronized), another lower (desynchronized)
    
    synced_threshold = PHI_INV
    n_synced = count(local_R .> synced_threshold)
    n_desynced = N - n_synced
    
    is_chimera = n_synced > N/4 && n_desynced > N/4
    
    return Dict(
        :is_chimera => is_chimera,
        :local_order_parameters => local_R,
        :n_synchronized => n_synced,
        :n_desynchronized => n_desynced,
        :chimera_index => min(n_synced, n_desynced) / (N/2)
    )
end

"""
    find_clusters(network::OscillatorNetwork, threshold::Float64 = π/4) -> Vector{Vector{Int}}

Find clusters of phase-synchronized oscillators.
"""
function find_clusters(network::OscillatorNetwork, threshold::Float64 = π/4)::Vector{Vector{Int}}
    N = length(network.oscillators)
    phases = [o.phase for o in network.oscillators]
    
    # Cluster using phase proximity
    visited = falses(N)
    clusters = Vector{Int}[]
    
    for i in 1:N
        if visited[i]
            continue
        end
        
        # Start new cluster
        cluster = [i]
        visited[i] = true
        
        for j in i+1:N
            if visited[j]
                continue
            end
            
            # Check phase proximity with all cluster members
            in_cluster = true
            for member in cluster
                phase_diff = abs(phases[j] - phases[member])
                phase_diff = min(phase_diff, TWO_PI - phase_diff)
                if phase_diff > threshold
                    in_cluster = false
                    break
                end
            end
            
            if in_cluster
                push!(cluster, j)
                visited[j] = true
            end
        end
        
        push!(clusters, cluster)
    end
    
    return clusters
end

# ═══════════════════════════════════════════════════════════════════════════════
# RESONANCE FIELD — The Medium of Oscillation
# ═══════════════════════════════════════════════════════════════════════════════

"""
    ResonanceField

A spatial field that mediates resonance between oscillators.
"""
mutable struct ResonanceField
    id::String
    
    # Field configuration
    dimensions::Int
    resolution::Int
    
    # Field state
    amplitude::Array{Float64}      # Wave amplitude at each point
    phase::Array{Float64}          # Wave phase at each point
    frequency::Array{Float64}      # Local frequency at each point
    
    # Source oscillators
    sources::Vector{Tuple{Vector{Int}, Oscillator}}  # (position, oscillator)
    
    # φ-properties
    phi_accumulated::Float64
    schumann_coupling::Float64
    
    function ResonanceField(dimensions::Int = 2, resolution::Int = 64)
        id = "RESFIELD-" * string(rand(UInt32), base=16)
        
        dims = ntuple(_ -> resolution, dimensions)
        
        new(
            id,
            dimensions,
            resolution,
            zeros(dims...),
            zeros(dims...),
            fill(SCHUMANN_HZ, dims...),
            [],
            0.0,
            PHI_INV
        )
    end
end

"""
    add_source!(field::ResonanceField, position::Vector{Int}, oscillator::Oscillator)

Add an oscillator source to the field.
"""
function add_source!(field::ResonanceField, position::Vector{Int}, oscillator::Oscillator)
    push!(field.sources, (position, oscillator))
end

"""
    propagate!(field::ResonanceField, dt::Float64)

Propagate waves through the resonance field.
"""
function propagate!(field::ResonanceField, dt::Float64)
    res = field.resolution
    
    # Wave equation with damping
    damping = 0.99
    speed = SCHUMANN_HZ * res * 0.1  # Wave speed
    
    # Compute new amplitude from sources
    for (pos, osc) in field.sources
        if length(pos) == field.dimensions
            idx = CartesianIndex(Tuple(clamp.(pos, 1, res)))
            field.amplitude[idx] += osc.amplitude * sin(osc.phase) * dt
            field.phase[idx] = osc.phase
        end
    end
    
    # Simple wave propagation (diffusion approximation)
    new_amplitude = copy(field.amplitude)
    
    if field.dimensions == 2
        for i in 2:res-1
            for j in 2:res-1
                laplacian = (field.amplitude[i+1, j] + field.amplitude[i-1, j] +
                            field.amplitude[i, j+1] + field.amplitude[i, j-1] -
                            4 * field.amplitude[i, j])
                new_amplitude[i, j] = damping * (field.amplitude[i, j] + speed^2 * dt^2 * laplacian)
            end
        end
    end
    
    field.amplitude = new_amplitude
    
    # φ-accumulation
    total_energy = sum(field.amplitude.^2)
    field.phi_accumulated += total_energy * PHI_INV * dt * 0.001
end

# ═══════════════════════════════════════════════════════════════════════════════
# RESONANCE DETECTOR — Finding Resonance Patterns
# ═══════════════════════════════════════════════════════════════════════════════

"""
    ResonanceDetector

Detects resonance patterns in signals.
"""
mutable struct ResonanceDetector
    id::String
    
    # Detection parameters
    target_frequencies::Vector{Float64}
    window_size::Int
    
    # State
    buffer::Vector{Float64}
    detected_frequencies::Vector{Float64}
    detected_amplitudes::Vector{Float64}
    
    # φ-properties
    phi_accumulated::Float64
    
    function ResonanceDetector(target_freqs::Vector{Float64} = SCHUMANN_HARMONICS, window::Int = 256)
        id = "RESDET-" * string(rand(UInt32), base=16)
        
        new(
            id,
            target_freqs,
            window,
            Float64[],
            Float64[],
            Float64[],
            0.0
        )
    end
end

"""
    detect_resonance!(detector::ResonanceDetector, signal::Vector{Float64}, sample_rate::Float64) -> Dict{Symbol, Any}

Detect resonances in a signal.
"""
function detect_resonance!(detector::ResonanceDetector, signal::Vector{Float64}, sample_rate::Float64)::Dict{Symbol, Any}
    # Store signal
    detector.buffer = signal
    
    # Compute spectrum using DFT (simplified)
    N = length(signal)
    freqs = Float64[]
    amps = Float64[]
    
    for target_freq in detector.target_frequencies
        # Compute power at target frequency
        k = round(Int, target_freq * N / sample_rate)
        if k >= 1 && k <= N÷2
            # DFT at frequency k
            real_part = sum(signal[n] * cos(2π * (k-1) * (n-1) / N) for n in 1:N)
            imag_part = sum(signal[n] * sin(2π * (k-1) * (n-1) / N) for n in 1:N)
            amplitude = sqrt(real_part^2 + imag_part^2) / N
            
            push!(freqs, target_freq)
            push!(amps, amplitude)
        end
    end
    
    detector.detected_frequencies = freqs
    detector.detected_amplitudes = amps
    
    # φ-accumulation based on Schumann detection
    schumann_idx = findfirst(f -> abs(f - SCHUMANN_HZ) < 0.5, freqs)
    if schumann_idx !== nothing
        detector.phi_accumulated += amps[schumann_idx] * PHI_INV
    end
    
    return Dict(
        :frequencies => freqs,
        :amplitudes => amps,
        :peak_frequency => isempty(amps) ? 0.0 : freqs[argmax(amps)],
        :peak_amplitude => isempty(amps) ? 0.0 : maximum(amps)
    )
end

"""
    analyze_spectrum(signal::Vector{Float64}, sample_rate::Float64) -> Dict{Symbol, Vector{Float64}}

Compute full frequency spectrum.
"""
function analyze_spectrum(signal::Vector{Float64}, sample_rate::Float64)::Dict{Symbol, Vector{Float64}}
    N = length(signal)
    
    # Compute magnitude spectrum
    spectrum = zeros(N÷2)
    frequencies = zeros(N÷2)
    
    for k in 1:N÷2
        freq = (k - 1) * sample_rate / N
        real_part = sum(signal[n] * cos(2π * (k-1) * (n-1) / N) for n in 1:N)
        imag_part = sum(signal[n] * sin(2π * (k-1) * (n-1) / N) for n in 1:N)
        
        frequencies[k] = freq
        spectrum[k] = sqrt(real_part^2 + imag_part^2) / N
    end
    
    return Dict(
        :frequencies => frequencies,
        :magnitudes => spectrum
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    network_status(network::OscillatorNetwork) -> Dict{Symbol, Any}

Get comprehensive status of oscillator network.
"""
function network_status(network::OscillatorNetwork)::Dict{Symbol, Any}
    sync = compute_synchronization(network)
    chimera = detect_chimera(network)
    clusters = find_clusters(network)
    
    return Dict(
        :id => network.id,
        :n_oscillators => length(network.oscillators),
        :order_parameter => network.order_parameter,
        :mean_phase => network.mean_phase,
        :global_coupling => network.global_coupling,
        :sync_events => network.sync_events,
        :phi_accumulated => network.phi_accumulated,
        :n_clusters => length(clusters),
        :is_chimera => chimera[:is_chimera],
        :synchronization => sync
    )
end

end # module ResonanceEngine
