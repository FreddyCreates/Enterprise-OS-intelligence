const PHI = 1.618033988749895;
const GOLDEN_ANGLE = 2.399963229728653;

export class PhiCoordinateGenerator {
  generate(index = 0, { ringCount = 7, beatResolution = 64 } = {}) {
    const theta = index * GOLDEN_ANGLE;
    const rho = Math.sqrt(index + 1);
    return {
      theta,
      phi: theta / PHI,
      rho,
      ring: Math.floor(rho) % ringCount,
      beat: Math.floor(index * PHI) % beatResolution,
    };
  }

  encode(coordinates) {
    return [
      coordinates.theta.toFixed(8),
      coordinates.phi.toFixed(8),
      coordinates.rho.toFixed(8),
      coordinates.ring,
      coordinates.beat,
    ].join(":");
  }

  decode(encoded) {
    const [theta, phi, rho, ring, beat] = String(encoded).split(":");
    return {
      theta: Number(theta),
      phi: Number(phi),
      rho: Number(rho),
      ring: Number(ring),
      beat: Number(beat),
    };
  }

  distance(a, b) {
    return Math.sqrt(((a.theta - b.theta) ** 2) + ((a.phi - b.phi) ** 2) + ((a.rho - b.rho) ** 2));
  }
}
