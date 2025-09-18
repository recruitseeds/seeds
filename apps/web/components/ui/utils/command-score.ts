




const SCORE_CONTINUE_MATCH = 1,
  
  
  
  
  
  SCORE_SPACE_WORD_JUMP = 0.9,
  SCORE_NON_SPACE_WORD_JUMP = 0.8,
  
  SCORE_CHARACTER_JUMP = 0.17,
  
  
  
  SCORE_TRANSPOSITION = 0.1,
  
  
  
  
  
  
  
  PENALTY_SKIPPED = 0.999,
  
  
  
  
  
  
  
  PENALTY_CASE_MISMATCH = 0.9999,
  
  
  
  
  
  
  
  
  
  PENALTY_NOT_COMPLETE = 0.99

const IS_GAP_REGEXP = /[\\/_+.#"@[({&]/,
  COUNT_GAPS_REGEXP = /[\\/_+.#"@[({&]/g,
  IS_SPACE_REGEXP = /[\s-]/,
  COUNT_SPACE_REGEXP = /[\s-]/g

function commandScoreInner(
  value: string,
  abbreviation: string,
  lowerString: string,
  lowerAbbreviation: string,
  stringIndex: number,
  abbreviationIndex: number,
  memoizedResults: { [key: string]: number }
) {
  if (abbreviationIndex === abbreviation.length) {
    if (stringIndex === value.length) {
      return SCORE_CONTINUE_MATCH
    }
    return PENALTY_NOT_COMPLETE
  }

  const memoizeKey = `${stringIndex},${abbreviationIndex}`

  if (memoizedResults[memoizeKey] !== undefined) {
    return memoizedResults[memoizeKey]
  }

  const abbreviationChar = lowerAbbreviation.charAt(abbreviationIndex)
  let index = lowerString.indexOf(abbreviationChar, stringIndex)
  let highScore = 0

  let score, transposedScore, wordBreaks, spaceBreaks

  while (index >= 0) {
    score = commandScoreInner(
      value,
      abbreviation,
      lowerString,
      lowerAbbreviation,
      index + 1,
      abbreviationIndex + 1,
      memoizedResults
    )
    if (score > highScore) {
      if (index === stringIndex) {
        score *= SCORE_CONTINUE_MATCH
      } else if (IS_GAP_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_NON_SPACE_WORD_JUMP
        wordBreaks = value
          .slice(stringIndex, index - 1)
          .match(COUNT_GAPS_REGEXP)
        if (wordBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, wordBreaks.length)
        }
      } else if (IS_SPACE_REGEXP.test(value.charAt(index - 1))) {
        score *= SCORE_SPACE_WORD_JUMP
        spaceBreaks = value
          .slice(stringIndex, index - 1)
          .match(COUNT_SPACE_REGEXP)
        if (spaceBreaks && stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, spaceBreaks.length)
        }
      } else {
        score *= SCORE_CHARACTER_JUMP
        if (stringIndex > 0) {
          score *= Math.pow(PENALTY_SKIPPED, index - stringIndex)
        }
      }

      if (value.charAt(index) !== abbreviation.charAt(abbreviationIndex)) {
        score *= PENALTY_CASE_MISMATCH
      }
    }

    if (
      (score < SCORE_TRANSPOSITION &&
        lowerString.charAt(index - 1) ===
          lowerAbbreviation.charAt(abbreviationIndex + 1)) ||
      (lowerAbbreviation.charAt(abbreviationIndex + 1) ===
        lowerAbbreviation.charAt(abbreviationIndex) && 
        lowerString.charAt(index - 1) !==
          lowerAbbreviation.charAt(abbreviationIndex))
    ) {
      transposedScore = commandScoreInner(
        value,
        abbreviation,
        lowerString,
        lowerAbbreviation,
        index + 1,
        abbreviationIndex + 2,
        memoizedResults
      )

      if (transposedScore * SCORE_TRANSPOSITION > score) {
        score = transposedScore * SCORE_TRANSPOSITION
      }
    }

    if (score > highScore) {
      highScore = score
    }

    index = lowerString.indexOf(abbreviationChar, index + 1)
  }

  memoizedResults[memoizeKey] = highScore
  return highScore
}

function formatInput(value: string) {
  
  return value.toLowerCase().replace(COUNT_SPACE_REGEXP, ' ')
}

export function commandScore(
  value: string,
  abbreviation: string,
  aliases?: string[]
): number {
  /* NOTE:
   * in the original, we used to do the lower-casing on each recursive call, but this meant that toLowerCase()
   * was the dominating cost in the algorithm, passing both is a little ugly, but considerably faster.
   */
  value =
    aliases && aliases.length > 0 ? `${value + ' ' + aliases.join(' ')}` : value
  return commandScoreInner(
    value,
    abbreviation,
    formatInput(value),
    formatInput(abbreviation),
    0,
    0,
    {}
  )
}
