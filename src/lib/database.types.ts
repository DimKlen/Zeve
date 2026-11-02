export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      chat_messages: {
        Row: {
          actions: Json | null;
          content: string | null;
          created_at: string;
          id: string;
          photo_path: string | null;
          plant_id: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actions?: Json | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          photo_path?: string | null;
          plant_id: string;
          role: string;
          user_id: string;
        };
        Update: {
          actions?: Json | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          photo_path?: string | null;
          plant_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plant_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chat_messages_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plants';
            referencedColumns: ['id'];
          },
        ];
      };
      garden_weather: {
        Row: {
          day: string;
          et0_mm: number | null;
          fetched_at: string;
          garden_id: string;
          humidity_mean: number | null;
          precipitation_mm: number | null;
          sunshine_hours: number | null;
          temp_mean: number | null;
        };
        ComputedFields: never;
        Insert: {
          day: string;
          et0_mm?: number | null;
          fetched_at?: string;
          garden_id: string;
          humidity_mean?: number | null;
          precipitation_mm?: number | null;
          sunshine_hours?: number | null;
          temp_mean?: number | null;
        };
        Update: {
          day?: string;
          et0_mm?: number | null;
          fetched_at?: string;
          garden_id?: string;
          humidity_mean?: number | null;
          precipitation_mm?: number | null;
          sunshine_hours?: number | null;
          temp_mean?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'garden_weather_garden_id_fkey';
            columns: ['garden_id'];
            isOneToOne: false;
            referencedRelation: 'gardens';
            referencedColumns: ['id'];
          },
        ];
      };
      gardens: {
        Row: {
          city: string | null;
          country: string | null;
          country_code: string | null;
          created_at: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          user_id: string;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          country_code?: string | null;
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      plants: {
        Row: {
          archived_at: string | null;
          care_tip: string | null;
          created_at: string;
          garden_id: string | null;
          id: string;
          learned_every_days: number | null;
          light: Database['public']['Enums']['light_exposure'];
          nickname: string;
          photo_path: string | null;
          room_id: string | null;
          species_id: string;
          species_source: string | null;
          suggestion_declined_count: number | null;
          suggestion_declined_days: number | null;
          user_id: string;
          water_every_days: number;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          care_tip?: string | null;
          created_at?: string;
          garden_id?: string | null;
          id?: string;
          learned_every_days?: number | null;
          light?: Database['public']['Enums']['light_exposure'];
          nickname: string;
          photo_path?: string | null;
          room_id?: string | null;
          species_id: string;
          species_source?: string | null;
          suggestion_declined_count?: number | null;
          suggestion_declined_days?: number | null;
          user_id: string;
          water_every_days: number;
        };
        Update: {
          archived_at?: string | null;
          care_tip?: string | null;
          created_at?: string;
          garden_id?: string | null;
          id?: string;
          learned_every_days?: number | null;
          light?: Database['public']['Enums']['light_exposure'];
          nickname?: string;
          photo_path?: string | null;
          room_id?: string | null;
          species_id?: string;
          species_source?: string | null;
          suggestion_declined_count?: number | null;
          suggestion_declined_days?: number | null;
          user_id?: string;
          water_every_days?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'plants_garden_id_fkey';
            columns: ['garden_id'];
            isOneToOne: false;
            referencedRelation: 'gardens';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plants_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plants_species_id_fkey';
            columns: ['species_id'];
            isOneToOne: false;
            referencedRelation: 'species';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          auth_provider: string | null;
          created_at: string;
          display_email: string | null;
          expo_push_token: string | null;
          first_name: string | null;
          id: string;
          onboarded_at: string | null;
          reminder_time: string;
          reminders_enabled: boolean;
          timezone: string;
        };
        ComputedFields: never;
        Insert: {
          auth_provider?: string | null;
          created_at?: string;
          display_email?: string | null;
          expo_push_token?: string | null;
          first_name?: string | null;
          id: string;
          onboarded_at?: string | null;
          reminder_time?: string;
          reminders_enabled?: boolean;
          timezone?: string;
        };
        Update: {
          auth_provider?: string | null;
          created_at?: string;
          display_email?: string | null;
          expo_push_token?: string | null;
          first_name?: string | null;
          id?: string;
          onboarded_at?: string | null;
          reminder_time?: string;
          reminders_enabled?: boolean;
          timezone?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          due_at: string;
          id: string;
          message: string;
          plant_id: string;
          sent_at: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          due_at: string;
          id?: string;
          message: string;
          plant_id: string;
          sent_at?: string | null;
          user_id: string;
        };
        Update: {
          due_at?: string;
          id?: string;
          message?: string;
          plant_id?: string;
          sent_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reminders_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plant_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reminders_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plants';
            referencedColumns: ['id'];
          },
        ];
      };
      rooms: {
        Row: {
          garden_id: string;
          id: string;
          name: string;
          outdoor: boolean;
          position: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          garden_id: string;
          id?: string;
          name: string;
          outdoor?: boolean;
          position?: number;
          user_id: string;
        };
        Update: {
          garden_id?: string;
          id?: string;
          name?: string;
          outdoor?: boolean;
          position?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'rooms_garden_id_fkey';
            columns: ['garden_id'];
            isOneToOne: false;
            referencedRelation: 'gardens';
            referencedColumns: ['id'];
          },
        ];
      };
      species: {
        Row: {
          air: string;
          category: string;
          color_a: string;
          color_b: string;
          color_f: string;
          form: string;
          id: string;
          latin: string;
          light: string;
          light_label: string;
          name: string;
          tip: string;
          water_every_days: number;
        };
        ComputedFields: never;
        Insert: {
          air: string;
          category: string;
          color_a: string;
          color_b: string;
          color_f: string;
          form: string;
          id: string;
          latin: string;
          light: string;
          light_label: string;
          name: string;
          tip: string;
          water_every_days: number;
        };
        Update: {
          air?: string;
          category?: string;
          color_a?: string;
          color_b?: string;
          color_f?: string;
          form?: string;
          id?: string;
          latin?: string;
          light?: string;
          light_label?: string;
          name?: string;
          tip?: string;
          water_every_days?: number;
        };
        Relationships: [];
      };
      watering_events: {
        Row: {
          expected_days: number | null;
          id: string;
          plant_id: string;
          user_id: string;
          watered_at: string;
        };
        ComputedFields: never;
        Insert: {
          expected_days?: number | null;
          id?: string;
          plant_id: string;
          user_id: string;
          watered_at?: string;
        };
        Update: {
          expected_days?: number | null;
          id?: string;
          plant_id?: string;
          user_id?: string;
          watered_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'watering_events_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plant_overview';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'watering_events_plant_id_fkey';
            columns: ['plant_id'];
            isOneToOne: false;
            referencedRelation: 'plants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      plant_overview: {
        Row: {
          air: string;
          archived_at: string | null;
          care_tip: string | null;
          created_at: string;
          days_since_created: number | null;
          days_since_water: number | null;
          form: string;
          garden_city: string | null;
          garden_country: string | null;
          garden_country_code: string | null;
          garden_id: string | null;
          garden_latitude: number | null;
          garden_name: string | null;
          id: string;
          is_thirsty: boolean | null;
          last_watered_at: string | null;
          latin: string;
          learned_every_days: number | null;
          light: Database['public']['Enums']['light_exposure'];
          light_label: string;
          nickname: string;
          photo_path: string | null;
          previous_watered_at: string | null;
          room_id: string | null;
          room_name: string | null;
          room_outdoor: boolean | null;
          species_id: string;
          species_light: string;
          species_name: string;
          species_source: string | null;
          suggestion_declined_count: number | null;
          suggestion_declined_days: number | null;
          tip: string | null;
          user_id: string;
          water_every_days: number;
          watering_history: Json | null;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: 'plants_garden_id_fkey';
            columns: ['garden_id'];
            isOneToOne: false;
            referencedRelation: 'gardens';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plants_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'rooms';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plants_species_id_fkey';
            columns: ['species_id'];
            isOneToOne: false;
            referencedRelation: 'species';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      create_garden_with_plant: {
        Args: {
          p_city?: string;
          p_country?: string;
          p_country_code?: string;
          p_latitude?: number;
          p_light: Database['public']['Enums']['light_exposure'];
          p_longitude?: number;
          p_name: string;
          p_nickname: string;
          p_room_name?: string;
          p_species_id: string;
          p_species_source: string;
          p_water_every_days: number;
        };
        Returns: {
          garden_id: string;
          plant_id: string;
        }[];
      };
    };
    Enums: {
      light_exposure: 'ombre' | 'indirect' | 'soleil';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      light_exposure: ['ombre', 'indirect', 'soleil'],
    },
  },
} as const;
