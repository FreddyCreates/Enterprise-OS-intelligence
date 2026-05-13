export class UpgradeController {
  schedule(entityId, version) {
    return {
      entityId,
      version,
      scheduledAt: new Date().toISOString(),
      status: "scheduled",
    };
  }
}
