import Buffer "mo:base/Buffer";
import Time "mo:base/Time";

import Types "./Types";

actor EffectTrace {
  stable var traces : [Types.EffectTraceRecord] = [];
  stable var revisions : [Types.RevisionRecord] = [];
  stable var nextTraceId : Nat = 1;
  stable var nextRevisionId : Nat = 1;

  func replaceTrace(updated : Types.EffectTraceRecord) {
    let buf = Buffer.Buffer<Types.EffectTraceRecord>(traces.size());
    for (trace in traces.vals()) {
      if (trace.traceId == updated.traceId) { buf.add(updated) } else { buf.add(trace) };
    };
    traces := Buffer.toArray(buf);
  };

  func addRevision(traceId : Nat, summary : Text) {
    let buf = Buffer.fromArray<Types.RevisionRecord>(revisions);
    buf.add({
      revisionId = nextRevisionId;
      traceId = traceId;
      summary = summary;
      updatedAt = Time.now();
    });
    revisions := Buffer.toArray(buf);
    nextRevisionId += 1;
  };

  func appendTrace(trace : Types.EffectTraceRecord) {
    let buf = Buffer.fromArray<Types.EffectTraceRecord>(traces);
    buf.add(trace);
    traces := Buffer.toArray(buf);
  };

  func findTrace(traceId : Nat) : ?Types.EffectTraceRecord {
    for (trace in traces.vals()) {
      if (trace.traceId == traceId) { return ?trace };
    };
    null
  };

  func matchesFilter(trace : Types.EffectTraceRecord, filter : Types.TraceFilter) : Bool {
    let proposalOk = switch (filter.proposalId) {
      case null { true };
      case (?proposalId) { trace.proposalId == proposalId };
    };
    let riskOk = switch (filter.riskLevel) {
      case null { true };
      case (?riskLevel) { trace.riskLevel == riskLevel };
    };
    let truthOk = switch (filter.truthStatus) {
      case null { true };
      case (?truthStatus) { trace.truthStatus == truthStatus };
    };
    proposalOk and riskOk and truthOk
  };

  public query func getTrace(id : Nat) : async ?Types.EffectTraceRecord {
    findTrace(id)
  };

  public query func getTraceByProposal(proposalId : Nat) : async ?Types.EffectTraceRecord {
    for (trace in traces.vals()) {
      if (trace.proposalId == proposalId) { return ?trace };
    };
    null
  };

  public query func listTraces(filter : Types.TraceFilter) : async [Types.EffectTraceRecord] {
    let buf = Buffer.Buffer<Types.EffectTraceRecord>(traces.size());
    for (trace in traces.vals()) {
      if (matchesFilter(trace, filter)) { buf.add(trace) };
    };
    Buffer.toArray(buf)
  };

  public query func getRevisionHistory(traceId : Nat) : async [Types.RevisionRecord] {
    let buf = Buffer.Buffer<Types.RevisionRecord>(revisions.size());
    for (revision in revisions.vals()) {
      if (revision.traceId == traceId) { buf.add(revision) };
    };
    Buffer.toArray(buf)
  };

  public query func getAnteState(traceId : Nat) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) { trace.ante };
    }
  };

  public query func getMediusState(traceId : Nat) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) { trace.medius };
    }
  };

  public query func getPostState(traceId : Nat) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) { trace.post };
    }
  };

  public func createTrace(input : Types.EffectTraceInput) : async Nat {
    let now = Time.now();
    let trace : Types.EffectTraceRecord = {
      traceId = nextTraceId;
      proposalId = input.proposalId;
      title = input.title;
      summary = input.summary;
      riskLevel = input.riskLevel;
      truthStatus = input.truthStatus;
      ante = null;
      medius = null;
      post = null;
      published = false;
      revisionCount = 0;
      createdAt = now;
      updatedAt = now;
    };
    appendTrace(trace);
    addRevision(trace.traceId, "trace_created");
    nextTraceId += 1;
    trace.traceId
  };

  public func updateTrace(id : Nat, patch : Types.EffectTracePatch) : async ?Types.EffectTraceRecord {
    switch (findTrace(id)) {
      case null { null };
      case (?trace) {
        let updated = {
          trace with
          summary = switch (patch.summary) { case null { trace.summary }; case (?value) { value } };
          riskLevel = switch (patch.riskLevel) { case null { trace.riskLevel }; case (?value) { value } };
          truthStatus = switch (patch.truthStatus) { case null { trace.truthStatus }; case (?value) { value } };
          revisionCount = trace.revisionCount + 1;
          updatedAt = Time.now();
        };
        replaceTrace(updated);
        addRevision(id, "trace_updated");
        ?updated
      };
    }
  };

  public func publishTrace(id : Nat) : async ?Types.EffectTraceRecord {
    switch (findTrace(id)) {
      case null { null };
      case (?trace) {
        let updated = { trace with published = true; updatedAt = Time.now(); revisionCount = trace.revisionCount + 1 };
        replaceTrace(updated);
        addRevision(id, "trace_published");
        ?updated
      };
    }
  };

  public func lockAnteState(traceId : Nat, state : Text) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) {
        switch (trace.ante) {
          case (?existing) { ?existing };
          case null {
            let chronoState : Types.ChronoState = {
              label = "ANTE";
              data = state;
              createdAt = Time.now();
              evidence = [];
            };
            let updated = { trace with ante = ?chronoState; updatedAt = Time.now() };
            replaceTrace(updated);
            addRevision(traceId, "ante_locked");
            ?chronoState
          };
        }
      };
    }
  };

  public func anchorMediusState(traceId : Nat, state : Text) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) {
        switch (trace.medius) {
          case (?existing) { ?existing };
          case null {
            let chronoState : Types.ChronoState = {
              label = "MEDIUS";
              data = state;
              createdAt = Time.now();
              evidence = [];
            };
            let updated = { trace with medius = ?chronoState; updatedAt = Time.now() };
            replaceTrace(updated);
            addRevision(traceId, "medius_anchored");
            ?chronoState
          };
        }
      };
    }
  };

  public func writePostState(traceId : Nat, state : Text, evidence : [Text]) : async ?Types.ChronoState {
    switch (findTrace(traceId)) {
      case null { null };
      case (?trace) {
        switch (trace.medius) {
          case null { null };
          case (?_) {
            let chronoState : Types.ChronoState = {
              label = "POST";
              data = state;
              createdAt = Time.now();
              evidence = evidence;
            };
            let updated = {
              trace with
              post = ?chronoState;
              truthStatus = "verified_after_state";
              updatedAt = Time.now();
              revisionCount = trace.revisionCount + 1;
            };
            replaceTrace(updated);
            addRevision(traceId, "post_written");
            ?chronoState
          };
        }
      };
    }
  };
}
