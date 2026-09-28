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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          responded_at: string | null
          response_status: string
          seller_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          responded_at?: string | null
          response_status?: string
          seller_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          responded_at?: string | null
          response_status?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_number: string | null
          booking_status: string
          booking_type: string
          commission_amount: number
          commission_rate: number
          created_at: string
          customer_id: string
          customer_notes: string | null
          driver_id: string | null
          drop_location: string | null
          estimated_fare: number
          final_fare: number
          id: string
          is_demo: boolean
          passengers: number
          payment_status: string
          pickup_date: string
          pickup_location: string
          pickup_time: string
          seller_amount: number
          seller_id: string | null
          seller_notes: string | null
          trip_distance: number
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          booking_number?: string | null
          booking_status?: string
          booking_type?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          driver_id?: string | null
          drop_location?: string | null
          estimated_fare?: number
          final_fare?: number
          id?: string
          is_demo?: boolean
          passengers?: number
          payment_status?: string
          pickup_date: string
          pickup_location: string
          pickup_time: string
          seller_amount?: number
          seller_id?: string | null
          seller_notes?: string | null
          trip_distance?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          booking_number?: string | null
          booking_status?: string
          booking_type?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          driver_id?: string | null
          drop_location?: string | null
          estimated_fare?: number
          final_fare?: number
          id?: string
          is_demo?: boolean
          passengers?: number
          payment_status?: string
          pickup_date?: string
          pickup_location?: string
          pickup_time?: string
          seller_amount?: number
          seller_id?: string | null
          seller_notes?: string | null
          trip_distance?: number
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          seller_id: string | null
          settled_at: string | null
          settlement_status: string
        }
        Insert: {
          booking_amount?: number
          booking_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          seller_id?: string | null
          settled_at?: string | null
          settlement_status?: string
        }
        Update: {
          booking_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          seller_id?: string | null
          settled_at?: string | null
          settlement_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          license_number: string | null
          name: string
          phone: string
          seller_id: string
          status: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          license_number?: string | null
          name: string
          phone: string
          seller_id: string
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          license_number?: string | null
          name?: string
          phone?: string
          seller_id?: string
          status?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          is_demo: boolean
          paid_at: string | null
          payment_method: string
          payment_status: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_demo?: boolean
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          is_demo: boolean
          rating: number
          review_text: string | null
          seller_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_demo?: boolean
          rating?: number
          review_text?: string | null
          seller_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_demo?: boolean
          rating?: number
          review_text?: string | null
          seller_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          address: string | null
          business_name: string
          city: string
          commission_rate: number
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          owner_name: string
          phone: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          owner_name?: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string
          commission_rate?: number
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          owner_name?: string
          phone?: string | null
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          name: string
          phone: string | null
          profile_image: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_demo?: boolean
          name?: string
          phone?: string | null
          profile_image?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          name?: string
          phone?: string | null
          profile_image?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          date: string
          id: string
          status: string
          vehicle_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          date: string
          id?: string
          status?: string
          vehicle_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          date?: string
          id?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          air_conditioned: boolean
          airport_price: number
          brand: string
          city: string
          created_at: string
          description: string | null
          fuel_type: string
          id: string
          images: string[]
          is_demo: boolean
          local_price: number
          model: string
          outstation_price_per_km: number
          rating: number
          registration_number: string
          rental_price_per_day: number
          seats: number
          seller_id: string
          status: string
          transmission: string
          updated_at: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          air_conditioned?: boolean
          airport_price?: number
          brand: string
          city?: string
          created_at?: string
          description?: string | null
          fuel_type?: string
          id?: string
          images?: string[]
          is_demo?: boolean
          local_price?: number
          model: string
          outstation_price_per_km?: number
          rating?: number
          registration_number: string
          rental_price_per_day?: number
          seats?: number
          seller_id: string
          status?: string
          transmission?: string
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Update: {
          air_conditioned?: boolean
          airport_price?: number
          brand?: string
          city?: string
          created_at?: string
          description?: string | null
          fuel_type?: string
          id?: string
          images?: string[]
          is_demo?: boolean
          local_price?: number
          model?: string
          outstation_price_per_km?: number
          rating?: number
          registration_number?: string
          rental_price_per_day?: number
          seats?: number
          seller_id?: string
          status?: string
          transmission?: string
          updated_at?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_profile: {
        Args: {
          _business_name?: string
          _city?: string
          _name: string
          _phone: string
          _role: string
        }
        Returns: undefined
      }
      get_seller_profile_private: {
        Args: { _seller_id: string }
        Returns: {
          address: string | null
          business_name: string
          city: string
          commission_rate: number
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          owner_name: string
          phone: string | null
          rating: number
          status: string
          updated_at: string
          user_id: string
          verification_status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "seller_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      my_seller_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "customer" | "seller" | "admin"
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
    Enums: {
      app_role: ["customer", "seller", "admin"],
    },
  },
} as const
