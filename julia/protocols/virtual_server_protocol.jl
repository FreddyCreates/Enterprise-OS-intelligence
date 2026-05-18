module VirtualServerProtocol

using Statistics

export PHI, PHI_INV, SCHUMANN_HZ, PHI_LADDER
export VirtualServerState, create_virtual_server, pulse_virtual!, virtual_status
export apply_own_mathematics

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83

const PHI_LADDER = Dict(
    :phi4 => PHI^4,
    :phi3 => PHI^3,
    :phi2 => PHI^2,
    :phi1 => PHI,
    :phi0 => 1.0,
    :phi_1 => PHI_INV,
    :phi_2 => PHI_INV^2
)

mutable struct VirtualServerState
    id::String
    protocol_name::String
    clean_score::Float64
    resonance_hz::Float64
    pulse_count::Int
    phi_accumulated::Float64
    last_vector::Vector{Float64}
end

function create_virtual_server(protocol_name::String = "RSHIP-CLEAN-PROTOCOL")::VirtualServerState
    id = "VSRV-" * string(rand(UInt32), base=16)
    return VirtualServerState(id, protocol_name, 1.0, SCHUMANN_HZ, 0, 0.0, Float64[])
end

function apply_own_mathematics(signal::Vector{Float64})::Vector{Float64}
    if isempty(signal)
        return signal
    end
    μ = mean(signal)
    centered = signal .- μ
    return PHI_INV .* centered .+ (1 - PHI_INV) .* signal
end

function pulse_virtual!(state::VirtualServerState, signal::Vector{Float64} = Float64[])::Dict{Symbol, Any}
    processed = apply_own_mathematics(signal)

    if !isempty(processed)
        energy = mean(abs.(processed))
        state.clean_score = clamp(1.0 / (1.0 + energy * PHI_INV), 0.0, 1.0)
        state.last_vector = processed
        state.phi_accumulated += sum(abs.(processed)) * PHI_INV * 1e-4
    else
        state.clean_score = clamp(state.clean_score + PHI_INV * 1e-3, 0.0, 1.0)
        state.phi_accumulated += PHI_INV * 1e-3
    end

    state.pulse_count += 1

    return Dict(
        :status => :virtual_pulsed,
        :protocol => state.protocol_name,
        :clean_score => state.clean_score,
        :pulse_count => state.pulse_count,
        :resonance_hz => state.resonance_hz,
        :phi_accumulated => state.phi_accumulated
    )
end

function virtual_status(state::VirtualServerState)::Dict{Symbol, Any}
    return Dict(
        :id => state.id,
        :protocol => state.protocol_name,
        :clean_score => state.clean_score,
        :pulse_count => state.pulse_count,
        :resonance_hz => state.resonance_hz,
        :phi_accumulated => state.phi_accumulated,
        :phi_ladder => PHI_LADDER
    )
end

end # module VirtualServerProtocol
