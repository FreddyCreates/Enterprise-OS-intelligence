import Buffer "mo:base/Buffer";
import Float "mo:base/Float";
import Time "mo:base/Time";

import Types "./Types";

actor GovernanceMemory {
  stable var links : [Types.PrecedentLink] = [];
  stable var field : [Types.FieldCell] = [];
  stable var postChecks : [Types.PostExecutionCheckInput] = [];
  stable var patterns : [Types.PatternRecord] = [];
  stable var nextLinkId : Nat = 1;
  stable var nextPatternId : Nat = 1;
  stable var lastTickAt : Int = 0;

  func updateFieldCell(targetId : Text, method : Text, delta : Float) : Float {
    let now = Time.now();
    let buf = Buffer.Buffer<Types.FieldCell>(field.size() + 1);
    var updatedIntensity : Float = delta;
    var found = false;

    for (cell in field.vals()) {
      if (cell.targetId == targetId and cell.method == method) {
        found := true;
        updatedIntensity := cell.intensity + delta;
        buf.add({ targetId = targetId; method = method; intensity = updatedIntensity; updatedAt = now });
      } else {
        buf.add(cell);
      };
    };

    if (not found) {
      buf.add({ targetId = targetId; method = method; intensity = delta; updatedAt = now });
    };

    field := Buffer.toArray(buf);
    updatedIntensity
  };

  public query func getGovernanceMemory(proposalId : Nat) : async {
    proposalId : Nat;
    relatedLinks : Nat;
    postExecutionChecks : Nat;
    activePatterns : Nat;
  } {
    var relatedLinks : Nat = 0;
    for (link in links.vals()) {
      if (link.sourceProposalId == proposalId or link.targetProposalId == proposalId) {
        relatedLinks += 1;
      };
    };

    var checks : Nat = 0;
    for (check in postChecks.vals()) {
      if (check.proposalId == proposalId) { checks += 1 };
    };

    {
      proposalId = proposalId;
      relatedLinks = relatedLinks;
      postExecutionChecks = checks;
      activePatterns = patterns.size();
    }
  };

  public query func findRelatedProposals(proposalId : Nat) : async [Types.PrecedentLink] {
    let buf = Buffer.Buffer<Types.PrecedentLink>(links.size());
    for (link in links.vals()) {
      if (link.sourceProposalId == proposalId or link.targetProposalId == proposalId) {
        buf.add(link);
      };
    };
    Buffer.toArray(buf)
  };

  public query func getFieldIntensity(targetId : Text, method : Text) : async Float {
    for (cell in field.vals()) {
      if (cell.targetId == targetId and cell.method == method) {
        return cell.intensity;
      };
    };
    0
  };

  public query func getFieldSnapshot() : async [Types.FieldCell] {
    field
  };

  public query func getPrecedentGraph(proposalId : Nat, depth : Nat) : async [Nat] {
    let visited = Buffer.Buffer<Nat>(8);
    visited.add(proposalId);
    var frontier : [Nat] = [proposalId];

    var currentDepth : Nat = 0;
    label search while (currentDepth < depth) {
      if (frontier.size() == 0) { break search };
      let next = Buffer.Buffer<Nat>(frontier.size() * 2 + 1);
      for (node in frontier.vals()) {
        for (link in links.vals()) {
          let candidate = if (link.sourceProposalId == node) {
            ?link.targetProposalId
          } else if (link.targetProposalId == node) {
            ?link.sourceProposalId
          } else {
            null
          };
          switch (candidate) {
            case null {};
            case (?value) {
              var seen = false;
              for (existing in visited.vals()) {
                if (existing == value) { seen := true };
              };
              if (not seen) {
                visited.add(value);
                next.add(value);
              };
            };
          };
        };
      };
      frontier := Buffer.toArray(next);
      currentDepth += 1;
    };

    Buffer.toArray(visited)
  };

  public func linkProposals(input : Types.LinkInput) : async Nat {
    let buf = Buffer.fromArray<Types.PrecedentLink>(links);
    buf.add({
      linkId = nextLinkId;
      sourceProposalId = input.sourceProposalId;
      targetProposalId = input.targetProposalId;
      linkType = input.linkType;
      description = input.description;
      createdAt = Time.now();
    });
    links := Buffer.toArray(buf);
    nextLinkId += 1;
    nextLinkId - 1
  };

  public func depositToField(targetId : Text, method : Text, weight : Float) : async Float {
    updateFieldCell(targetId, method, weight)
  };

  public func tickField() : async [Types.FieldCell] {
    let now = Time.now();
    if (lastTickAt != 0 and now - lastTickAt < 60_000_000_000) {
      return field;
    };

    let buf = Buffer.Buffer<Types.FieldCell>(field.size());
    for (cell in field.vals()) {
      let decayed = cell.intensity * 0.95;
      let nextIntensity = if (decayed < 0) { 0 } else { decayed };
      buf.add({ cell with intensity = nextIntensity; updatedAt = now });
    };
    field := Buffer.toArray(buf);
    lastTickAt := now;
    field
  };

  public func addPostExecutionCheck(input : Types.PostExecutionCheckInput) : async Nat {
    let buf = Buffer.fromArray<Types.PostExecutionCheckInput>(postChecks);
    buf.add(input);
    postChecks := Buffer.toArray(buf);
    ignore updateFieldCell(input.targetId, input.method, if (input.verified) { input.quality * 2 } else { input.quality });
    postChecks.size()
  };

  public func recordPatternDetection(pattern : Types.PatternInput) : async Types.PatternRecord {
    let now = Time.now();
    let buf = Buffer.Buffer<Types.PatternRecord>(patterns.size() + 1);
    var output : ?Types.PatternRecord = null;

    for (item in patterns.vals()) {
      if (item.label == pattern.label and item.riskLevel == pattern.riskLevel) {
        let updated = {
          item with
          count = item.count + 1;
          updatedAt = now;
        };
        output := ?updated;
        buf.add(updated);
      } else {
        buf.add(item);
      };
    };

    switch (output) {
      case (?value) {
        patterns := Buffer.toArray(buf);
        value
      };
      case null {
        let created : Types.PatternRecord = {
          patternId = nextPatternId;
          label = pattern.label;
          riskLevel = pattern.riskLevel;
          count = 1;
          createdAt = now;
          updatedAt = now;
        };
        buf.add(created);
        patterns := Buffer.toArray(buf);
        nextPatternId += 1;
        created
      };
    }
  };
}
