/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║       OUTPUT FORMATS — Multi-Format Export for Inventory Data              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

function toJSON(record, options = {}) {
  const data = options.compact ? {
    id: record.recordId,
    warehouse: record.warehouse.code,
    items: record.items.length,
    onHand: record.levels.onHand,
    available: record.levels.available,
    status: record.status,
  } : record;
  return options.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
}

function toCSV(records) {
  const arr = Array.isArray(records) ? records : [records];
  const header = 'record_id,warehouse,zone,item_count,on_hand,allocated,available,in_transit,status';
  const rows = arr.map(r =>
    `${r.recordId},${r.warehouse.name},${r.warehouse.zone},${r.items.length},${r.levels.onHand},${r.levels.allocated},${r.levels.available},${r.levels.inTransit},${r.status}`
  );
  return [header, ...rows].join('\n');
}

function itemsToCSV(record) {
  const header = 'sku,name,category,unit,unit_cost,weight,expiry,lot_number';
  const rows = record.items.map(i =>
    `${i.sku},${i.name},${i.category},${i.unit},${i.unitCost},${i.weight},${i.expiryDate || ''},${i.lotNumber || ''}`
  );
  return [header, ...rows].join('\n');
}

function movementsToCSV(record) {
  const header = 'movement_id,timestamp,type,sku,quantity,from,to,reference,performed_by';
  const rows = record.movements.map(m =>
    `${m.movementId},${m.timestamp},${m.type},${m.sku},${m.quantity},${m.fromLocation || ''},${m.toLocation || ''},${m.reference || ''},${m.performedBy}`
  );
  return [header, ...rows].join('\n');
}

function toAPIPayload(record) {
  return {
    type: 'inventory_update',
    version: '1.0',
    timestamp: new Date().toISOString(),
    payload: {
      recordId: record.recordId,
      warehouse: record.warehouse,
      levels: record.levels,
      itemCount: record.items.length,
      status: record.status,
    },
    meta: {
      confidence: record.audit.confidence,
      sourceHash: record.audit.sourceHash,
    },
  };
}

function toEmbeddingBlocks(record) {
  const blocks = [];

  // Overview block
  blocks.push({
    blockType: 'overview',
    text: `Inventory Record ${record.recordId} at warehouse ${record.warehouse.name} (${record.warehouse.code}), ` +
      `zone ${record.warehouse.zone || 'General'}. ` +
      `${record.items.length} items tracked. Status: ${record.status}. ` +
      `Stock: ${record.levels.onHand} on-hand, ${record.levels.available} available.`,
  });

  // Items block
  if (record.items.length > 0) {
    blocks.push({
      blockType: 'items',
      text: record.items.map(i =>
        `${i.sku} "${i.name}" category:${i.category} unit:${i.unit} cost:$${i.unitCost}`
      ).join('. '),
    });
  }

  // Levels block
  blocks.push({
    blockType: 'stock_levels',
    text: `On-hand: ${record.levels.onHand}, Allocated: ${record.levels.allocated}, ` +
      `Available: ${record.levels.available}, In-transit: ${record.levels.inTransit}, ` +
      `Back-ordered: ${record.levels.backOrdered}`,
  });

  return blocks;
}

module.exports = { toJSON, toCSV, itemsToCSV, movementsToCSV, toAPIPayload, toEmbeddingBlocks };
