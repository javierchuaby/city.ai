/**
 * api/clients/supabase.js
 * Centralized Supabase JavaScript Client.
 * Manages the singleton instance of the database SDK.
 */

import { createClient } from "@supabase/supabase-js";
/**
 * Factory function to create a new Supabase client.
 * @param {object} config - Validated configuration object from getConfig()
 */
export const getSupabaseClient = (config) => {
  const { url, serviceRoleKey } = config.supabase;
  return createClient(url, serviceRoleKey);
};
