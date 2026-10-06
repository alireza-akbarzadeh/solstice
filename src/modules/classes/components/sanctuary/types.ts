export type BreathPhase = "inhale" | "retain" | "exhale" | "empty";

export type SanctuaryTab = "intentions" | "inquiries";

export interface IntentionItem {
  id: number;
  author: string;
  location: string;
  time: string;
  body: string;
  hearts: number;
  isPin: boolean;
}

export interface InquiryItem {
  id: number;
  author: string;
  body: string;
  votes: number;
}

export interface PeerPractitioner {
  id: string;
  name: string;
  location: string;
  image?: string;
  isSelf?: boolean;
}
