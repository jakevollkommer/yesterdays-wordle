#!/usr/bin/env node
/**
 * Yesterday's Wordle - Discord Webhook Bot
 * 
 * Fetches yesterday's Wordle answer from NYT and posts it to Discord.
 * Designed to run daily at 12am PST so you can finally talk shit.
 */

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  console.error('Error: DISCORD_WEBHOOK_URL environment variable is required');
  process.exit(1);
}

/**
 * Get yesterday's date in YYYY-MM-DD format (Eastern Time, since NYT uses ET)
 */
function getYesterdayDate() {
  const now = new Date();
  // NYT uses Eastern Time for Wordle dates
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  eastern.setDate(eastern.getDate() - 1);
  return eastern.toISOString().split('T')[0];
}

/**
 * Format date for display (e.g., "January 26, 2026")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Fetch Wordle data from NYT API
 */
async function fetchWordle(date) {
  const url = `https://www.nytimes.com/svc/wordle/v2/${date}.json`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`NYT API returned ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch an example sentence using the word from the free Dictionary API.
 * Returns a sentence string, or null if none is available.
 */
async function fetchExampleSentence(word) {
  try {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const entries = await response.json();

    // Walk the nested structure looking for the first definition with an example.
    for (const entry of entries) {
      for (const meaning of entry.meanings || []) {
        for (const def of meaning.definitions || []) {
          if (def.example) {
            return def.example;
          }
        }
      }
    }

    return null;
  } catch {
    // Dictionary API is best-effort; never block the Discord post.
    return null;
  }
}

/**
 * Generate a natural example sentence with the Claude API.
 * Returns a sentence string, or null if no API key is set or the call fails.
 */
async function generateExampleSentence(word) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Write one natural, everyday example sentence (under 20 words) that uses the word "${word}" in its most common, ordinary meaning. Reply with ONLY the sentence — no quotes, no preamble, no explanation.`,
        }],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data.content?.find((b) => b.type === 'text')?.text?.trim();
    return text || null;
  } catch {
    // Best-effort; never block the Discord post.
    return null;
  }
}

/**
 * Get an example sentence for the word, preferring a Claude-generated one and
 * falling back to the free Dictionary API. Returns null if neither is available.
 */
async function getExampleSentence(word) {
  return (await generateExampleSentence(word)) || (await fetchExampleSentence(word));
}

/**
 * Bold every occurrence of the word (and inflected forms, e.g. plurals)
 * within a sentence, case-insensitively.
 */
function boldWord(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\w*`, 'gi');
  return sentence.replace(re, (match) => `**${match}**`);
}

/**
 * Send message to Discord webhook
 */
async function sendToDiscord(wordleData) {
  const { solution, print_date, days_since_launch, id } = wordleData;

  const exampleSentence = await getExampleSentence(solution);
  
  const roasts = [
    "The spoiler-free zone is officially over. Let the roasting begin.",
    "Time to expose who actually needed all 6 guesses.",
    "If you didn't get this one, we need to talk.",
    "The statute of limitations on spoilers has expired.",
    "Now accepting apologies from anyone who almost spoiled this.",
    "Congrats to everyone who got it. Condolences to those who didn't.",
    "The word is out. Literally.",
  ];
  
  const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
  
  const message = {
    embeds: [{
      title: `Yesterday's Wordle was: **${solution.toUpperCase()}**`,
      description: randomRoast,
      color: 0x538D4E, // Wordle green
      fields: [
        {
          name: "Puzzle",
          value: `#${id || days_since_launch}`,
          inline: true
        },
        {
          name: "Date",
          value: formatDate(print_date),
          inline: true
        },
        ...(exampleSentence ? [{
          name: "Used in a sentence",
          value: `_"${boldWord(exampleSentence, solution)}"_`,
          inline: false
        }] : [])
      ],
      footer: {
        text: "Shit-talking may now commence"
      },
      timestamp: new Date().toISOString()
    }]
  };

  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} - ${text}`);
  }
  
  return response;
}

/**
 * Main execution
 */
async function main() {
  try {
    const yesterday = getYesterdayDate();
    console.log(`Fetching Wordle for: ${yesterday}`);
    
    const wordleData = await fetchWordle(yesterday);
    console.log(`Got answer: ${wordleData.solution}`);
    
    await sendToDiscord(wordleData);
    console.log('Successfully posted to Discord!');
    
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

main();
