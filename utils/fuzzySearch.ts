/**
 * Calculates the Levenshtein distance between two strings.
 * This is the number of edits (insertions, deletions, substitutions)
 * needed to change one word into the other.
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance.
 */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if a query string is a fuzzy match for a given text.
 * It splits both query and text into words and checks if every word
 * in the query has a close match in the text.
 * @param query The search query.
 * @param text The text to search within.
 * @returns True if it's a fuzzy match, false otherwise.
 */
export function isFuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  // A quick check for an exact substring match for performance
  if (lowerText.includes(lowerQuery)) {
    return true;
  }

  const queryWords = lowerQuery.split(' ').filter(w => w.length > 0);
  const textWords = lowerText.split(' ').filter(w => w.length > 0);

  // Check if every word in the query finds a fuzzy match in the text
  return queryWords.every(queryWord => {
    return textWords.some(textWord => {
      const distance = levenshtein(queryWord, textWord);
      
      // Define a threshold for typos based on the word length
      let threshold = 0;
      if (queryWord.length >= 3 && queryWord.length <= 5) {
        threshold = 1; // Allow 1 mistake for medium words
      } else if (queryWord.length > 5) {
        threshold = 2; // Allow 2 mistakes for longer words
      }

      return distance <= threshold;
    });
  });
}