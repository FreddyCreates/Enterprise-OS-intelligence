const PHI = 1.618033988749895;
const PHI_INV = 1 / PHI;

function product(shape) {
  return shape.reduce((acc, value) => acc * value, 1);
}

function assertShape(data, shape) {
  if (data.length !== product(shape)) {
    throw new Error(`Tensor data length ${data.length} does not match shape ${shape.join("x")}`);
  }
}

function inferSquareDimension(length) {
  const dimension = Math.sqrt(length);
  if (!Number.isInteger(dimension)) {
    throw new Error("Tensor operation requires a square matrix representation");
  }
  return dimension;
}

export class Tensor {
  constructor(data = [], shape = [data.length]) {
    this.data = Array.from(data, Number);
    this.shape = Array.from(shape, Number);
    assertShape(this.data, this.shape);
  }

  reshape(shape) {
    return new Tensor(this.data, shape);
  }

  map(mapper) {
    return new Tensor(this.data.map(mapper), this.shape);
  }

  add(other) {
    if (this.data.length !== other.data.length) {
      throw new Error("Tensor shapes must match for addition");
    }
    return new Tensor(this.data.map((value, index) => value + other.data[index]), this.shape);
  }

  scale(factor) {
    return this.map((value) => value * factor);
  }

  contract(other) {
    const [rows, inner] = this.shape;
    const [otherInner, cols] = other.shape;
    if (inner !== otherInner) {
      throw new Error("Inner tensor dimensions must match for contraction");
    }

    const output = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        let sum = 0;
        for (let k = 0; k < inner; k += 1) {
          sum += this.data[row * inner + k] * other.data[k * cols + col];
        }
        output.push(sum);
      }
    }
    return new Tensor(output, [rows, cols]);
  }

  transpose() {
    const [rows, cols] = this.shape;
    const output = [];
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        output.push(this.data[row * cols + col]);
      }
    }
    return new Tensor(output, [cols, rows]);
  }

  determinant2x2() {
    if (this.shape[0] !== 2 || this.shape[1] !== 2) {
      throw new Error("determinant2x2 requires a 2x2 tensor");
    }
    return (this.data[0] * this.data[3]) - (this.data[1] * this.data[2]);
  }

  toArray() {
    return [...this.data];
  }
}

export function createTensor(data, shape) {
  return new Tensor(data, shape);
}

export const LieAlgebra = Object.freeze({
  bracket(left, right) {
    return left.contract(right).add(right.contract(left).scale(-1));
  },

  exponential(tensor, terms = 8) {
    const dimension = inferSquareDimension(tensor.data.length);
    let result = identityTensor(dimension);
    let power = identityTensor(dimension);
    let factorial = 1;

    for (let n = 1; n < terms; n += 1) {
      factorial *= n;
      power = power.contract(tensor);
      result = result.add(power.scale(1 / factorial));
    }

    return result;
  },
});

export function identityTensor(dimension) {
  const data = [];
  for (let row = 0; row < dimension; row += 1) {
    for (let col = 0; col < dimension; col += 1) {
      data.push(row === col ? 1 : 0);
    }
  }
  return new Tensor(data, [dimension, dimension]);
}

export function createMetricTensor(entries = [1, 0, 0, 1]) {
  const tensor = new Tensor(entries, [2, 2]);
  return {
    tensor,
    determinant: tensor.determinant2x2(),
    lineElement(dx, dy) {
      const metric = tensor.data;
      return (metric[0] * dx * dx) + (2 * metric[1] * dx * dy) + (metric[3] * dy * dy);
    },
  };
}

export function phiDecompose(tensor) {
  const weightedNorm = tensor.data.reduce(
    (sum, value, index) => sum + Math.abs(value) * (PHI ** -(index + 1)),
    0
  );
  return {
    weightedNorm: Number(weightedNorm.toFixed(6)),
    phiRatio: Number((weightedNorm * PHI_INV).toFixed(6)),
  };
}

export { PHI, PHI_INV };

export default {
  LieAlgebra,
  PHI,
  PHI_INV,
  Tensor,
  createMetricTensor,
  createTensor,
  identityTensor,
  phiDecompose,
};
