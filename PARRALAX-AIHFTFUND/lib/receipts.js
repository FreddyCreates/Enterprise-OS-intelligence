import crypto from "node:crypto";

function receiptId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createComputeReceipt({
  agentId,
  strategyId,
  inputHash,
  modelVersion,
  outcome,
}) {
  return {
    receiptId: receiptId("compute"),
    receiptType: "compute",
    agentId,
    strategyId,
    inputHash,
    modelVersion,
    outcome,
    createdAt: new Date().toISOString(),
  };
}

export function createTradeReceipt({
  strategyId,
  venue,
  symbol,
  side,
  quantity,
  price,
  status,
}) {
  return {
    receiptId: receiptId("trade"),
    receiptType: "trade",
    strategyId,
    venue,
    symbol,
    side,
    quantity,
    price,
    status,
    createdAt: new Date().toISOString(),
  };
}

export function createSignalReceipt({
  agentId,
  symbol,
  signal,
  confidence,
  regime,
}) {
  return {
    receiptId: receiptId("signal"),
    receiptType: "signal",
    agentId,
    symbol,
    signal,
    confidence,
    regime,
    createdAt: new Date().toISOString(),
  };
}

export function createGovernanceReceipt({
  actor,
  action,
  target,
  approved,
  notes,
}) {
  return {
    receiptId: receiptId("governance"),
    receiptType: "governance",
    actor,
    action,
    target,
    approved,
    notes,
    createdAt: new Date().toISOString(),
  };
}

export function createAssetReceipt({
  assetId,
  assetClass,
  action,
  actor,
}) {
  return {
    receiptId: receiptId("asset"),
    receiptType: "asset",
    assetId,
    assetClass,
    action,
    actor,
    createdAt: new Date().toISOString(),
  };
}

export class ReceiptLedger {
  constructor() {
    this.receipts = [];
  }

  write(receipt) {
    this.receipts.push(receipt);
    return receipt;
  }

  list(type = null) {
    return type ? this.receipts.filter((receipt) => receipt.receiptType === type) : [...this.receipts];
  }
}
