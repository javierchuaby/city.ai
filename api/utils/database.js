/**
 * api/utils/database.js
 * Centralized Database Service Layer for Supabase.
 * Decouples business logic from the Supabase-js client.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Initializes the Supabase client using provided configuration.
 * @param {Object} config - { url, serviceRoleKey }
 */
export function createDatabaseClient(config) {
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase configuration missing: url or serviceRoleKey.");
  }
  return createClient(config.url, config.serviceRoleKey);
}

/**
 * Searches for relevant intel chunks using vector similarity.
 * @param {Object} supabase - The Supabase client instance.
 * @param {number[]} embedding - The query embedding vector.
 * @param {number} matchThreshold - Minimum similarity threshold.
 * @param {number} matchCount - Maximum number of matches to return.
 * @returns {Promise<any[]>} - Array of matched intel chunks.
 */
export async function matchIntel(supabase, embedding, matchThreshold = 0.5, matchCount = 18) {
  const { data, error } = await supabase.rpc('match_intel', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: matchCount
  });

  if (error) {
    throw new Error(`Supabase RPC error: ${error.message}`);
  }

  return data || [];
}

/**
 * Interface-level mapping to ensure internal data structures 
 * are consistent regardless of DB schema.
 */
export function mapIntelToSnippet(item) {
  return {
    id: item.id,
    content: item.content,
    url: item.metadata?.url || "https://reddit.com"
  };
}
