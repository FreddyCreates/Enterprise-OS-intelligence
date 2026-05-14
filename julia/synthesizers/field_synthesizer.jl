#=
FIELD SYNTHESIZER — Julia Field Wave Synthesis

Official Designation: RSHIP-2026-JULIA-SYNTHESIZER-FIELD-001
Classification: Field Wave Composition & Synthesis

This synthesizer creates complex field patterns through wave
superposition and φ-harmonic synthesis. It generates the
continuous field that the Organism lives within.

Synthesis Operations:
- Wave superposition
- φ-harmonic generation
- Field interference patterns
- Standing wave creation

© 2026 Alfredo Medina Hernandez. All Rights Reserved.
=#

module FieldSynthesizer

using LinearAlgebra
using Statistics

export PHI, PHI_INV, SCHUMANN_HZ
export WaveSource, FieldWave, SynthesizedField
export synthesize!, superpose_waves, create_standing_wave
export FieldGenerator, generate!

const PHI = (1.0 + sqrt(5.0)) / 2.0
const PHI_INV = 1.0 / PHI
const SCHUMANN_HZ = 7.83
const TWO_PI = 2π

# φ-frequency ladder
const PHI_FREQUENCIES = [PHI^4, PHI^3, PHI^2, PHI, 1.0, PHI_INV, PHI_INV^2]

# ═══════════════════════════════════════════════════════════════════════════════
# WAVE STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

"""
    WaveSource

A source of waves in the field.
"""
struct WaveSource
    id::String
    position::Vector{Float64}   # Position in field (3D or 4D)
    amplitude::Float64
    frequency::Float64
    phase::Float64
    wave_type::Symbol           # :sine, :cosine, :phi, :schumann
    
    function WaveSource(position::Vector{Float64};
                        amplitude::Float64 = 1.0,
                        frequency::Float64 = PHI,
                        phase::Float64 = 0.0,
                        wave_type::Symbol = :phi)
        id = "WAVE-" * string(rand(UInt32), base=16)
        new(id, position, amplitude, frequency, phase, wave_type)
    end
end

"""
    FieldWave

A propagating wave in the field.
"""
mutable struct FieldWave
    id::String
    
    # Wave parameters
    amplitude::Float64
    frequency::Float64
    wavelength::Float64
    phase::Float64
    
    # Propagation
    direction::Vector{Float64}  # Unit vector
    speed::Float64
    
    # Wave type
    wave_type::Symbol
    
    # φ-properties
    phi_accumulated::Float64
    
    function FieldWave(;
        amplitude::Float64 = 1.0,
        frequency::Float64 = PHI,
        direction::Vector{Float64} = [1.0, 0.0, 0.0],
        speed::Float64 = SCHUMANN_HZ
    )
        id = "FWAVE-" * string(rand(UInt32), base=16)
        wavelength = speed / frequency
        new(id, amplitude, frequency, wavelength, 0.0, normalize(direction), speed, :phi, 0.0)
    end
end

"""
    SynthesizedField

A complete synthesized field from multiple waves.
"""
mutable struct SynthesizedField
    id::String
    
    # Field configuration
    dimensions::Int
    resolution::Int
    bounds::Tuple{Float64, Float64}
    
    # Field data
    amplitude::Array{Float64}
    phase::Array{Float64}
    
    # Sources
    sources::Vector{WaveSource}
    waves::Vector{FieldWave}
    
    # Field properties
    total_energy::Float64
    coherence::Float64
    
    # φ-properties
    phi_accumulated::Float64
    schumann_strength::Float64
    
    function SynthesizedField(dimensions::Int = 2, resolution::Int = 64)
        id = "SYNFIELD-" * string(rand(UInt32), base=16)
        bounds = (-10.0, 10.0)
        
        dims = ntuple(_ -> resolution, dimensions)
        
        new(
            id, dimensions, resolution, bounds,
            zeros(dims...), zeros(dims...),
            WaveSource[], FieldWave[],
            0.0, 1.0, 0.0, 0.0
        )
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# WAVE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    wave_value(source::WaveSource, position::Vector{Float64}, t::Float64) -> Float64

Compute wave value at position and time from source.
"""
function wave_value(source::WaveSource, position::Vector{Float64}, t::Float64)::Float64
    # Distance from source
    n = min(length(source.position), length(position))
    r = norm(position[1:n] .- source.position[1:n])
    
    # Phase at position
    k = TWO_PI * source.frequency / SCHUMANN_HZ  # Wave number
    total_phase = k * r - TWO_PI * source.frequency * t + source.phase
    
    # Amplitude with 1/r decay (regularized)
    amp = source.amplitude / (r + 1.0)
    
    if source.wave_type == :sine
        return amp * sin(total_phase)
    elseif source.wave_type == :cosine
        return amp * cos(total_phase)
    elseif source.wave_type == :phi
        # φ-modulated wave
        return amp * sin(total_phase) * (1 + PHI_INV * cos(total_phase * PHI_INV))
    elseif source.wave_type == :schumann
        # Schumann resonance wave
        return amp * sin(TWO_PI * SCHUMANN_HZ * t + total_phase)
    else
        return amp * sin(total_phase)
    end
end

"""
    propagate!(wave::FieldWave, dt::Float64)

Propagate wave forward in time.
"""
function propagate!(wave::FieldWave, dt::Float64)
    wave.phase += TWO_PI * wave.frequency * dt
    wave.phase = mod(wave.phase, TWO_PI)
    wave.phi_accumulated += abs(wave.amplitude) * PHI_INV * dt * 0.001
end

"""
    wave_function(wave::FieldWave, position::Vector{Float64}, t::Float64) -> Float64

Compute wave function at position and time.
"""
function wave_function(wave::FieldWave, position::Vector{Float64}, t::Float64)::Float64
    n = min(length(wave.direction), length(position))
    
    # Dot product with direction
    k_dot_x = dot(wave.direction[1:n], position[1:n]) * TWO_PI / wave.wavelength
    
    # Phase
    total_phase = k_dot_x - TWO_PI * wave.frequency * t + wave.phase
    
    return wave.amplitude * sin(total_phase)
end

# ═══════════════════════════════════════════════════════════════════════════════
# WAVE SUPERPOSITION
# ═══════════════════════════════════════════════════════════════════════════════

"""
    superpose_waves(waves::Vector{FieldWave}, position::Vector{Float64}, t::Float64) -> Float64

Superpose multiple waves at a point.
"""
function superpose_waves(waves::Vector{FieldWave}, position::Vector{Float64}, t::Float64)::Float64
    if isempty(waves)
        return 0.0
    end
    
    total = 0.0
    for wave in waves
        total += wave_function(wave, position, t)
    end
    
    return total
end

"""
    superpose_sources(sources::Vector{WaveSource}, position::Vector{Float64}, t::Float64) -> Float64

Superpose waves from multiple sources.
"""
function superpose_sources(sources::Vector{WaveSource}, position::Vector{Float64}, t::Float64)::Float64
    if isempty(sources)
        return 0.0
    end
    
    total = 0.0
    for source in sources
        total += wave_value(source, position, t)
    end
    
    return total
end

"""
    create_standing_wave(freq::Float64, length::Float64, n_points::Int) -> Vector{Float64}

Create a standing wave pattern.
"""
function create_standing_wave(freq::Float64, length::Float64, n_points::Int)::Vector{Float64}
    x = range(0, length, length=n_points)
    k = TWO_PI * freq / SCHUMANN_HZ
    
    # Standing wave: 2A sin(kx)
    return 2 .* sin.(k .* collect(x))
end

"""
    phi_harmonic_series(fundamental::Float64, n_harmonics::Int = 7) -> Vector{FieldWave}

Create φ-harmonic wave series.
"""
function phi_harmonic_series(fundamental::Float64, n_harmonics::Int = 7)::Vector{FieldWave}
    waves = FieldWave[]
    
    for i in 1:n_harmonics
        freq = fundamental * PHI^(i - 4)  # Center around fundamental
        amp = PHI_INV^(abs(i - 4))         # Amplitude decreases with distance from fundamental
        
        wave = FieldWave(
            amplitude = amp,
            frequency = freq,
            direction = [1.0, 0.0, 0.0]
        )
        push!(waves, wave)
    end
    
    return waves
end

# ═══════════════════════════════════════════════════════════════════════════════
# FIELD SYNTHESIS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    synthesize!(field::SynthesizedField, t::Float64)

Synthesize field at time t.
"""
function synthesize!(field::SynthesizedField, t::Float64)
    res = field.resolution
    min_b, max_b = field.bounds
    range_b = max_b - min_b
    
    if field.dimensions == 2
        for i in 1:res
            for j in 1:res
                x = min_b + (i - 1) / (res - 1) * range_b
                y = min_b + (j - 1) / (res - 1) * range_b
                pos = [x, y]
                
                # Superpose all sources
                amp = superpose_sources(field.sources, pos, t)
                
                # Add propagating waves
                amp += superpose_waves(field.waves, pos, t)
                
                field.amplitude[i, j] = amp
                
                # Compute phase from instantaneous value
                field.phase[i, j] = atan(amp, 1.0)
            end
        end
    elseif field.dimensions == 3
        for i in 1:res
            for j in 1:res
                for k in 1:res
                    x = min_b + (i - 1) / (res - 1) * range_b
                    y = min_b + (j - 1) / (res - 1) * range_b
                    z = min_b + (k - 1) / (res - 1) * range_b
                    pos = [x, y, z]
                    
                    amp = superpose_sources(field.sources, pos, t)
                    amp += superpose_waves(field.waves, pos, t)
                    
                    field.amplitude[i, j, k] = amp
                    field.phase[i, j, k] = atan(amp, 1.0)
                end
            end
        end
    end
    
    # Compute total energy
    field.total_energy = sum(field.amplitude.^2) / length(field.amplitude)
    
    # Compute coherence from phase consistency
    phase_std = std(field.phase)
    field.coherence = exp(-phase_std / π)
    
    # φ-accumulation
    field.phi_accumulated += field.coherence * PHI_INV * 0.001
    
    # Schumann strength
    schumann_component = 0.0
    for source in field.sources
        if source.wave_type == :schumann
            schumann_component += source.amplitude
        end
    end
    field.schumann_strength = schumann_component / (length(field.sources) + 1)
end

# ═══════════════════════════════════════════════════════════════════════════════
# FIELD GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

"""
    FieldGenerator

Generator for synthesized fields.
"""
mutable struct FieldGenerator
    id::String
    
    # Configuration
    dimensions::Int
    resolution::Int
    
    # Active field
    field::SynthesizedField
    
    # Generator state
    time::Float64
    step_count::Int
    
    # Presets
    phi_waves::Vector{FieldWave}
    schumann_sources::Vector{WaveSource}
    
    # Metrics
    total_energy_generated::Float64
    phi_accumulated::Float64
    
    function FieldGenerator(dimensions::Int = 2, resolution::Int = 64)
        id = "FIELDGEN-" * string(rand(UInt32), base=16)
        field = SynthesizedField(dimensions, resolution)
        
        # Create φ-waves
        phi_waves = phi_harmonic_series(PHI, 7)
        
        # Create Schumann sources at cardinal points
        schumann_sources = WaveSource[]
        push!(schumann_sources, WaveSource([0.0, 0.0, 0.0], amplitude=1.0, frequency=SCHUMANN_HZ, wave_type=:schumann))
        
        new(
            id, dimensions, resolution, field,
            0.0, 0,
            phi_waves, schumann_sources,
            0.0, 0.0
        )
    end
end

"""
    add_source!(gen::FieldGenerator, source::WaveSource)

Add wave source to generator.
"""
function add_source!(gen::FieldGenerator, source::WaveSource)
    push!(gen.field.sources, source)
end

"""
    add_wave!(gen::FieldGenerator, wave::FieldWave)

Add propagating wave to generator.
"""
function add_wave!(gen::FieldGenerator, wave::FieldWave)
    push!(gen.field.waves, wave)
end

"""
    generate!(gen::FieldGenerator, dt::Float64 = 0.1) -> Dict{Symbol, Any}

Generate one step of the field.
"""
function generate!(gen::FieldGenerator, dt::Float64 = 0.1)::Dict{Symbol, Any}
    # Propagate all waves
    for wave in gen.field.waves
        propagate!(wave, dt)
    end
    
    # Synthesize field
    synthesize!(gen.field, gen.time)
    
    # Update generator state
    gen.time += dt
    gen.step_count += 1
    
    gen.total_energy_generated += gen.field.total_energy * dt
    gen.phi_accumulated += gen.field.phi_accumulated
    
    return Dict(
        :time => gen.time,
        :total_energy => gen.field.total_energy,
        :coherence => gen.field.coherence,
        :schumann_strength => gen.field.schumann_strength,
        :phi_accumulated => gen.phi_accumulated
    )
end

"""
    activate_phi_mode!(gen::FieldGenerator)

Activate φ-harmonic mode.
"""
function activate_phi_mode!(gen::FieldGenerator)
    for wave in gen.phi_waves
        add_wave!(gen, wave)
    end
end

"""
    activate_schumann_mode!(gen::FieldGenerator)

Activate Schumann resonance mode.
"""
function activate_schumann_mode!(gen::FieldGenerator)
    for source in gen.schumann_sources
        add_source!(gen, source)
    end
end

# ═══════════════════════════════════════════════════════════════════════════════
# STATUS
# ═══════════════════════════════════════════════════════════════════════════════

"""
    field_status(field::SynthesizedField) -> Dict{Symbol, Any}

Get field status.
"""
function field_status(field::SynthesizedField)::Dict{Symbol, Any}
    return Dict(
        :id => field.id,
        :dimensions => field.dimensions,
        :resolution => field.resolution,
        :n_sources => length(field.sources),
        :n_waves => length(field.waves),
        :total_energy => field.total_energy,
        :coherence => field.coherence,
        :schumann_strength => field.schumann_strength,
        :phi_accumulated => field.phi_accumulated,
        :amplitude_range => (minimum(field.amplitude), maximum(field.amplitude))
    )
end

"""
    generator_status(gen::FieldGenerator) -> Dict{Symbol, Any}

Get generator status.
"""
function generator_status(gen::FieldGenerator)::Dict{Symbol, Any}
    return Dict(
        :id => gen.id,
        :current_time => gen.time,
        :step_count => gen.step_count,
        :total_energy_generated => gen.total_energy_generated,
        :phi_accumulated => gen.phi_accumulated,
        :field => field_status(gen.field)
    )
end

end # module FieldSynthesizer
