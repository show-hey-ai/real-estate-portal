/**
 * Agent Team 型定義
 */

export type AgentRole =
  | 'orchestrator'
  | 'reins-scraper'
  | 'pdf-extractor'
  | 'data-validator'
  | 'translator'
  | 'db-sync'
  | 'inbox-responder'
  | 'ad-manager'
  | 'email-marketer'

export interface AgentConfig {
  role: AgentRole
  description: string
  prompt: string
  tools: string[]
  model?: string
  mcpServers?: Record<string, { command: string; args: string[] }>
  maxTurns?: number
  maxBudgetUsd?: number
}

export interface PipelineResult {
  success: boolean
  listingsProcessed: number
  listingsSkipped: number
  errors: string[]
  duration: number
}

export interface MarketingResult {
  postsCreated: number
  emailsSent: number
  repliesSent: number
  errors: string[]
}

export type TeamMode = 'pipeline' | 'marketing' | 'full'
