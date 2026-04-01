/**
 * api/repositories/intelRepository.js
 * Data Access Layer (DAL) for "Intel" chunks in Supabase.
 * Decouples business logic from internal vector DB operations.
 */

export class IntelRepository {
  /**
   * @param {Object} supabaseClient - Injected Supabase client.
   */
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Performs vector similarity matching using the 'match_intel' Postgres RPC.
   * @param {number[]} embedding - Query vector.
   * @param {number} threshold - Similarity threshold.
   * @param {number} matchCount - Max matches to return.
   */
  async findSimilarIntel(embedding, threshold = 0.5, matchCount = 18) {
    const { data, error } = await this.supabase.rpc('match_intel', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: matchCount
    });

    if (error) {
      throw new Error(`Intel matching failed: ${error.message}`);
    }

    return (data || []).map(this.mapToDomainSnippet);
  }

  /**
   * Internal mapper to ensure data consistency.
   * Transforms raw Supabase table rows to a standard internal Intel snippet.
   */
  mapToDomainSnippet(item) {
    return {
      id: item.id,
      content: item.content,
      // Metadata extraction
      url: item.metadata?.url || "https://reddit.com",
      created: item.metadata?.created || "N/A",
      source: item.metadata?.source || "Unknown"
    };
  }
}
