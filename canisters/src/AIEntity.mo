import Buffer "mo:base/Buffer";
import Time "mo:base/Time";

import Types "./Types";

actor AIEntity {
  stable var entities : [Types.AIEntityRecord] = [];
  stable var memories : [Types.EntityMemoryEntry] = [];
  stable var tasks : [Types.EntityTaskRecord] = [];
  stable var nextEntityId : Nat = 1;
  stable var nextTaskId : Nat = 1;

  func replaceEntity(updated : Types.AIEntityRecord) {
    let buf = Buffer.Buffer<Types.AIEntityRecord>(entities.size());
    for (entity in entities.vals()) {
      if (entity.id == updated.id) { buf.add(updated) } else { buf.add(entity) };
    };
    entities := Buffer.toArray(buf);
  };

  func replaceTask(updated : Types.EntityTaskRecord) {
    let buf = Buffer.Buffer<Types.EntityTaskRecord>(tasks.size());
    for (task in tasks.vals()) {
      if (task.taskId == updated.taskId and task.entityId == updated.entityId) { buf.add(updated) } else { buf.add(task) };
    };
    tasks := Buffer.toArray(buf);
  };

  func findEntity(id : Nat) : ?Types.AIEntityRecord {
    for (entity in entities.vals()) {
      if (entity.id == id) { return ?entity };
    };
    null
  };

  func matchesFilter(entity : Types.AIEntityRecord, filter : Types.EntityFilter) : Bool {
    let departmentOk = switch (filter.department) {
      case null { true };
      case (?department) { entity.department == department };
    };
    let tierOk = switch (filter.tier) {
      case null { true };
      case (?tier) { entity.tier == tier };
    };
    let statusOk = switch (filter.status) {
      case null { true };
      case (?status) { entity.status == status };
    };
    departmentOk and tierOk and statusOk
  };

  public query func getEntity(id : Nat) : async ?Types.AIEntityRecord {
    findEntity(id)
  };

  public query func listEntities(filter : Types.EntityFilter) : async [Types.AIEntityRecord] {
    let buf = Buffer.Buffer<Types.AIEntityRecord>(entities.size());
    for (entity in entities.vals()) {
      if (matchesFilter(entity, filter)) { buf.add(entity) };
    };
    Buffer.toArray(buf)
  };

  public query func countByDepartment() : async [Types.DepartmentCount] {
    var counts : [Types.DepartmentCount] = [];
    for (entity in entities.vals()) {
      var matched = false;
      let updated = Buffer.Buffer<Types.DepartmentCount>(counts.size() + 1);
      for (item in counts.vals()) {
        if (item.department == entity.department) {
          matched := true;
          updated.add({ department = item.department; count = item.count + 1 });
        } else {
          updated.add(item);
        };
      };
      if (not matched) {
        updated.add({ department = entity.department; count = 1 });
      };
      counts := Buffer.toArray(updated);
    };
    counts
  };

  public query func countEntities() : async Nat {
    entities.size()
  };

  public query func getEntityMemory(entityId : Nat) : async [Types.EntityMemoryEntry] {
    let buf = Buffer.Buffer<Types.EntityMemoryEntry>(memories.size());
    for (memory in memories.vals()) {
      if (memory.entityId == entityId) { buf.add(memory) };
    };
    Buffer.toArray(buf)
  };

  public query func getEntityTasks(entityId : Nat) : async [Types.EntityTaskRecord] {
    let buf = Buffer.Buffer<Types.EntityTaskRecord>(tasks.size());
    for (task in tasks.vals()) {
      if (task.entityId == entityId) { buf.add(task) };
    };
    Buffer.toArray(buf)
  };

  public query func getTotalHeartbeats() : async Nat {
    var total : Nat = 0;
    for (entity in entities.vals()) { total += entity.totalHeartbeats };
    total
  };

  public query func getWorkforceStatus() : async {
    totalEntities : Nat;
    activeEntities : Nat;
    totalHeartbeats : Nat;
    totalTasks : Nat;
    totalMemories : Nat;
  } {
    var active : Nat = 0;
    var totalHeartbeatsValue : Nat = 0;
    for (entity in entities.vals()) {
      if (entity.status == "active") { active += 1 };
      totalHeartbeatsValue += entity.totalHeartbeats;
    };
    {
      totalEntities = entities.size();
      activeEntities = active;
      totalHeartbeats = totalHeartbeatsValue;
      totalTasks = tasks.size();
      totalMemories = memories.size();
    }
  };

  public func birthEntity(input : Types.AIEntityInput) : async Nat {
    let buf = Buffer.fromArray<Types.AIEntityRecord>(entities);
    buf.add({
      id = nextEntityId;
      name = input.name;
      role = input.role;
      department = input.department;
      tier = input.tier;
      status = "active";
      heartConfig = input.heartConfig;
      brainConfig = input.brainConfig;
      totalHeartbeats = 0;
      createdAt = Time.now();
      terminatedAt = null;
    });
    entities := Buffer.toArray(buf);
    nextEntityId += 1;
    nextEntityId - 1
  };

  public func heartbeat(entityId : Nat) : async ?Nat {
    switch (findEntity(entityId)) {
      case null { null };
      case (?entity) {
        let updated = { entity with totalHeartbeats = entity.totalHeartbeats + 1 };
        replaceEntity(updated);
        ?updated.totalHeartbeats
      };
    }
  };

  public func storeMemory(entityId : Nat, key : Text, value : Text, cat : Text, importance : Float) : async Nat {
    let buf = Buffer.fromArray<Types.EntityMemoryEntry>(memories);
    buf.add({
      entityId = entityId;
      key = key;
      value = value;
      category = cat;
      importance = importance;
      storedAt = Time.now();
    });
    memories := Buffer.toArray(buf);
    memories.size()
  };

  public func assignTask(entityId : Nat, description : Text, priority : Nat) : async Nat {
    let buf = Buffer.fromArray<Types.EntityTaskRecord>(tasks);
    buf.add({
      entityId = entityId;
      taskId = nextTaskId;
      description = description;
      priority = priority;
      status = "queued";
      createdAt = Time.now();
      completedAt = null;
      result = null;
    });
    tasks := Buffer.toArray(buf);
    nextTaskId += 1;
    nextTaskId - 1
  };

  public func completeTask(entityId : Nat, taskId : Nat, result : Text) : async ?Types.EntityTaskRecord {
    for (task in tasks.vals()) {
      if (task.entityId == entityId and task.taskId == taskId) {
        let updated = {
          task with
          status = "completed";
          completedAt = ?Time.now();
          result = ?result;
        };
        replaceTask(updated);
        return ?updated
      };
    };
    null
  };

  public func updateStatus(entityId : Nat, status : Text) : async ?Types.AIEntityRecord {
    switch (findEntity(entityId)) {
      case null { null };
      case (?entity) {
        let updated = { entity with status = status };
        replaceEntity(updated);
        ?updated
      };
    }
  };

  public func terminateEntity(entityId : Nat) : async ?Types.AIEntityRecord {
    switch (findEntity(entityId)) {
      case null { null };
      case (?entity) {
        let updated = {
          entity with
          status = "terminated";
          terminatedAt = ?Time.now();
        };
        replaceEntity(updated);
        ?updated
      };
    }
  };
}
