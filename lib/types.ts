// Types pour l'application de vote CSE

export type VoteChoice = "favorable" | "defavorable" | "abstention";

export type SessionStatus = "open" | "closed";

export interface Session {
  id?: string;
  title: string;
  status: SessionStatus;
  sessionCode: string;
  voterCount: number;
  currentVotes: number;
  adminEmail: string;
  createdAt: number;
  closedAt: number | null;
}

export interface Vote {
  choice: VoteChoice;
  createdAt: number;
}

export interface VoteResults {
  favorable: number;
  defavorable: number;
  abstention: number;
  total: number;
}
