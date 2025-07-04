export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      candidate_application_history: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          notes: string | null
          status: Database['public']['Enums']['candidate_application_status']
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status: Database['public']['Enums']['candidate_application_status']
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database['public']['Enums']['candidate_application_status']
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_application_history_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'candidate_applications'
            referencedColumns: ['id']
          }
        ]
      }
      candidate_applications: {
        Row: {
          application_date: string
          application_url: string | null
          candidate_id: string
          company_logo_url: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          created_at: string | null
          id: string
          job_id: string | null
          job_title: string
          next_step_date: string | null
          next_step_description: string | null
          salary_range: string | null
          source: Database['public']['Enums']['candidate_application_source']
          status: Database['public']['Enums']['candidate_application_status']
          updated_at: string | null
        }
        Insert: {
          application_date: string
          application_url?: string | null
          candidate_id: string
          company_logo_url?: string | null
          company_name: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          job_title: string
          next_step_date?: string | null
          next_step_description?: string | null
          salary_range?: string | null
          source?: Database['public']['Enums']['candidate_application_source']
          status: Database['public']['Enums']['candidate_application_status']
          updated_at?: string | null
        }
        Update: {
          application_date?: string
          application_url?: string | null
          candidate_id?: string
          company_logo_url?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string | null
          id?: string
          job_id?: string | null
          job_title?: string
          next_step_date?: string | null
          next_step_description?: string | null
          salary_range?: string | null
          source?: Database['public']['Enums']['candidate_application_source']
          status?: Database['public']['Enums']['candidate_application_status']
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_applications_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'candidate_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      candidate_education: {
        Row: {
          achievements: string[] | null
          candidate_id: string
          created_at: string | null
          degree_name: string
          description: Json | null
          end_date: string | null
          field_of_study: string | null
          id: string
          institution_name: string
          is_current: boolean
          location: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          achievements?: string[] | null
          candidate_id: string
          created_at?: string | null
          degree_name: string
          description?: Json | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name: string
          is_current?: boolean
          location?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          achievements?: string[] | null
          candidate_id?: string
          created_at?: string | null
          degree_name?: string
          description?: Json | null
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean
          location?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_education_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'candidate_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      candidate_files: {
        Row: {
          candidate_id: string
          created_at: string | null
          file_name: string
          file_type: Database['public']['Enums']['candidate_file_type']
          id: string
          is_default_resume: boolean | null
          mime_type: string | null
          parsed_resume_data: Json | null
          previous_version_id: string | null
          size_bytes: number | null
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          version_number: number | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          file_name: string
          file_type: Database['public']['Enums']['candidate_file_type']
          id?: string
          is_default_resume?: boolean | null
          mime_type?: string | null
          parsed_resume_data?: Json | null
          previous_version_id?: string | null
          size_bytes?: number | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          version_number?: number | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          file_name?: string
          file_type?: Database['public']['Enums']['candidate_file_type']
          id?: string
          is_default_resume?: boolean | null
          mime_type?: string | null
          parsed_resume_data?: Json | null
          previous_version_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_files_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'candidate_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'candidate_files_previous_version_id_fkey'
            columns: ['previous_version_id']
            isOneToOne: false
            referencedRelation: 'candidate_files'
            referencedColumns: ['id']
          }
        ]
      }
      candidate_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          first_name: string | null
          github_url: string | null
          id: string
          is_onboarded: boolean
          job_title: string | null
          joined_date: string | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          personal_website_url: string | null
          phone_number: string | null
          portfolio_screenshot_path: string | null
          portfolio_url: string | null
          twitter_url: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          github_url?: string | null
          id: string
          is_onboarded?: boolean
          job_title?: string | null
          joined_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          personal_website_url?: string | null
          phone_number?: string | null
          portfolio_screenshot_path?: string | null
          portfolio_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          is_onboarded?: boolean
          job_title?: string | null
          joined_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          personal_website_url?: string | null
          phone_number?: string | null
          portfolio_screenshot_path?: string | null
          portfolio_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidate_skills: {
        Row: {
          candidate_id: string
          category_name: string
          created_at: string | null
          id: string
          proficiency_level: number | null
          skill_name: string
        }
        Insert: {
          candidate_id: string
          category_name: string
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          skill_name: string
        }
        Update: {
          candidate_id?: string
          category_name?: string
          created_at?: string | null
          id?: string
          proficiency_level?: number | null
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_skills_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'candidate_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      candidate_work_experiences: {
        Row: {
          candidate_id: string
          company_name: string
          created_at: string | null
          description: Json | null
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string
          location: string | null
          skills_tags: string[] | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          company_name: string
          created_at?: string | null
          description?: Json | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title: string
          location?: string | null
          skills_tags?: string[] | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          company_name?: string
          created_at?: string | null
          description?: Json | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string
          location?: string | null
          skills_tags?: string[] | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_work_experiences_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'candidate_profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_uploaded_resume: {
        Args: {
          p_auth_user_id: string
          p_file_name: string
          p_file_type: Database['public']['Enums']['candidate_file_type']
          p_mime_type: string
          p_storage_path: string
          p_size_bytes: number
          p_parsed_resume_data: Json
        }
        Returns: undefined
      }
      set_default_resume_and_add_new_with_parsed_data: {
        Args: {
          p_candidate_id: string
          p_file_name: string
          p_file_type: Database['public']['Enums']['candidate_file_type']
          p_mime_type: string
          p_storage_path: string
          p_size_bytes: number
          p_parsed_resume_data: Json
        }
        Returns: undefined
      }
      set_default_resume_for_candidate: {
        Args: { p_candidate_id: string; p_file_id: string }
        Returns: undefined
      }
    }
    Enums: {
      candidate_application_source: 'platform' | 'import' | 'manual'
      candidate_application_status: 'applied' | 'in-review' | 'interview' | 'rejected' | 'offer'
      candidate_file_type:
        | 'resume'
        | 'cover_letter'
        | 'portfolio'
        | 'certification'
        | 'transcript'
        | 'reference'
        | 'eligibility'
        | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      candidate_application_source: ['platform', 'import', 'manual'],
      candidate_application_status: ['applied', 'in-review', 'interview', 'rejected', 'offer'],
      candidate_file_type: [
        'resume',
        'cover_letter',
        'portfolio',
        'certification',
        'transcript',
        'reference',
        'eligibility',
        'other',
      ],
    },
  },
} as const
