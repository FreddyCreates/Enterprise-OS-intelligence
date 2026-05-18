#=
EVOLUTION SYNTHESIZER — Julia Genetic & Evolutionary Algorithms

Official Designation: RSHIP-2026-JULIA-SYNTHESIZER-EVOLUTION-001
Classification: Evolutionary Optimization & Adaptation

This synthesizer implements evolutionary algorithms for
optimization and adaptation. It enables the Organism to
evolve solutions through selection, mutation, and crossover.

Evolution Operations:
- Genetic algorithms
- Evolutionary strategies
- Differential evolution
- φ-guided mutation

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module EvolutionSynthesizer

using LinearAlgebra
using Statistics
using Random

export PHI, PHI_INV
export Individual, Population, EvolutionConfig
export evolve!, select_parents, crossover, mutate
export tournament_select, roulette_select
export evolution_status

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83

# ═══════════════════════════════════════════════════════════════════════════════
# INDIVIDUAL
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Individual

A single individual in the population.
"""
mutable struct Individual
    id::String
    genes::Vector{Float64}
    fitness::Float64
    age::Int
    
    # φ-properties
    phi_score::Float64
    
    function Individual(genes::Vector{Float64})
        id = "IND-" * string(rand(UInt32), base=16)
        new(id, genes, Inf, 0, 0.0)
    end
end

"""
    EvolutionConfig

Configuration for evolutionary algorithm.
"""
struct EvolutionConfig
    population_size::Int
    gene_length::Int
    
    # Selection
    tournament_size::Int
    elitism_count::Int
    
    # Crossover
    crossover_rate::Float64
    crossover_type::Symbol  # :single_point, :two_point, :uniform, :phi
    
    # Mutation
    mutation_rate::Float64
    mutation_strength::Float64
    mutation_type::Symbol  # :gaussian, :uniform, :phi
    
    # Bounds
    gene_min::Float64
    gene_max::Float64
    
    function EvolutionConfig(;
        pop_size::Int = 100,
        gene_length::Int = 10,
        tournament::Int = 3,
        elitism::Int = 2,
        crossover_rate::Float64 = PHI_INV,
        crossover_type::Symbol = :phi,
        mutation_rate::Float64 = PHI_INV * 0.1,
        mutation_strength::Float64 = PHI_INV,
        mutation_type::Symbol = :phi,
        gene_min::Float64 = -10.0,
        gene_max::Float64 = 10.0
    )
        new(pop_size, gene_length, tournament, elitism,
            crossover_rate, crossover_type,
            mutation_rate, mutation_strength, mutation_type,
            gene_min, gene_max)
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# POPULATION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Population

The evolving population.
"""
mutable struct Population
    id::String
    individuals::Vector{Individual}
    config::EvolutionConfig
    
    # Best individual tracking
    best_individual::Union{Individual, Nothing}
    best_fitness::Float64
    
    # History
    fitness_history::Vector{Float64}
    diversity_history::Vector{Float64}
    
    # Generation counter
    generation::Int
    
    # φ-properties
    phi_accumulated::Float64
    
    function Population(config::EvolutionConfig)
        id = "POP-" * string(rand(UInt32), base=16)
        
        # Initialize random individuals
        individuals = Individual[]
        for _ in 1:config.population_size
            genes = rand(config.gene_length) .* (config.gene_max - config.gene_min) .+ config.gene_min
            push!(individuals, Individual(genes))
        end
        
        new(id, individuals, config, nothing, Inf, Float64[], Float64[], 0, 0.0)
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# SELECTION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    tournament_select(pop::Population) -> Individual

Tournament selection.
"""
function tournament_select(pop::Population)::Individual
    tournament = rand(pop.individuals, pop.config.tournament_size)
    return tournament[argmin([ind.fitness for ind in tournament])]
end

"""
    roulette_select(pop::Population) -> Individual

Fitness-proportionate (roulette wheel) selection.
"""
function roulette_select(pop::Population)::Individual
    # Invert fitness for minimization (higher fitness = lower selection prob)
    max_fit = maximum(ind.fitness for ind in pop.individuals)
    inv_fitness = [max_fit - ind.fitness + 1e-10 for ind in pop.individuals]
    
    total = sum(inv_fitness)
    probs = inv_fitness ./ total
    
    cumprobs = cumsum(probs)
    r = rand()
    idx = findfirst(x -> x >= r, cumprobs)
    
    return idx === nothing ? pop.individuals[end] : pop.individuals[idx]
end

"""
    select_parents(pop::Population; method::Symbol = :tournament) -> Tuple{Individual, Individual}

Select two parents for reproduction.
"""
function select_parents(pop::Population; method::Symbol = :tournament)::Tuple{Individual, Individual}
    if method == :tournament
        parent1 = tournament_select(pop)
        parent2 = tournament_select(pop)
    else
        parent1 = roulette_select(pop)
        parent2 = roulette_select(pop)
    end
    
    return (parent1, parent2)
end

# ═══════════════════════════════════════════════════════════════════════════════
# CROSSOVER
# ═══════════════════════════════════════════════════════════════════════════════

"""
    crossover(parent1::Individual, parent2::Individual, config::EvolutionConfig) -> Tuple{Individual, Individual}

Perform crossover between two parents.
"""
function crossover(parent1::Individual, parent2::Individual, config::EvolutionConfig)::Tuple{Individual, Individual}
    if rand() > config.crossover_rate
        return (Individual(copy(parent1.genes)), Individual(copy(parent2.genes)))
    end
    
    n = config.gene_length
    
    if config.crossover_type == :single_point
        point = rand(1:n-1)
        child1_genes = vcat(parent1.genes[1:point], parent2.genes[point+1:end])
        child2_genes = vcat(parent2.genes[1:point], parent1.genes[point+1:end])
        
    elseif config.crossover_type == :two_point
        points = sort(rand(1:n, 2))
        p1, p2 = points[1], points[2]
        
        child1_genes = vcat(parent1.genes[1:p1], parent2.genes[p1+1:p2], parent1.genes[p2+1:end])
        child2_genes = vcat(parent2.genes[1:p1], parent1.genes[p1+1:p2], parent2.genes[p2+1:end])
        
    elseif config.crossover_type == :uniform
        mask = rand(Bool, n)
        child1_genes = [mask[i] ? parent1.genes[i] : parent2.genes[i] for i in 1:n]
        child2_genes = [mask[i] ? parent2.genes[i] : parent1.genes[i] for i in 1:n]
        
    elseif config.crossover_type == :phi
        # φ-blended crossover
        child1_genes = PHI_INV .* parent1.genes .+ (1 - PHI_INV) .* parent2.genes
        child2_genes = (1 - PHI_INV) .* parent1.genes .+ PHI_INV .* parent2.genes
        
    else
        child1_genes = copy(parent1.genes)
        child2_genes = copy(parent2.genes)
    end
    
    return (Individual(child1_genes), Individual(child2_genes))
end

# ═══════════════════════════════════════════════════════════════════════════════
# MUTATION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    mutate!(individual::Individual, config::EvolutionConfig)

Mutate an individual.
"""
function mutate!(individual::Individual, config::EvolutionConfig)
    for i in 1:config.gene_length
        if rand() < config.mutation_rate
            if config.mutation_type == :gaussian
                individual.genes[i] += randn() * config.mutation_strength
                
            elseif config.mutation_type == :uniform
                individual.genes[i] += (rand() - 0.5) * 2 * config.mutation_strength
                
            elseif config.mutation_type == :phi
                # φ-guided mutation: mutation strength scaled by φ
                direction = rand() < 0.5 ? 1.0 : -1.0
                individual.genes[i] += direction * rand() * config.mutation_strength * PHI_INV
                
                # Occasionally, mutate by φ factor
                if rand() < PHI_INV * 0.1
                    individual.genes[i] *= rand() < 0.5 ? PHI : PHI_INV
                end
            end
            
            # Clamp to bounds
            individual.genes[i] = clamp(individual.genes[i], config.gene_min, config.gene_max)
        end
    end
    
    # φ-score based on mutation activity
    individual.phi_score += config.mutation_rate * PHI_INV
end

# ═══════════════════════════════════════════════════════════════════════════════
# EVOLUTION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    evolve!(pop::Population, fitness_fn::Function; generations::Int = 100) -> Dict{Symbol, Any}

Run evolutionary algorithm.
"""
function evolve!(pop::Population, fitness_fn::Function; generations::Int = 100)::Dict{Symbol, Any}
    config = pop.config
    
    for gen in 1:generations
        # Evaluate fitness
        for ind in pop.individuals
            ind.fitness = fitness_fn(ind.genes)
            ind.age += 1
        end
        
        # Update best
        current_best = pop.individuals[argmin([ind.fitness for ind in pop.individuals])]
        if pop.best_individual === nothing || current_best.fitness < pop.best_fitness
            pop.best_individual = current_best
            pop.best_fitness = current_best.fitness
        end
        
        # Record history
        push!(pop.fitness_history, pop.best_fitness)
        push!(pop.diversity_history, compute_diversity(pop))
        
        # Create next generation
        next_gen = Individual[]
        
        # Elitism
        sorted_inds = sort(pop.individuals, by = ind -> ind.fitness)
        for i in 1:config.elitism_count
            push!(next_gen, Individual(copy(sorted_inds[i].genes)))
        end
        
        # Reproduction
        while length(next_gen) < config.population_size
            parent1, parent2 = select_parents(pop)
            child1, child2 = crossover(parent1, parent2, config)
            
            mutate!(child1, config)
            mutate!(child2, config)
            
            push!(next_gen, child1)
            if length(next_gen) < config.population_size
                push!(next_gen, child2)
            end
        end
        
        pop.individuals = next_gen
        pop.generation = gen
        pop.phi_accumulated += PHI_INV * 0.001
    end
    
    return Dict(
        :best_genes => pop.best_individual.genes,
        :best_fitness => pop.best_fitness,
        :generations => generations,
        :final_diversity => compute_diversity(pop),
        :fitness_history => pop.fitness_history
    )
end

"""
    compute_diversity(pop::Population) -> Float64

Compute genetic diversity of population.
"""
function compute_diversity(pop::Population)::Float64
    n = length(pop.individuals)
    if n < 2
        return 0.0
    end
    
    # Average pairwise distance
    total_dist = 0.0
    count = 0
    
    for i in 1:n
        for j in i+1:n
            total_dist += norm(pop.individuals[i].genes .- pop.individuals[j].genes)
            count += 1
        end
    end
    
    return total_dist / count
end

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    evolution_status(pop::Population) -> Dict{Symbol, Any}

Get evolution status.
"""
function evolution_status(pop::Population)::Dict{Symbol, Any}
    fitness_vals = [ind.fitness for ind in pop.individuals]
    ages = [ind.age for ind in pop.individuals]
    
    return Dict(
        :id => pop.id,
        :generation => pop.generation,
        :population_size => length(pop.individuals),
        :best_fitness => pop.best_fitness,
        :mean_fitness => mean(fitness_vals),
        :fitness_std => std(fitness_vals),
        :diversity => compute_diversity(pop),
        :mean_age => mean(ages),
        :phi_accumulated => pop.phi_accumulated
    )
end

end # module EvolutionSynthesizer
