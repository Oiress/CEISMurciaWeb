export type UserRole = 'free' | 'premium'

export interface Profile {
  id: string
  role: UserRole
  created_at: string
}

export interface Tema {
  id: number
  slug: string
  parte: 'general' | 'especifica'
  numero: number
  titulo: string
  published: boolean
  preview_for_free: boolean
  orden: number
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: { id: string; role?: UserRole; created_at?: string }
        Update: { id?: string; role?: UserRole; created_at?: string }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
      temas: {
        Row: Tema
        Insert: {
          id?: number
          slug: string
          parte: 'general' | 'especifica'
          numero: number
          titulo: string
          published?: boolean
          preview_for_free?: boolean
          orden: number
        }
        Update: {
          id?: number
          slug?: string
          parte?: 'general' | 'especifica'
          numero?: number
          titulo?: string
          published?: boolean
          preview_for_free?: boolean
          orden?: number
        }
        Relationships: {
          foreignKeyName: string
          columns: string[]
          isOneToOne?: boolean
          referencedRelation: string
          referencedColumns: string[]
        }[]
      }
    }
    Views: Record<string, {
      Row: Record<string, unknown>
      Relationships: {
        foreignKeyName: string
        columns: string[]
        isOneToOne?: boolean
        referencedRelation: string
        referencedColumns: string[]
      }[]
    }>
    Functions: Record<string, {
      Args: Record<string, unknown>
      Returns: unknown
    }>
    Enums: Record<string, string[]>
    CompositeTypes: Record<string, Record<string, unknown>>
  }
}
