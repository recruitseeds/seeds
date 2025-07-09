export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)'
  }
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
      application_step_history: {
        Row: {
          application_id: string
          created_at: string | null
          duration_in_previous_step_days: number | null
          id: string
          moved_at: string | null
          moved_by: string
          moved_from_step_id: string | null
          moved_to_step_id: string
          notes: string | null
          step_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          duration_in_previous_step_days?: number | null
          id?: string
          moved_at?: string | null
          moved_by: string
          moved_from_step_id?: string | null
          moved_to_step_id: string
          notes?: string | null
          step_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          duration_in_previous_step_days?: number | null
          id?: string
          moved_at?: string | null
          moved_by?: string
          moved_from_step_id?: string | null
          moved_to_step_id?: string
          notes?: string | null
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'application_step_history_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'job_applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_step_history_moved_by_fkey'
            columns: ['moved_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_step_history_moved_from_step_id_fkey'
            columns: ['moved_from_step_id']
            isOneToOne: false
            referencedRelation: 'pipeline_steps'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_step_history_moved_to_step_id_fkey'
            columns: ['moved_to_step_id']
            isOneToOne: false
            referencedRelation: 'pipeline_steps'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'application_step_history_step_id_fkey'
            columns: ['step_id']
            isOneToOne: false
            referencedRelation: 'pipeline_steps'
            referencedColumns: ['id']
          }
        ]
      }
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
          next_steps: Json | null
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
          next_steps?: Json | null
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
          next_steps?: Json | null
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
      candidate_notes: {
        Row: {
          application_id: string
          author_id: string
          content: Json
          created_at: string | null
          id: string
          note_type: string
          step_id: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          author_id: string
          content?: Json
          created_at?: string | null
          id?: string
          note_type?: string
          step_id?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          author_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          note_type?: string
          step_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'candidate_notes_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'job_applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'candidate_notes_author_id_fkey'
            columns: ['author_id']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'candidate_notes_step_id_fkey'
            columns: ['step_id']
            isOneToOne: false
            referencedRelation: 'pipeline_steps'
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
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversation_participants_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversation_participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          }
        ]
      }
      conversations: {
        Row: {
          conversation_type: string
          created_at: string | null
          created_by: string
          id: string
          name: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_type: string
          created_at?: string | null
          created_by: string
          id?: string
          name?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_type?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conversations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      default_pipeline_steps: {
        Row: {
          automation_config: Json | null
          created_at: string | null
          default_duration_days: number | null
          description: string | null
          id: string
          name: string
          step_type: string
        }
        Insert: {
          automation_config?: Json | null
          created_at?: string | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          name: string
          step_type: string
        }
        Update: {
          automation_config?: Json | null
          created_at?: string | null
          default_duration_days?: number | null
          description?: string | null
          id?: string
          name?: string
          step_type?: string
        }
        Relationships: []
      }
      hiring_pipelines: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'hiring_pipelines_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'pipeline_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hiring_pipelines_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hiring_pipelines_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      job_applications: {
        Row: {
          applied_at: string | null
          candidate_id: string
          created_at: string | null
          current_step_id: string | null
          id: string
          job_posting_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id: string
          created_at?: string | null
          current_step_id?: string | null
          id?: string
          job_posting_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string
          created_at?: string | null
          current_step_id?: string | null
          id?: string
          job_posting_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'job_applications_current_step_id_fkey'
            columns: ['current_step_id']
            isOneToOne: false
            referencedRelation: 'pipeline_steps'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_applications_job_posting_id_fkey'
            columns: ['job_posting_id']
            isOneToOne: false
            referencedRelation: 'job_postings'
            referencedColumns: ['id']
          }
        ]
      }
      job_postings: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string
          department: string | null
          experience_level: string | null
          hiring_manager_id: string | null
          id: string
          job_type: string
          organization_id: string
          pipeline_id: string | null
          published_at: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          created_by: string
          department?: string | null
          experience_level?: string | null
          hiring_manager_id?: string | null
          id?: string
          job_type: string
          organization_id: string
          pipeline_id?: string | null
          published_at?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string
          department?: string | null
          experience_level?: string | null
          hiring_manager_id?: string | null
          id?: string
          job_type?: string
          organization_id?: string
          pipeline_id?: string | null
          published_at?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'job_postings_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_postings_hiring_manager_id_fkey'
            columns: ['hiring_manager_id']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_postings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_postings_pipeline_id_fkey'
            columns: ['pipeline_id']
            isOneToOne: false
            referencedRelation: 'hiring_pipelines'
            referencedColumns: ['id']
          }
        ]
      }
      job_templates: {
        Row: {
          content: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string | null
          parent_template_id: string | null
          status: string
          template_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          parent_template_id?: string | null
          status?: string
          template_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          parent_template_id?: string | null
          status?: string
          template_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'job_templates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_templates_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_templates_parent_template_id_fkey'
            columns: ['parent_template_id']
            isOneToOne: false
            referencedRelation: 'job_templates'
            referencedColumns: ['id']
          }
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_reactions_message_id_fkey'
            columns: ['message_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_reactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          mentions: Json | null
          message_type: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: Json | null
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          mentions?: Json | null
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey'
            columns: ['conversation_id']
            isOneToOne: false
            referencedRelation: 'conversations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey'
            columns: ['reply_to_id']
            isOneToOne: false
            referencedRelation: 'messages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          }
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_invitations_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_invitations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'company_users_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'organization_users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_users_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          message_retention_days: number | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          message_retention_days?: number | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          message_retention_days?: number | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pipeline_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_categories_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      pipeline_steps: {
        Row: {
          automation_config: Json | null
          created_at: string | null
          default_step_id: string | null
          description: string | null
          duration_days: number | null
          id: string
          name: string
          permissions: Json | null
          pipeline_id: string
          step_order: number
          updated_at: string | null
        }
        Insert: {
          automation_config?: Json | null
          created_at?: string | null
          default_step_id?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          name: string
          permissions?: Json | null
          pipeline_id: string
          step_order: number
          updated_at?: string | null
        }
        Update: {
          automation_config?: Json | null
          created_at?: string | null
          default_step_id?: string | null
          description?: string | null
          duration_days?: number | null
          id?: string
          name?: string
          permissions?: Json | null
          pipeline_id?: string
          step_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pipeline_steps_default_step_id_fkey'
            columns: ['default_step_id']
            isOneToOne: false
            referencedRelation: 'default_pipeline_steps'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pipeline_steps_pipeline_id_fkey'
            columns: ['pipeline_id']
            isOneToOne: false
            referencedRelation: 'hiring_pipelines'
            referencedColumns: ['id']
          }
        ]
      }
      template_variables: {
        Row: {
          created_at: string | null
          default_value: string | null
          id: string
          options: Json | null
          template_id: string
          variable_name: string
          variable_type: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          options?: Json | null
          template_id: string
          variable_name: string
          variable_type: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          id?: string
          options?: Json | null
          template_id?: string
          variable_name?: string
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'template_variables_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'job_templates'
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
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
