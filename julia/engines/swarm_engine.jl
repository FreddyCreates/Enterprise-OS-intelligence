#=
SWARM ENGINE — Julia Swarm Intelligence Engine

Official Designation: RSHIP-2026-JULIA-ENGINE-SWARM-001
Classification: Collective Intelligence & Swarm Dynamics

This engine implements swarm intelligence patterns that enable
collective behavior to emerge from simple individual rules.

Swarm Primitives:
- Boid flocking behavior
- Ant colony optimization
- Particle swarm optimization
- φ-weighted collective decisions

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module SwarmEngine

using LinearAlgebra
using Statistics
using Random

export PHI, PHI_INV
export Agent, Swarm, SwarmConfig
export create_swarm, step!, optimize!, flock!
export ant_colony_optimize, particle_swarm_optimize
export compute_swarm_coherence, swarm_status

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83

# ═══════════════════════════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Agent

A single agent in the swarm.
"""
mutable struct Agent
    id::String
    position::Vector{Float64}
    velocity::Vector{Float64}
    
    # Personal best (for PSO)
    best_position::Vector{Float64}
    best_fitness::Float64
    
    # Perception
    perception_radius::Float64
    neighbors::Vector{Int}
    
    # φ-properties
    phi_accumulated::Float64
    
    function Agent(position::Vector{Float64})
        id = "AGENT-" * string(rand(UInt32), base=16)
        dim = length(position)
        new(
            id,
            copy(position),
            randn(dim) .* 0.1,
            copy(position),
            Inf,
            5.0,
            Int[],
            0.0
        )
    end
end

"""
    SwarmConfig

Configuration for swarm behavior.
"""
struct SwarmConfig
    # Flocking parameters (Reynolds rules)
    separation_weight::Float64
    alignment_weight::Float64
    cohesion_weight::Float64
    
    # PSO parameters
    inertia::Float64
    cognitive::Float64
    social::Float64
    
    # ACO parameters
    pheromone_importance::Float64
    heuristic_importance::Float64
    evaporation_rate::Float64
    
    # Velocity limits
    max_speed::Float64
    max_force::Float64
    
    function SwarmConfig(;
        separation::Float64 = PHI,
        alignment::Float64 = 1.0,
        cohesion::Float64 = PHI_INV,
        inertia::Float64 = PHI_INV * 0.9,
        cognitive::Float64 = PHI_INV,
        social::Float64 = PHI_INV,
        pheromone_imp::Float64 = 1.0,
        heuristic_imp::Float64 = PHI,
        evap_rate::Float64 = PHI_INV * 0.1,
        max_speed::Float64 = PHI,
        max_force::Float64 = PHI_INV
    )
        new(separation, alignment, cohesion, inertia, cognitive, social,
            pheromone_imp, heuristic_imp, evap_rate, max_speed, max_force)
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# SWARM
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Swarm

A collection of agents with collective behavior.
"""
mutable struct Swarm
    id::String
    agents::Vector{Agent}
    config::SwarmConfig
    
    # Swarm-level state
    centroid::Vector{Float64}
    global_best_position::Vector{Float64}
    global_best_fitness::Float64
    
    # ACO state
    pheromone_matrix::Matrix{Float64}
    
    # Metrics
    coherence::Float64
    step_count::Int
    phi_accumulated::Float64
    
    function Swarm(n_agents::Int, dim::Int = 3, config::SwarmConfig = SwarmConfig())
        id = "SWARM-" * string(rand(UInt32), base=16)
        
        # Create agents with random positions
        agents = [Agent(randn(dim) .* 10) for _ in 1:n_agents]
        
        # Initialize centroid
        centroid = mean([a.position for a in agents])
        
        new(
            id, agents, config,
            centroid, zeros(dim), Inf,
            zeros(n_agents, n_agents),
            1.0, 0, 0.0
        )
    end
end

"""
    create_swarm(n_agents::Int, dim::Int = 3) -> Swarm

Create a new swarm.
"""
function create_swarm(n_agents::Int, dim::Int = 3)::Swarm
    return Swarm(n_agents, dim)
end

# ═══════════════════════════════════════════════════════════════════════════════
# FLOCKING (Boids)
# ═══════════════════════════════════════════════════════════════════════════════

"""
    find_neighbors!(swarm::Swarm)

Update neighbor lists for all agents.
"""
function find_neighbors!(swarm::Swarm)
    n = length(swarm.agents)
    
    for i in 1:n
        swarm.agents[i].neighbors = Int[]
        for j in 1:n
            if i != j
                dist = norm(swarm.agents[i].position .- swarm.agents[j].position)
                if dist < swarm.agents[i].perception_radius
                    push!(swarm.agents[i].neighbors, j)
                end
            end
        end
    end
end

"""
    separation_force(agent::Agent, neighbors::Vector{Agent}) -> Vector{Float64}

Steer to avoid crowding local flockmates.
"""
function separation_force(agent::Agent, neighbors::Vector{Agent})::Vector{Float64}
    if isempty(neighbors)
        return zeros(length(agent.position))
    end
    
    force = zeros(length(agent.position))
    
    for neighbor in neighbors
        diff = agent.position .- neighbor.position
        dist = norm(diff)
        if dist > 1e-6
            # Weight by inverse distance
            force .+= diff ./ dist^2
        end
    end
    
    return force ./ length(neighbors)
end

"""
    alignment_force(agent::Agent, neighbors::Vector{Agent}) -> Vector{Float64}

Steer towards average heading of local flockmates.
"""
function alignment_force(agent::Agent, neighbors::Vector{Agent})::Vector{Float64}
    if isempty(neighbors)
        return zeros(length(agent.position))
    end
    
    avg_velocity = mean([n.velocity for n in neighbors])
    return avg_velocity .- agent.velocity
end

"""
    cohesion_force(agent::Agent, neighbors::Vector{Agent}) -> Vector{Float64}

Steer towards average position of local flockmates.
"""
function cohesion_force(agent::Agent, neighbors::Vector{Agent})::Vector{Float64}
    if isempty(neighbors)
        return zeros(length(agent.position))
    end
    
    avg_position = mean([n.position for n in neighbors])
    return avg_position .- agent.position
end

"""
    flock!(swarm::Swarm) -> Dict{Symbol, Any}

Execute one flocking step.
"""
function flock!(swarm::Swarm)::Dict{Symbol, Any}
    config = swarm.config
    
    # Update neighbors
    find_neighbors!(swarm)
    
    for agent in swarm.agents
        # Get neighbor agents
        neighbors = [swarm.agents[i] for i in agent.neighbors]
        
        if !isempty(neighbors)
            # Reynolds rules
            sep = separation_force(agent, neighbors) .* config.separation_weight
            ali = alignment_force(agent, neighbors) .* config.alignment_weight
            coh = cohesion_force(agent, neighbors) .* config.cohesion_weight
            
            # Combined force
            force = sep .+ ali .+ coh
            
            # Limit force
            force_mag = norm(force)
            if force_mag > config.max_force
                force = force ./ force_mag .* config.max_force
            end
            
            # Apply force
            agent.velocity .+= force
        end
        
        # Limit speed
        speed = norm(agent.velocity)
        if speed > config.max_speed
            agent.velocity = agent.velocity ./ speed .* config.max_speed
        end
        
        # Update position
        agent.position .+= agent.velocity
        
        # φ-accumulation
        agent.phi_accumulated += norm(agent.velocity) * PHI_INV * 0.001
    end
    
    # Update swarm state
    swarm.centroid = mean([a.position for a in swarm.agents])
    swarm.coherence = compute_swarm_coherence(swarm)
    swarm.step_count += 1
    swarm.phi_accumulated += swarm.coherence * PHI_INV * 0.001
    
    return Dict(
        :centroid => swarm.centroid,
        :coherence => swarm.coherence,
        :step => swarm.step_count
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# PARTICLE SWARM OPTIMIZATION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    particle_swarm_optimize(swarm::Swarm, fitness::Function, n_iterations::Int = 100) -> Dict{Symbol, Any}

Particle swarm optimization.
"""
function particle_swarm_optimize(swarm::Swarm, fitness::Function, n_iterations::Int = 100)::Dict{Symbol, Any}
    config = swarm.config
    
    # Initialize personal and global bests
    for agent in swarm.agents
        f = fitness(agent.position)
        agent.best_fitness = f
        agent.best_position = copy(agent.position)
        
        if f < swarm.global_best_fitness
            swarm.global_best_fitness = f
            swarm.global_best_position = copy(agent.position)
        end
    end
    
    history = Float64[]
    
    for iter in 1:n_iterations
        for agent in swarm.agents
            # PSO velocity update
            r1, r2 = rand(), rand()
            
            cognitive_term = config.cognitive .* r1 .* (agent.best_position .- agent.position)
            social_term = config.social .* r2 .* (swarm.global_best_position .- agent.position)
            
            agent.velocity = config.inertia .* agent.velocity .+ cognitive_term .+ social_term
            
            # Limit velocity
            speed = norm(agent.velocity)
            if speed > config.max_speed
                agent.velocity = agent.velocity ./ speed .* config.max_speed
            end
            
            # Update position
            agent.position .+= agent.velocity
            
            # Evaluate fitness
            f = fitness(agent.position)
            
            # Update personal best
            if f < agent.best_fitness
                agent.best_fitness = f
                agent.best_position = copy(agent.position)
                
                # Update global best
                if f < swarm.global_best_fitness
                    swarm.global_best_fitness = f
                    swarm.global_best_position = copy(agent.position)
                end
            end
        end
        
        push!(history, swarm.global_best_fitness)
        swarm.step_count += 1
        swarm.phi_accumulated += PHI_INV * 0.001
    end
    
    return Dict(
        :best_position => swarm.global_best_position,
        :best_fitness => swarm.global_best_fitness,
        :history => history,
        :iterations => n_iterations
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# ANT COLONY OPTIMIZATION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    ant_colony_optimize(distance_matrix::Matrix{Float64}, n_ants::Int, n_iterations::Int, config::SwarmConfig = SwarmConfig()) -> Dict{Symbol, Any}

Ant colony optimization for TSP-like problems.
"""
function ant_colony_optimize(distance_matrix::Matrix{Float64}, n_ants::Int, n_iterations::Int, config::SwarmConfig = SwarmConfig())::Dict{Symbol, Any}
    n_cities = size(distance_matrix, 1)
    
    # Initialize pheromone
    pheromone = ones(n_cities, n_cities) .* 0.1
    
    # Heuristic (inverse distance)
    heuristic = 1.0 ./ (distance_matrix .+ 1e-10)
    
    best_tour = Int[]
    best_length = Inf
    history = Float64[]
    
    α = config.pheromone_importance
    β = config.heuristic_importance
    ρ = config.evaporation_rate
    
    for iter in 1:n_iterations
        all_tours = Vector{Int}[]
        all_lengths = Float64[]
        
        for ant in 1:n_ants
            # Construct tour
            tour = Int[]
            visited = falses(n_cities)
            
            # Start from random city
            current = rand(1:n_cities)
            push!(tour, current)
            visited[current] = true
            
            while length(tour) < n_cities
                # Compute probabilities
                probs = zeros(n_cities)
                for j in 1:n_cities
                    if !visited[j]
                        probs[j] = pheromone[current, j]^α * heuristic[current, j]^β
                    end
                end
                
                # Normalize
                total = sum(probs)
                if total > 0
                    probs ./= total
                else
                    # Uniform over unvisited
                    for j in 1:n_cities
                        if !visited[j]
                            probs[j] = 1.0 / (n_cities - length(tour))
                        end
                    end
                end
                
                # Select next city
                cumprobs = cumsum(probs)
                r = rand()
                next = findfirst(x -> x >= r, cumprobs)
                if next === nothing
                    next = findfirst(.!visited)
                end
                
                push!(tour, next)
                visited[next] = true
                current = next
            end
            
            # Compute tour length
            tour_length = 0.0
            for i in 1:n_cities-1
                tour_length += distance_matrix[tour[i], tour[i+1]]
            end
            tour_length += distance_matrix[tour[end], tour[1]]  # Return to start
            
            push!(all_tours, tour)
            push!(all_lengths, tour_length)
            
            if tour_length < best_length
                best_length = tour_length
                best_tour = copy(tour)
            end
        end
        
        # Evaporate pheromone
        pheromone .*= (1 - ρ)
        
        # Deposit pheromone
        for (tour, len) in zip(all_tours, all_lengths)
            deposit = 1.0 / len
            for i in 1:n_cities-1
                pheromone[tour[i], tour[i+1]] += deposit
                pheromone[tour[i+1], tour[i]] += deposit
            end
            pheromone[tour[end], tour[1]] += deposit
            pheromone[tour[1], tour[end]] += deposit
        end
        
        push!(history, best_length)
    end
    
    return Dict(
        :best_tour => best_tour,
        :best_length => best_length,
        :history => history,
        :pheromone => pheromone
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# COLLECTIVE INTELLIGENCE
# ═══════════════════════════════════════════════════════════════════════════════

"""
    compute_swarm_coherence(swarm::Swarm) -> Float64

Compute swarm coherence based on velocity alignment.
"""
function compute_swarm_coherence(swarm::Swarm)::Float64
    velocities = [a.velocity for a in swarm.agents]
    
    # Normalize velocities
    unit_velocities = []
    for v in velocities
        n = norm(v)
        if n > 1e-10
            push!(unit_velocities, v ./ n)
        end
    end
    
    if isempty(unit_velocities)
        return 1.0
    end
    
    # Compute mean direction
    mean_dir = mean(unit_velocities)
    coherence = norm(mean_dir)
    
    return coherence
end

"""
    step!(swarm::Swarm) -> Dict{Symbol, Any}

Generic step function (defaults to flocking).
"""
function step!(swarm::Swarm)::Dict{Symbol, Any}
    return flock!(swarm)
end

"""
    optimize!(swarm::Swarm, fitness::Function, n_iterations::Int = 100) -> Dict{Symbol, Any}

Generic optimization (defaults to PSO).
"""
function optimize!(swarm::Swarm, fitness::Function, n_iterations::Int = 100)::Dict{Symbol, Any}
    return particle_swarm_optimize(swarm, fitness, n_iterations)
end

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    swarm_status(swarm::Swarm) -> Dict{Symbol, Any}

Get swarm status.
"""
function swarm_status(swarm::Swarm)::Dict{Symbol, Any}
    return Dict(
        :id => swarm.id,
        :n_agents => length(swarm.agents),
        :centroid => swarm.centroid,
        :coherence => swarm.coherence,
        :global_best_fitness => swarm.global_best_fitness,
        :step_count => swarm.step_count,
        :phi_accumulated => swarm.phi_accumulated,
        :avg_agent_phi => mean([a.phi_accumulated for a in swarm.agents])
    )
end

end # module SwarmEngine
