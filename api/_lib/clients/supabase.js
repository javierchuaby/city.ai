/**
 * api/clients/supabase.js
 * Centralized Supabase JavaScript Client.
 * Manages the singleton instance of the database SDK.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

const { url, serviceRoleKey } = config.supabase;

/**
 * Singleton Supabase Client Instance (Service Role for admin/backend ops)
 */
export const supabase = createClient(url, serviceRoleKey);
