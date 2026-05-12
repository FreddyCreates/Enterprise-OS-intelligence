module {
  public type Source = { #NNS; #SNS; #Internal };

  public type ProposalInput = {
    source : Source;
    title : Text;
    summary : Text;
    topic : Text;
    rootCanisterId : ?Text;
  };

  public type ExecutionResult = {
    status : Text;
    executedAt : Int;
    notes : Text;
  };

  public type ProposalRecord = {
    id : Nat;
    source : Source;
    title : Text;
    summary : Text;
    topic : Text;
    rootCanisterId : ?Text;
    status : Text;
    createdAt : Int;
    updatedAt : Int;
    execution : ?ExecutionResult;
  };

  public type ProposalFilter = {
    status : ?Text;
    topic : ?Text;
    source : ?Source;
  };

  public type ChronoState = {
    label : Text;
    data : Text;
    createdAt : Int;
    evidence : [Text];
  };

  public type RevisionRecord = {
    revisionId : Nat;
    traceId : Nat;
    summary : Text;
    updatedAt : Int;
  };

  public type EffectTraceInput = {
    proposalId : Nat;
    title : Text;
    summary : Text;
    riskLevel : Text;
    truthStatus : Text;
  };

  public type EffectTracePatch = {
    summary : ?Text;
    riskLevel : ?Text;
    truthStatus : ?Text;
  };

  public type EffectTraceRecord = {
    traceId : Nat;
    proposalId : Nat;
    title : Text;
    summary : Text;
    riskLevel : Text;
    truthStatus : Text;
    ante : ?ChronoState;
    medius : ?ChronoState;
    post : ?ChronoState;
    published : Bool;
    revisionCount : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type TraceFilter = {
    proposalId : ?Nat;
    riskLevel : ?Text;
    truthStatus : ?Text;
  };

  public type LinkInput = {
    sourceProposalId : Nat;
    targetProposalId : Nat;
    linkType : Text;
    description : Text;
  };

  public type PrecedentLink = {
    linkId : Nat;
    sourceProposalId : Nat;
    targetProposalId : Nat;
    linkType : Text;
    description : Text;
    createdAt : Int;
  };

  public type FieldCell = {
    targetId : Text;
    method : Text;
    intensity : Float;
    updatedAt : Int;
  };

  public type PostExecutionCheckInput = {
    proposalId : Nat;
    targetId : Text;
    method : Text;
    quality : Float;
    verified : Bool;
    notes : Text;
  };

  public type PatternInput = {
    label : Text;
    riskLevel : Text;
  };

  public type PatternRecord = {
    patternId : Nat;
    label : Text;
    riskLevel : Text;
    count : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  public type AgentFindingInput = {
    proposalId : Nat;
    agent : Text;
    severity : Text;
    summary : Text;
    evidence : [Text];
  };

  public type AgentFinding = {
    id : Nat;
    proposalId : Nat;
    agent : Text;
    severity : Text;
    summary : Text;
    evidence : [Text];
    status : Text;
    createdAt : Int;
    reviewedAt : ?Int;
  };

  public type DisputeRecord = {
    disputeId : Nat;
    findingId : Nat;
    dispute : Text;
    resolution : ?Text;
    status : Text;
    createdAt : Int;
    resolvedAt : ?Int;
  };

  public type EntityTier = { #Bronze; #Silver; #Gold; #Platinum; #Sovereign; #Specialist };

  public type HeartConfig = {
    numHearts : Nat;
    baseIntervalNs : Nat;
    phiMultiplier : Float;
  };

  public type BrainConfig = {
    numBrains : Nat;
    baseIntervalNs : Nat;
    thinkingModel : Text;
  };

  public type AIEntityInput = {
    name : Text;
    role : Text;
    department : Text;
    tier : EntityTier;
    heartConfig : HeartConfig;
    brainConfig : BrainConfig;
  };

  public type AIEntityRecord = {
    id : Nat;
    name : Text;
    role : Text;
    department : Text;
    tier : EntityTier;
    status : Text;
    heartConfig : HeartConfig;
    brainConfig : BrainConfig;
    totalHeartbeats : Nat;
    createdAt : Int;
    terminatedAt : ?Int;
  };

  public type EntityFilter = {
    department : ?Text;
    tier : ?EntityTier;
    status : ?Text;
  };

  public type EntityMemoryEntry = {
    entityId : Nat;
    key : Text;
    value : Text;
    category : Text;
    importance : Float;
    storedAt : Int;
  };

  public type EntityTaskRecord = {
    entityId : Nat;
    taskId : Nat;
    description : Text;
    priority : Nat;
    status : Text;
    createdAt : Int;
    completedAt : ?Int;
    result : ?Text;
  };

  public type DepartmentCount = {
    department : Text;
    count : Nat;
  };
};
