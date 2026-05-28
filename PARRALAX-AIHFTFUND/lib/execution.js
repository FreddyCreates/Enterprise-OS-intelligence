import { createTradeReceipt } from "./receipts.js";

export class PaperExecutionEngine {
  constructor() {
    this.positions = new Map();
    this.orders = [];
  }

  execute(order) {
    const fill = {
      orderId: `order-${this.orders.length + 1}`,
      venue: order.venue ?? "paper",
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      status: "filled",
      createdAt: new Date().toISOString(),
    };
    this.orders.push(fill);
    this.positions.set(order.symbol, {
      symbol: order.symbol,
      quantity: (this.positions.get(order.symbol)?.quantity ?? 0) + (order.side === "BUY" ? order.quantity : -order.quantity),
      lastPrice: order.price,
    });
    return {
      fill,
      receipt: createTradeReceipt(fill),
    };
  }

  portfolio() {
    return [...this.positions.values()];
  }
}

export class MarketMemory {
  constructor() {
    this.entries = [];
  }

  write(entry) {
    this.entries.push({ ...entry, writtenAt: new Date().toISOString() });
    return this.entries.length;
  }

  list() {
    return [...this.entries];
  }
}
