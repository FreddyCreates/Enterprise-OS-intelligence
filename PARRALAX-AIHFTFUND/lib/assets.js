import { createAssetReceipt } from "./receipts.js";

export class TokenEngine {
  constructor() {
    this.tokens = new Map();
  }

  issue({ assetId, supply, rights = [], actor }) {
    const token = {
      assetId,
      class: "token",
      supply,
      rights,
      actor,
      createdAt: new Date().toISOString(),
    };
    this.tokens.set(assetId, token);
    return {
      token,
      receipt: createAssetReceipt({ assetId, assetClass: "token", action: "issue", actor }),
    };
  }
}

export class NFTEngine {
  constructor() {
    this.nfts = new Map();
  }

  mint({ assetId, metadata = {}, actor }) {
    const nft = {
      assetId,
      class: "nft",
      metadata,
      actor,
      createdAt: new Date().toISOString(),
    };
    this.nfts.set(assetId, nft);
    return {
      nft,
      receipt: createAssetReceipt({ assetId, assetClass: "nft", action: "mint", actor }),
    };
  }
}
