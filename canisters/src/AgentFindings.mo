import Buffer "mo:base/Buffer";
import Time "mo:base/Time";

import Types "./Types";

actor AgentFindings {
  stable var findings : [Types.AgentFinding] = [];
  stable var disputes : [Types.DisputeRecord] = [];
  stable var nextFindingId : Nat = 1;
  stable var nextDisputeId : Nat = 1;

  func replaceFinding(updated : Types.AgentFinding) {
    let buf = Buffer.Buffer<Types.AgentFinding>(findings.size());
    for (finding in findings.vals()) {
      if (finding.id == updated.id) { buf.add(updated) } else { buf.add(finding) };
    };
    findings := Buffer.toArray(buf);
  };

  func replaceDispute(updated : Types.DisputeRecord) {
    let buf = Buffer.Buffer<Types.DisputeRecord>(disputes.size());
    for (dispute in disputes.vals()) {
      if (dispute.disputeId == updated.disputeId) { buf.add(updated) } else { buf.add(dispute) };
    };
    disputes := Buffer.toArray(buf);
  };

  func findFinding(id : Nat) : ?Types.AgentFinding {
    for (finding in findings.vals()) {
      if (finding.id == id) { return ?finding };
    };
    null
  };

  public query func getFindingsByProposal(proposalId : Nat) : async [Types.AgentFinding] {
    let buf = Buffer.Buffer<Types.AgentFinding>(findings.size());
    for (finding in findings.vals()) {
      if (finding.proposalId == proposalId) { buf.add(finding) };
    };
    Buffer.toArray(buf)
  };

  public query func getFinding(id : Nat) : async ?Types.AgentFinding {
    findFinding(id)
  };

  public query func getDisputeHistory(findingId : Nat) : async [Types.DisputeRecord] {
    let buf = Buffer.Buffer<Types.DisputeRecord>(disputes.size());
    for (dispute in disputes.vals()) {
      if (dispute.findingId == findingId) { buf.add(dispute) };
    };
    Buffer.toArray(buf)
  };

  public query func countCriticalFindings() : async Nat {
    var count : Nat = 0;
    for (finding in findings.vals()) {
      if (finding.severity == "critical" and finding.status != "resolved") {
        count += 1;
      };
    };
    count
  };

  public func submitFinding(input : Types.AgentFindingInput) : async Nat {
    let buf = Buffer.fromArray<Types.AgentFinding>(findings);
    buf.add({
      id = nextFindingId;
      proposalId = input.proposalId;
      agent = input.agent;
      severity = input.severity;
      summary = input.summary;
      evidence = input.evidence;
      status = "submitted";
      createdAt = Time.now();
      reviewedAt = null;
    });
    findings := Buffer.toArray(buf);
    nextFindingId += 1;
    nextFindingId - 1
  };

  public func reviewFinding(id : Nat, decision : Text) : async ?Types.AgentFinding {
    switch (findFinding(id)) {
      case null { null };
      case (?finding) {
        let updated = {
          finding with
          status = decision;
          reviewedAt = ?Time.now();
        };
        replaceFinding(updated);
        ?updated
      };
    }
  };

  public func disputeFinding(id : Nat, dispute : Text) : async ?Types.DisputeRecord {
    switch (findFinding(id)) {
      case null { null };
      case (?finding) {
        let buf = Buffer.fromArray<Types.DisputeRecord>(disputes);
        let record : Types.DisputeRecord = {
          disputeId = nextDisputeId;
          findingId = finding.id;
          dispute = dispute;
          resolution = null;
          status = "open";
          createdAt = Time.now();
          resolvedAt = null;
        };
        buf.add(record);
        disputes := Buffer.toArray(buf);
        nextDisputeId += 1;
        ?record
      };
    }
  };

  public func resolveDispute(disputeId : Nat, resolution : Text) : async ?Types.DisputeRecord {
    for (dispute in disputes.vals()) {
      if (dispute.disputeId == disputeId) {
        let updated = {
          dispute with
          resolution = ?resolution;
          status = "resolved";
          resolvedAt = ?Time.now();
        };
        replaceDispute(updated);
        return ?updated
      };
    };
    null
  };
}
