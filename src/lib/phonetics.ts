/**
 * Fetch phonetic transcription for a word from the Free Dictionary API.
 */

const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en";

export async function fetchPhonetic(word: string): Promise<string | null> {
  try {
    const response = await fetch(`${DICTIONARY_API}/${encodeURIComponent(word)}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Find the first non-empty phonetic text
    const entry = data[0];
    if (entry.phonetic) return entry.phonetic;

    if (Array.isArray(entry.phonetics)) {
      for (const p of entry.phonetics) {
        if (p.text) return p.text;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Batch fetch phonetics with rate limiting (100ms delay between requests).
 */
export async function fetchPhoneticsForWords(
  words: Array<{ id: string; word: string }>
): Promise<Array<{ id: string; phonetic: string | null }>> {
  const results: Array<{ id: string; phonetic: string | null }> = [];

  for (const { id, word } of words) {
    // Extract just the first word for compound terms
    const lookupWord = word.split(" ")[0].toLowerCase();
    const phonetic = await fetchPhonetic(lookupWord);
    results.push({ id, phonetic });

    // Rate limiting: 100ms delay
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
