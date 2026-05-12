import Buffer "mo:base/Buffer";
import Time "mo:base/Time";

import Types "./Types";

actor ProposalIndex {
  stable var proposals : [Types.ProposalRecord] = [];
  stable var nextId : Nat = 1;

  func replaceProposal(updated : Types.ProposalRecord) {
    let buf = Buffer.Buffer<Types.ProposalRecord>(proposals.size());
    for (proposal in proposals.vals()) {
      if (proposal.id == updated.id) {
        buf.add(updated);
      } else {
        buf.add(proposal);
      };
    };
    proposals := Buffer.toArray(buf);
  };

  func appendProposal(proposal : Types.ProposalRecord) {
    let buf = Buffer.fromArray<Types.ProposalRecord>(proposals);
    buf.add(proposal);
    proposals := Buffer.toArray(buf);
  };

  func matchesFilter(proposal : Types.ProposalRecord, filter : Types.ProposalFilter) : Bool {
    let statusOk = switch (filter.status) {
      case null { true };
      case (?status) { proposal.status == status };
    };
    let topicOk = switch (filter.topic) {
      case null { true };
      case (?topic) { proposal.topic == topic };
    };
    let sourceOk = switch (filter.source) {
      case null { true };
      case (?source) { proposal.source == source };
    };
    statusOk and topicOk and sourceOk
  };

  public query func getProposal(id : Nat) : async ?Types.ProposalRecord {
    for (proposal in proposals.vals()) {
      if (proposal.id == id) { return ?proposal };
    };
    null
  };

  public query func listProposals(filter : Types.ProposalFilter) : async [Types.ProposalRecord] {
    let buf = Buffer.Buffer<Types.ProposalRecord>(proposals.size());
    for (proposal in proposals.vals()) {
      if (matchesFilter(proposal, filter)) { buf.add(proposal) };
    };
    Buffer.toArray(buf)
  };

  public query func countProposals() : async Nat {
    proposals.size()
  };

  public query func getProposalsByStatus(status : Text) : async [Types.ProposalRecord] {
    let buf = Buffer.Buffer<Types.ProposalRecord>(proposals.size());
    for (proposal in proposals.vals()) {
      if (proposal.status == status) { buf.add(proposal) };
    };
    Buffer.toArray(buf)
  };

  public query func getProposalsBySNS(rootCanisterId : Text) : async [Types.ProposalRecord] {
    let buf = Buffer.Buffer<Types.ProposalRecord>(proposals.size());
    for (proposal in proposals.vals()) {
      switch (proposal.rootCanisterId) {
        case (?root) {
          if (root == rootCanisterId) { buf.add(proposal) };
        };
        case null {};
      };
    };
    Buffer.toArray(buf)
  };

  public func ingestProposal(input : Types.ProposalInput) : async Nat {
    let now = Time.now();
    let proposal : Types.ProposalRecord = {
      id = nextId;
      source = input.source;
      title = input.title;
      summary = input.summary;
      topic = input.topic;
      rootCanisterId = input.rootCanisterId;
      status = "ingested";
      createdAt = now;
      updatedAt = now;
      execution = null;
    };
    appendProposal(proposal);
    nextId += 1;
    proposal.id
  };

  public func refreshProposalStatus(id : Nat) : async ?Types.ProposalRecord {
    switch (await getProposal(id)) {
      case null { null };
      case (?proposal) {
        let refreshed = {
          proposal with
          status = if (proposal.status == "ingested") { "tracked" } else { proposal.status };
          updatedAt = Time.now();
        };
        replaceProposal(refreshed);
        ?refreshed
      };
    }
  };

  public func updateProposalExecution(id : Nat, result : Types.ExecutionResult) : async ?Types.ProposalRecord {
    switch (await getProposal(id)) {
      case null { null };
      case (?proposal) {
        let updated = {
          proposal with
          status = result.status;
          updatedAt = Time.now();
          execution = ?result;
        };
        replaceProposal(updated);
        ?updated
      };
    }
  };
}
