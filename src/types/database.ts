import type { Database as GeneratedDatabase } from './database.generated'

// Matches GenericTable from @supabase/postgrest-js — used to satisfy the
// Record<string, GenericTable> constraint that SupabaseClient checks at the
// Schema type parameter level. Without an index signature on Tables, the SDK
// falls back to Schema=never and all query result types become never.
type IndexableTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: { foreignKeyName: string; columns: string[]; isOneToOne?: boolean; referencedRelation: string; referencedColumns: string[] }[]
}

// ── Non-table types ───────────────────────────────────────────────────────────

export interface Stroke {
  tool: 'pen' | 'marker' | 'eraser'
  color: string
  width: number
  points: Array<{ x: number; y: number }>
}

export interface TocItem {
  level: number
  text: string
  pid: string
}

export type UserRole = 'free' | 'premium'

export interface Profile {
  id: string
  role: string
  created_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  subscription_status: string | null
  subscription_period_end: string | null
  cancel_at_period_end: boolean | null
}

export interface Tema {
  id: number
  slug: string
  parte: string
  numero: number
  titulo: string
  published: boolean
  preview_for_free: boolean
  orden: number
}

export interface Annotation {
  id: string
  user_id: string
  tema_id: number
  paragraph_id: string
  type: 'note' | 'highlight'
  content: string | null
  color: 'yellow' | 'green' | 'pink' | 'blue' | null
  range_start: number | null
  range_end: number | null
  created_at: string
  updated_at: string
}

export interface Summary {
  user_id: string
  tema_id: number
  content: string
  updated_at: string
}

export interface Drawing {
  user_id: string
  tema_id: number
  strokes: Stroke[]
  updated_at: string
}

export interface Progress {
  user_id: string
  tema_id: number
  scroll_percent: number
  last_paragraph_id: string | null
  last_visited_at: string
}

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export type Database = {
  __InternalSupabase: GeneratedDatabase['__InternalSupabase']
  public: {
    Tables: Record<string, IndexableTable> & {
      profiles: {
        Row: Profile
        Insert: {
          id: string; role?: string; created_at?: string | null
          stripe_customer_id?: string | null; stripe_subscription_id?: string | null
          stripe_price_id?: string | null; subscription_status?: string | null
          subscription_period_end?: string | null; cancel_at_period_end?: boolean | null
        }
        Update: {
          id?: string; role?: string; created_at?: string | null
          stripe_customer_id?: string | null; stripe_subscription_id?: string | null
          stripe_price_id?: string | null; subscription_status?: string | null
          subscription_period_end?: string | null; cancel_at_period_end?: boolean | null
        }
        Relationships: Relationship[]
      }
      temas: {
        Row: Tema
        Insert: {
          id?: number; slug: string; parte: string; numero: number
          titulo: string; published?: boolean; preview_for_free?: boolean; orden: number
        }
        Update: {
          id?: number; slug?: string; parte?: string; numero?: number
          titulo?: string; published?: boolean; preview_for_free?: boolean; orden?: number
        }
        Relationships: Relationship[]
      }
      annotations: {
        Row: Annotation
        Insert: {
          id?: string; user_id: string; tema_id: number; paragraph_id: string
          type: 'note' | 'highlight'; content?: string | null
          color?: 'yellow' | 'green' | 'pink' | 'blue' | null
          range_start?: number | null; range_end?: number | null
          created_at?: string; updated_at?: string
        }
        Update: {
          content?: string | null
          color?: 'yellow' | 'green' | 'pink' | 'blue' | null
          updated_at?: string
        }
        Relationships: Relationship[]
      }
      summaries: {
        Row: Summary
        Insert: { user_id: string; tema_id: number; content?: string; updated_at?: string }
        Update: { content?: string; updated_at?: string }
        Relationships: Relationship[]
      }
      drawings: {
        Row: Drawing
        Insert: { user_id: string; tema_id: number; strokes?: Stroke[]; updated_at?: string }
        Update: { strokes?: Stroke[]; updated_at?: string }
        Relationships: Relationship[]
      }
      progress: {
        Row: Progress
        Insert: {
          user_id: string; tema_id: number; scroll_percent?: number
          last_paragraph_id?: string | null; last_visited_at?: string
        }
        Update: {
          scroll_percent?: number
          last_paragraph_id?: string | null
          last_visited_at?: string
        }
        Relationships: Relationship[]
      }
    }
    Views: Record<string, { Row: Record<string, unknown>; Relationships: Relationship[] }>
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>
    Enums: Record<string, string[]>
    CompositeTypes: Record<string, Record<string, unknown>>
  }
}
