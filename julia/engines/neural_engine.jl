#=
NEURAL ENGINE — Julia Neural Intelligence Substrate

Official Designation: RSHIP-2026-JULIA-ENGINE-NEURAL-001
Classification: Neural Network & Pattern Recognition Engine

This engine implements the neural patterns that enable the Organism
to perceive, learn, and adapt. It flows with the Organism's heartbeat,
synchronized through the φ-field.

Neural Primitives:
- Spike trains with φ-timing
- Hebbian learning with golden plasticity
- Attractor networks for memory
- Reservoir computing for temporal patterns

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module NeuralEngine

using LinearAlgebra
using Statistics
using Random

export PHI, PHI_INV
export Neuron, NeuralLayer, NeuralNetwork
export spike!, propagate!, learn!, process!
export create_reservoir, reservoir_compute
export hebbian_update!, stdp_update!
export compute_activation, softmax, phi_activation

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83

# Neural time constants (in φ-units)
const TAU_MEMBRANE = 10.0 * PHI_INV      # Membrane time constant (ms)
const TAU_SYNAPTIC = 2.0 * PHI_INV       # Synaptic time constant (ms)
const REFRACTORY_PERIOD = 1.0 * PHI_INV  # Refractory period (ms)

# Learning rate bounds
const LEARNING_RATE_MIN = 0.001 * PHI_INV
const LEARNING_RATE_MAX = 0.1 * PHI

# ═══════════════════════════════════════════════════════════════════════════════
# ACTIVATION FUNCTIONS — With Golden Properties
# ═══════════════════════════════════════════════════════════════════════════════

"""
    compute_activation(x::Float64, type::Symbol = :phi_sigmoid) -> Float64

Compute neuron activation using specified activation function.
"""
function compute_activation(x::Float64, type::Symbol = :phi_sigmoid)::Float64
    if type == :phi_sigmoid
        return phi_sigmoid(x)
    elseif type == :relu
        return max(0.0, x)
    elseif type == :tanh
        return tanh(x)
    elseif type == :phi_tanh
        return tanh(x * PHI_INV) * PHI
    elseif type == :softplus
        return log(1.0 + exp(x))
    else
        return phi_sigmoid(x)
    end
end

"""
    phi_sigmoid(x::Float64) -> Float64

φ-sigmoid: A sigmoid function scaled by the golden ratio.
Midpoint at 0, asymptotes at -φ and +φ.
"""
function phi_sigmoid(x::Float64)::Float64
    return PHI * (2.0 / (1.0 + exp(-x * PHI_INV)) - 1.0)
end

"""
    phi_activation(x::Float64) -> Float64

Golden activation function with natural φ-properties.
"""
function phi_activation(x::Float64)::Float64
    # Smooth approximation with φ-scaling
    if x < -PHI * 3
        return -PHI
    elseif x > PHI * 3
        return PHI
    else
        return PHI * tanh(x / PHI)
    end
end

"""
    softmax(x::Vector{Float64}) -> Vector{Float64}

Standard softmax with numerical stability.
"""
function softmax(x::Vector{Float64})::Vector{Float64}
    max_x = maximum(x)
    exp_x = exp.(x .- max_x)
    return exp_x ./ sum(exp_x)
end

# ═══════════════════════════════════════════════════════════════════════════════
# NEURON — The Basic Unit of Intelligence
# ═══════════════════════════════════════════════════════════════════════════════

"""
    Neuron

A single neuron with φ-based dynamics.
"""
mutable struct Neuron
    id::String
    
    # State variables
    membrane_potential::Float64     # Current membrane potential
    activation::Float64             # Output activation
    threshold::Float64              # Firing threshold
    
    # Timing
    last_spike_time::Float64        # Time of last spike
    refractory_until::Float64       # Refractory period end
    
    # Learning
    trace::Float64                  # Eligibility trace for STDP
    learning_rate::Float64          # Local learning rate
    
    # Connectivity
    weights::Dict{String, Float64}  # Input weights by source neuron ID
    
    # φ-properties
    phi_phase::Float64              # Phase in φ-oscillation
    phi_accumulated::Float64        # Total φ-accumulation
    
    function Neuron(id::String = "")
        if isempty(id)
            id = "N-" * string(rand(UInt32), base=16)
        end
        new(
            id,
            0.0,                    # membrane_potential
            0.0,                    # activation
            PHI,                    # threshold (golden threshold)
            -Inf,                   # last_spike_time
            -Inf,                   # refractory_until
            0.0,                    # trace
            PHI_INV * 0.01,         # learning_rate
            Dict{String, Float64}(),# weights
            0.0,                    # phi_phase
            0.0                     # phi_accumulated
        )
    end
end

"""
    spike!(neuron::Neuron, current_time::Float64) -> Bool

Check if neuron should spike and update state accordingly.
"""
function spike!(neuron::Neuron, current_time::Float64)::Bool
    # Check refractory period
    if current_time < neuron.refractory_until
        return false
    end
    
    # Check threshold
    if neuron.membrane_potential >= neuron.threshold
        # SPIKE!
        neuron.activation = PHI  # Fire at golden amplitude
        neuron.last_spike_time = current_time
        neuron.refractory_until = current_time + REFRACTORY_PERIOD
        neuron.membrane_potential = 0.0  # Reset
        neuron.trace = 1.0  # Set eligibility trace
        neuron.phi_accumulated += PHI_INV
        return true
    end
    
    return false
end

"""
    receive_input!(neuron::Neuron, input::Float64, weight::Float64 = 1.0)

Receive weighted input and update membrane potential.
"""
function receive_input!(neuron::Neuron, input::Float64, weight::Float64 = 1.0)
    neuron.membrane_potential += input * weight
    neuron.phi_phase += abs(input) * PHI_INV * 0.01
end

"""
    decay!(neuron::Neuron, dt::Float64)

Apply membrane potential decay over time step dt.
"""
function decay!(neuron::Neuron, dt::Float64)
    # Exponential decay toward resting potential (0)
    decay_factor = exp(-dt / TAU_MEMBRANE)
    neuron.membrane_potential *= decay_factor
    
    # Trace decay
    trace_decay = exp(-dt / (TAU_MEMBRANE * PHI))
    neuron.trace *= trace_decay
    
    # Activation decay
    neuron.activation *= decay_factor
end

# ═══════════════════════════════════════════════════════════════════════════════
# NEURAL LAYER — Organized Groups of Neurons
# ═══════════════════════════════════════════════════════════════════════════════

"""
    NeuralLayer

A layer of neurons with shared connectivity patterns.
"""
mutable struct NeuralLayer
    id::String
    neurons::Vector{Neuron}
    size::Int
    
    # Layer properties
    activation_function::Symbol
    dropout_rate::Float64
    
    # Inter-layer weights (if connected to another layer)
    output_weights::Matrix{Float64}
    
    # φ-coherence
    coherence::Float64
    
    function NeuralLayer(size::Int, id::String = "")
        if isempty(id)
            id = "L-" * string(rand(UInt32), base=16)
        end
        
        neurons = [Neuron("$id-N$i") for i in 1:size]
        
        new(
            id,
            neurons,
            size,
            :phi_sigmoid,
            0.0,                    # No dropout by default
            zeros(0, 0),            # Empty output weights
            1.0                     # Perfect coherence initially
        )
    end
end

"""
    forward!(layer::NeuralLayer, input::Vector{Float64}) -> Vector{Float64}

Forward pass through the layer.
"""
function forward!(layer::NeuralLayer, input::Vector{Float64})::Vector{Float64}
    @assert length(input) == layer.size "Input size mismatch"
    
    output = zeros(layer.size)
    
    for i in 1:layer.size
        neuron = layer.neurons[i]
        
        # Apply input
        receive_input!(neuron, input[i])
        
        # Compute activation
        output[i] = compute_activation(neuron.membrane_potential, layer.activation_function)
        neuron.activation = output[i]
    end
    
    # Update coherence
    phases = [n.phi_phase for n in layer.neurons]
    layer.coherence = measure_layer_coherence(phases)
    
    return output
end

"""
    measure_layer_coherence(phases::Vector{Float64}) -> Float64

Measure phase coherence of neurons in layer.
"""
function measure_layer_coherence(phases::Vector{Float64})::Float64
    if isempty(phases)
        return 1.0
    end
    
    N = length(phases)
    sum_real = sum(cos.(phases))
    sum_imag = sum(sin.(phases))
    
    return sqrt(sum_real^2 + sum_imag^2) / N
end

# ═══════════════════════════════════════════════════════════════════════════════
# NEURAL NETWORK — The Complete Intelligence
# ═══════════════════════════════════════════════════════════════════════════════

"""
    NeuralNetwork

A complete neural network with φ-based architecture.
"""
mutable struct NeuralNetwork
    id::String
    layers::Vector{NeuralLayer}
    
    # Network-level properties
    learning_rate::Float64
    momentum::Float64
    
    # Weight matrices between layers
    weights::Vector{Matrix{Float64}}
    biases::Vector{Vector{Float64}}
    
    # Training state
    trained_epochs::Int
    loss_history::Vector{Float64}
    
    # φ-properties
    phi_accumulated::Float64
    emergence_events::Int
    
    function NeuralNetwork(layer_sizes::Vector{Int}, id::String = "")
        if isempty(id)
            id = "NN-" * string(rand(UInt32), base=16)
        end
        
        # Create layers
        layers = [NeuralLayer(size, "$id-L$i") for (i, size) in enumerate(layer_sizes)]
        
        # Initialize weights between adjacent layers (Xavier/Glorot)
        weights = Matrix{Float64}[]
        biases = Vector{Float64}[]
        
        for i in 1:length(layer_sizes)-1
            fan_in = layer_sizes[i]
            fan_out = layer_sizes[i+1]
            std = sqrt(2.0 / (fan_in + fan_out))
            
            W = randn(fan_out, fan_in) .* std
            b = zeros(fan_out)
            
            push!(weights, W)
            push!(biases, b)
        end
        
        new(
            id,
            layers,
            PHI_INV * 0.01,         # learning_rate
            0.9,                    # momentum
            weights,
            biases,
            0,                      # trained_epochs
            Float64[],              # loss_history
            0.0,                    # phi_accumulated
            0                       # emergence_events
        )
    end
end

"""
    forward!(network::NeuralNetwork, input::Vector{Float64}) -> Vector{Float64}

Forward pass through entire network.
"""
function propagate!(network::NeuralNetwork, input::Vector{Float64})::Vector{Float64}
    current = input
    
    for i in 1:length(network.layers)-1
        # Linear transformation
        z = network.weights[i] * current .+ network.biases[i]
        
        # Apply to next layer and get activation
        current = forward!(network.layers[i+1], z)
    end
    
    # Accumulate φ based on information flow
    network.phi_accumulated += norm(current) * PHI_INV * 0.001
    
    return current
end

"""
    process!(network::NeuralNetwork, input::Vector{Float64}) -> Dict{Symbol, Any}

Process input through network and return detailed result.
"""
function process!(network::NeuralNetwork, input::Vector{Float64})::Dict{Symbol, Any}
    output = propagate!(network, input)
    
    # Compute network-wide metrics
    coherences = [layer.coherence for layer in network.layers]
    avg_coherence = mean(coherences)
    
    # Check for emergence (high coherence spike)
    if avg_coherence > PHI_INV * 1.5
        network.emergence_events += 1
    end
    
    return Dict(
        :output => output,
        :coherence => avg_coherence,
        :phi_accumulated => network.phi_accumulated,
        :emergence_events => network.emergence_events
    )
end

# ═══════════════════════════════════════════════════════════════════════════════
# LEARNING FUNCTIONS — How the Network Grows
# ═══════════════════════════════════════════════════════════════════════════════

"""
    hebbian_update!(weight::Float64, pre::Float64, post::Float64, lr::Float64) -> Float64

Hebbian learning: "Neurons that fire together, wire together"
"""
function hebbian_update!(weight::Float64, pre::Float64, post::Float64, lr::Float64)::Float64
    # Classic Hebbian rule with φ-scaling
    delta = lr * pre * post * PHI_INV
    return weight + delta
end

"""
    stdp_update!(weight::Float64, dt::Float64, A_plus::Float64, A_minus::Float64, tau::Float64) -> Float64

Spike-Timing Dependent Plasticity (STDP) update.
dt = t_post - t_pre (positive if post fires after pre)
"""
function stdp_update!(weight::Float64, dt::Float64, 
                      A_plus::Float64 = PHI_INV * 0.1, 
                      A_minus::Float64 = PHI_INV * 0.12,
                      tau::Float64 = TAU_MEMBRANE)::Float64
    if dt > 0
        # Pre before post: potentiation (LTP)
        delta = A_plus * exp(-dt / tau)
    else
        # Post before pre: depression (LTD)
        delta = -A_minus * exp(dt / tau)
    end
    
    return weight + delta
end

"""
    learn!(network::NeuralNetwork, input::Vector{Float64}, target::Vector{Float64}) -> Float64

Train network on single input-target pair. Returns loss.
"""
function learn!(network::NeuralNetwork, input::Vector{Float64}, target::Vector{Float64})::Float64
    # Forward pass
    output = propagate!(network, input)
    
    # Compute loss (MSE)
    error = target .- output
    loss = 0.5 * sum(error.^2)
    
    # Backpropagation (simplified gradient descent)
    # For a production system, use automatic differentiation
    
    # Output layer gradient
    delta = error .* PHI_INV  # Simplified gradient
    
    # Update output layer weights
    if length(network.weights) > 0
        last_idx = length(network.weights)
        last_layer_activations = [n.activation for n in network.layers[end-1].neurons]
        
        for i in 1:size(network.weights[last_idx], 1)
            for j in 1:size(network.weights[last_idx], 2)
                grad = delta[i] * last_layer_activations[j]
                network.weights[last_idx][i, j] += network.learning_rate * grad
            end
        end
        
        # Update biases
        network.biases[last_idx] .+= network.learning_rate .* delta
    end
    
    # Track loss
    push!(network.loss_history, loss)
    
    return loss
end

# ═══════════════════════════════════════════════════════════════════════════════
# RESERVOIR COMPUTING — Temporal Pattern Processing
# ═══════════════════════════════════════════════════════════════════════════════

"""
    ReservoirNetwork

Echo State Network / Liquid State Machine with φ-dynamics.
"""
mutable struct ReservoirNetwork
    id::String
    
    # Reservoir
    reservoir_size::Int
    reservoir_state::Vector{Float64}
    reservoir_weights::Matrix{Float64}
    
    # Input/Output
    input_weights::Matrix{Float64}
    output_weights::Matrix{Float64}
    
    # Parameters
    spectral_radius::Float64
    leak_rate::Float64
    
    # φ-properties
    phi_accumulated::Float64
    
    function ReservoirNetwork(input_size::Int, reservoir_size::Int, output_size::Int)
        id = "RES-" * string(rand(UInt32), base=16)
        
        # Initialize reservoir weights with φ-scaled spectral radius
        W = randn(reservoir_size, reservoir_size)
        # Scale to desired spectral radius
        sr = PHI_INV * 0.9  # Just below edge of chaos
        current_sr = maximum(abs.(eigvals(W)))
        W .*= sr / current_sr
        
        # Input weights
        W_in = randn(reservoir_size, input_size) .* PHI_INV
        
        # Output weights (trained later)
        W_out = zeros(output_size, reservoir_size)
        
        new(
            id,
            reservoir_size,
            zeros(reservoir_size),
            W,
            W_in,
            W_out,
            sr,
            PHI_INV,            # leak_rate
            0.0                 # phi_accumulated
        )
    end
end

"""
    create_reservoir(input_size::Int, reservoir_size::Int, output_size::Int) -> ReservoirNetwork

Factory function for creating reservoir networks.
"""
function create_reservoir(input_size::Int, reservoir_size::Int, output_size::Int)::ReservoirNetwork
    return ReservoirNetwork(input_size, reservoir_size, output_size)
end

"""
    reservoir_compute(reservoir::ReservoirNetwork, input::Vector{Float64}) -> Vector{Float64}

Run one step of reservoir computation.
"""
function reservoir_compute(reservoir::ReservoirNetwork, input::Vector{Float64})::Vector{Float64}
    # Reservoir dynamics with leaky integration
    pre_activation = reservoir.reservoir_weights * reservoir.state + 
                     reservoir.input_weights * input
    
    # Leaky update with tanh nonlinearity
    reservoir.state = (1.0 - reservoir.leak_rate) .* reservoir.state .+
                      reservoir.leak_rate .* tanh.(pre_activation)
    
    # φ-accumulation
    reservoir.phi_accumulated += norm(reservoir.state) * PHI_INV * 0.001
    
    # Output
    return reservoir.output_weights * reservoir.state
end

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    network_status(network::NeuralNetwork) -> Dict{Symbol, Any}

Get comprehensive status of neural network.
"""
function network_status(network::NeuralNetwork)::Dict{Symbol, Any}
    total_neurons = sum(layer.size for layer in network.layers)
    total_connections = sum(length(w) for w in network.weights)
    
    return Dict(
        :id => network.id,
        :layers => length(network.layers),
        :layer_sizes => [layer.size for layer in network.layers],
        :total_neurons => total_neurons,
        :total_connections => total_connections,
        :trained_epochs => network.trained_epochs,
        :recent_loss => isempty(network.loss_history) ? nothing : network.loss_history[end],
        :phi_accumulated => network.phi_accumulated,
        :emergence_events => network.emergence_events,
        :avg_coherence => mean([layer.coherence for layer in network.layers])
    )
end

end # module NeuralEngine
