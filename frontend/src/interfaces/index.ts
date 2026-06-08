import type { Plan } from "../types";

// Interfaces


// Project-related Interfaces

export interface Project {
    id: string;
    user: User;
    topic: string;
    description: string;
    research_question: string | null;
    subtopics: Subtopics | null;
    available_trusted_literatures: string[][] | null;
    summary: string | null;
    literature_summarized: string | null;
    thesis: string | null;
    scan_mode: boolean;
    editors: User[];
    viewers: User[];
}

export interface Subtopics {
    subtopics: Subtopic[]
}

export interface Subtopic {
    subtopic: string;
    description: string;
}


// User-related interfaces

export interface User {
    id: string;
    username: string;
    email: string;
    plan: Plan;
}


// Source-related interfaces


export interface SourceResponse {
    scores: Rating;
    other: OtherSourceInfo;
}

// Rating elements

export interface Rating {
    credibility_score: CredibilityScore;
    evidence_score: EvidenceScore
    relevance_score: RelevanceScore;
    purpose_score: number;
    objectivity_score: ObjectivityScore;
    total: number;
}

interface CredibilityScore {
    author_score: number;
    publisher_score: number;
    citation_score: number;
    total: number;
}

interface EvidenceScore {
    supported_score: number;
    cross_score: number;
    factual_score: number;
    total: number;
}

interface ObjectivityScore {
    perspectives_score: number;
    language_use_score: number;
    monetary_gain_score: number;
    total: number;
}

interface RelevanceScore {
    timeliness_score: number;
    helpfulness_score: number;
    total: number;
}

// Other Elements

export interface OtherSourceInfo {
    red_flags: string[];
    claims: string[];
    corporations: string[];
}