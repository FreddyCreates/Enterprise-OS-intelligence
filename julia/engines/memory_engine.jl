#=
MEMORY ENGINE — Julia Memory & Knowledge Persistence

Official Designation: RSHIP-2026-JULIA-ENGINE-MEMORY-001
Classification: Knowledge Graph & Memory Management

This engine manages the persistent memory of the Organism,
storing knowledge crystals, experiences, and learned patterns
for future retrieval.

Memory Primitives:
- Knowledge graph storage
- Associative memory retrieval
- Hebbian memory traces
- φ-indexed temporal memory

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module MemoryEngine

using LinearAlgebra
using Statistics

export PHI, PHI_INV
export MemoryNode, MemoryEdge, KnowledgeGraph
export store!, retrieve, consolidate!
export TemporalMemory, remember!, recall
export memory_status

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83

# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

"""
    MemoryNode

A node in the knowledge graph.
"""
mutable struct MemoryNode
    id::String
    content::Vector{Float64}
    metadata::Dict{Symbol, Any}
    
    # Memory properties
    activation::Float64
    last_accessed::Float64
    access_count::Int
    
    # φ-properties
    phi_weight::Float64
    
    function MemoryNode(content::Vector{Float64}; metadata::Dict{Symbol, Any} = Dict())
        id = "MEM-" * string(rand(UInt32), base=16)
        new(id, content, metadata, 1.0, time(), 1, PHI_INV)
    end
end

"""
    MemoryEdge

An edge connecting memory nodes.
"""
mutable struct MemoryEdge
    source::String
    target::String
    weight::Float64
    edge_type::Symbol
    
    # Hebbian trace
    trace::Float64
    
    function MemoryEdge(source::String, target::String; weight::Float64 = 1.0, edge_type::Symbol = :association)
        new(source, target, weight, edge_type, PHI_INV)
    end
end

"""
    KnowledgeGraph

The complete knowledge graph for memory storage.
"""
mutable struct KnowledgeGraph
    id::String
    nodes::Dict{String, MemoryNode}
    edges::Vector{MemoryEdge}
    
    # Indices for fast retrieval
    adjacency::Dict{String, Vector{String}}
    
    # Graph properties
    n_nodes::Int
    n_edges::Int
    
    # φ-properties
    phi_accumulated::Float64
    consolidation_count::Int
    
    function KnowledgeGraph()
        id = "KG-" * string(rand(UInt32), base=16)
        new(id, Dict(), MemoryEdge[], Dict(), 0, 0, 0.0, 0)
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE GRAPH OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    store!(graph::KnowledgeGraph, content::Vector{Float64}; metadata::Dict = Dict()) -> String

Store a memory in the knowledge graph. Returns node ID.
"""
function store!(graph::KnowledgeGraph, content::Vector{Float64}; metadata::Dict{Symbol, Any} = Dict{Symbol, Any}())::String
    node = MemoryNode(content; metadata = metadata)
    
    graph.nodes[node.id] = node
    graph.adjacency[node.id] = String[]
    graph.n_nodes += 1
    
    # Find similar memories and create associations
    create_associations!(graph, node)
    
    graph.phi_accumulated += PHI_INV * 0.001
    
    return node.id
end

"""
    create_associations!(graph::KnowledgeGraph, new_node::MemoryNode)

Create associative edges to similar memories.
"""
function create_associations!(graph::KnowledgeGraph, new_node::MemoryNode)
    threshold = PHI_INV * 0.5  # Similarity threshold
    
    for (id, existing) in graph.nodes
        if id == new_node.id
            continue
        end
        
        # Compute cosine similarity
        sim = cosine_similarity(new_node.content, existing.content)
        
        if sim > threshold
            # Create bidirectional association
            edge_weight = sim * PHI_INV
            
            push!(graph.edges, MemoryEdge(new_node.id, id; weight = edge_weight))
            push!(graph.edges, MemoryEdge(id, new_node.id; weight = edge_weight))
            
            push!(graph.adjacency[new_node.id], id)
            push!(graph.adjacency[id], new_node.id)
            
            graph.n_edges += 2
        end
    end
end

"""
    cosine_similarity(a::Vector{Float64}, b::Vector{Float64}) -> Float64

Compute cosine similarity between vectors.
"""
function cosine_similarity(a::Vector{Float64}, b::Vector{Float64})::Float64
    n = min(length(a), length(b))
    if n == 0
        return 0.0
    end
    
    a_norm = norm(a[1:n])
    b_norm = norm(b[1:n])
    
    if a_norm < 1e-10 || b_norm < 1e-10
        return 0.0
    end
    
    return dot(a[1:n], b[1:n]) / (a_norm * b_norm)
end

"""
    retrieve(graph::KnowledgeGraph, query::Vector{Float64}; top_k::Int = 5) -> Vector{MemoryNode}

Retrieve memories similar to query.
"""
function retrieve(graph::KnowledgeGraph, query::Vector{Float64}; top_k::Int = 5)::Vector{MemoryNode}
    similarities = Tuple{Float64, String}[]
    
    for (id, node) in graph.nodes
        sim = cosine_similarity(query, node.content)
        # Weight by activation and recency
        weighted_sim = sim * node.activation * (1 + log1p(node.access_count) * PHI_INV)
        push!(similarities, (weighted_sim, id))
    end
    
    # Sort by similarity
    sort!(similarities, by = x -> x[1], rev = true)
    
    # Get top-k
    results = MemoryNode[]
    for i in 1:min(top_k, length(similarities))
        id = similarities[i][2]
        node = graph.nodes[id]
        
        # Update access
        node.last_accessed = time()
        node.access_count += 1
        node.activation = min(1.0, node.activation + PHI_INV * 0.1)
        
        push!(results, node)
    end
    
    return results
end

"""
    consolidate!(graph::KnowledgeGraph)

Consolidate memories (strengthen important, decay unimportant).
"""
function consolidate!(graph::KnowledgeGraph)
    current_time = time()
    
    # Decay activations based on time since access
    for (id, node) in graph.nodes
        time_since_access = current_time - node.last_accessed
        
        # Exponential decay with φ-time constant
        decay = exp(-time_since_access / (86400 * PHI))  # 86400 seconds = 1 day
        node.activation *= decay
        
        # Minimum activation (don't forget completely)
        node.activation = max(PHI_INV * 0.1, node.activation)
    end
    
    # Strengthen frequently used edges
    for edge in graph.edges
        source = get(graph.nodes, edge.source, nothing)
        target = get(graph.nodes, edge.target, nothing)
        
        if source !== nothing && target !== nothing
            # Hebbian: strengthen if both active
            if source.activation > PHI_INV && target.activation > PHI_INV
                edge.trace = min(1.0, edge.trace + PHI_INV * 0.1)
                edge.weight = edge.weight * (1 + edge.trace * PHI_INV)
            else
                # Decay unused edges
                edge.trace *= PHI_INV
            end
        end
    end
    
    graph.consolidation_count += 1
    graph.phi_accumulated += PHI_INV * 0.01
end

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPORAL MEMORY
# ═══════════════════════════════════════════════════════════════════════════════

"""
    TemporalMemory

Time-indexed episodic memory.
"""
mutable struct TemporalMemory
    id::String
    episodes::Vector{Tuple{Float64, Vector{Float64}}}  # (timestamp, content)
    capacity::Int
    
    # Working memory
    working_memory::Vector{Vector{Float64}}
    working_memory_size::Int
    
    # φ-properties
    phi_accumulated::Float64
    
    function TemporalMemory(capacity::Int = 1000)
        id = "TMEM-" * string(rand(UInt32), base=16)
        new(id, [], capacity, [], 7, 0.0)  # Working memory of 7 items (Miller's law)
    end
end

"""
    remember!(memory::TemporalMemory, content::Vector{Float64})

Store an episode in temporal memory.
"""
function remember!(memory::TemporalMemory, content::Vector{Float64})
    timestamp = time()
    push!(memory.episodes, (timestamp, content))
    
    # Maintain capacity (remove oldest if full)
    if length(memory.episodes) > memory.capacity
        popfirst!(memory.episodes)
    end
    
    # Update working memory
    pushfirst!(memory.working_memory, content)
    if length(memory.working_memory) > memory.working_memory_size
        pop!(memory.working_memory)
    end
    
    memory.phi_accumulated += PHI_INV * 0.001
end

"""
    recall(memory::TemporalMemory; time_range::Tuple{Float64, Float64} = (0.0, Inf)) -> Vector{Vector{Float64}}

Recall episodes from time range.
"""
function recall(memory::TemporalMemory; time_range::Tuple{Float64, Float64} = (0.0, Inf))::Vector{Vector{Float64}}
    results = Vector{Float64}[]
    
    for (ts, content) in memory.episodes
        if ts >= time_range[1] && ts <= time_range[2]
            push!(results, content)
        end
    end
    
    return results
end

"""
    working_contents(memory::TemporalMemory) -> Vector{Vector{Float64}}

Get current working memory contents.
"""
function working_contents(memory::TemporalMemory)::Vector{Vector{Float64}}
    return memory.working_memory
end

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    memory_status(graph::KnowledgeGraph) -> Dict{Symbol, Any}

Get knowledge graph status.
"""
function memory_status(graph::KnowledgeGraph)::Dict{Symbol, Any}
    activations = [n.activation for (_, n) in graph.nodes]
    access_counts = [n.access_count for (_, n) in graph.nodes]
    
    return Dict(
        :id => graph.id,
        :n_nodes => graph.n_nodes,
        :n_edges => graph.n_edges,
        :phi_accumulated => graph.phi_accumulated,
        :consolidation_count => graph.consolidation_count,
        :avg_activation => isempty(activations) ? 0.0 : mean(activations),
        :avg_access_count => isempty(access_counts) ? 0.0 : mean(access_counts),
        :most_accessed => isempty(access_counts) ? 0 : maximum(access_counts)
    )
end

"""
    temporal_memory_status(memory::TemporalMemory) -> Dict{Symbol, Any}

Get temporal memory status.
"""
function temporal_memory_status(memory::TemporalMemory)::Dict{Symbol, Any}
    return Dict(
        :id => memory.id,
        :n_episodes => length(memory.episodes),
        :capacity => memory.capacity,
        :working_memory_items => length(memory.working_memory),
        :phi_accumulated => memory.phi_accumulated,
        :oldest_episode => isempty(memory.episodes) ? 0.0 : memory.episodes[1][1],
        :newest_episode => isempty(memory.episodes) ? 0.0 : memory.episodes[end][1]
    )
end

end # module MemoryEngine
