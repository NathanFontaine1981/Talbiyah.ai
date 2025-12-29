// Types for Explore & Anchor Onboarding Flows

export type UserRole = 'non_muslim' | 'new_muslim' | 'student' | 'teacher' | 'admin';

// User profile with explore/anchor fields
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  roles: UserRole[];
  explore_completed: boolean;
  anchor_completed: boolean;
  avatar_url?: string | null;
}

// Axiom for Explore flow (scientific/logical proofs)
export interface Axiom {
  id: string;
  title: string;
  category: 'cosmology' | 'geology' | 'biology' | 'history' | 'linguistics';
  quranicReference: {
    surah: number;
    ayah: number;
    arabicText: string;
    translation: string;
  };
  scientificEvidence: string;
  discoveryYear: number;  // When science confirmed this
  quranYear: number;      // 609-632 CE (revelation period)
  sources: string[];      // Scientific source URLs
  difficulty: 'easy' | 'medium' | 'hard';
}

// Fact for Anchor flow (faith-building facts)
export interface Fact {
  id: string;
  title: string;
  category: 'prophecy' | 'preservation' | 'historical' | 'mathematical' | 'linguistic';
  description: string;
  evidence: string;
  probabilityWeight: number;  // 0-1, contribution to overall probability
  sources: string[];
  verificationQuestion: string;  // Question to confirm understanding
}

// Progress tracking types
export interface ExploreProgress {
  id: string;
  user_id: string;
  current_step: number;
  axioms_agreed: string[];  // Axiom IDs
  started_at: string;
  completed_at: string | null;
}

export interface AnchorProgress {
  id: string;
  user_id: string;
  current_step: number;
  facts_verified: string[];  // Fact IDs
  probability_score: number;
  started_at: string;
  completed_at: string | null;
}
