export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      documents: {
        Row: {
          analysis: Json
          chat: Json
          created_at: string
          discipline: string | null
          id: string
          kind: string
          source_text: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json
          chat?: Json
          created_at?: string
          discipline?: string | null
          id?: string
          kind?: string
          source_text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          analysis?: Json
          chat?: Json
          created_at?: string
          discipline?: string | null
          id?: string
          kind?: string
          source_text?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          answer_index: number
          attempts: number
          created_at: string
          document_id: string | null
          explanation: string | null
          id: string
          mastered: boolean
          options: Json
          question: string
          source_title: string | null
          user_id: string
          user_index: number | null
        }
        Insert: {
          answer_index: number
          attempts?: number
          created_at?: string
          document_id?: string | null
          explanation?: string | null
          id?: string
          mastered?: boolean
          options?: Json
          question: string
          source_title?: string | null
          user_id?: string
          user_index?: number | null
        }
        Update: {
          answer_index?: number
          attempts?: number
          created_at?: string
          document_id?: string | null
          explanation?: string | null
          id?: string
          mastered?: boolean
          options?: Json
          question?: string
          source_title?: string | null
          user_id?: string
          user_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mistakes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          degree: string | null
          display_name: string | null
          id: string
          major: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          display_name?: string | null
          id: string
          major?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          display_name?: string | null
          id?: string
          major?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_cards: {
        Row: {
          back: string
          created_at: string
          document_id: string | null
          due_at: string
          ease: number
          front: string
          id: string
          interval_days: number
          repetitions: number
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          document_id?: string | null
          due_at?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          repetitions?: number
          user_id?: string
        }
        Update: {
          back?: string
          created_at?: string
          document_id?: string | null
          due_at?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          repetitions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_cards_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          done: Json
          exam_date: string | null
          goal: string
          hours_per_day: number | null
          id: string
          plan: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: Json
          exam_date?: string | null
          goal: string
          hours_per_day?: number | null
          id?: string
          plan?: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          done?: Json
          exam_date?: string | null
          goal?: string
          hours_per_day?: number | null
          id?: string
          plan?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
