# Yesterday's Wordle

A zero-shot vibe-coded Discord webhook bot that posts yesterday's Wordle answer daily at 12:00 AM PST, so you and your friends can finally talk shit about it without spoiling anyone.

## How It Works

1. **GitHub Actions** runs a scheduled job every day at 12:00 AM PST (8:00 AM UTC)
2. The script fetches yesterday's Wordle answer from the [NYT Wordle API](https://www.nytimes.com/svc/wordle/v2/)
3. Posts an embed message to your Discord channel via webhook

## Setup

### 1. Create a Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** > **Integrations** > **Webhooks**
3. Click **New Webhook**
4. Name it something like "Yesterday's Wordle"
5. Select your `#wordle` or `#yesterdays-wordle` channel
6. Click **Copy Webhook URL**

### 2. Add the Webhook URL to GitHub Secrets

1. Go to your GitHub repo: `https://github.com/jakevollkommer/yesterdays-wordle`
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `DISCORD_WEBHOOK_URL`
5. Value: Paste your Discord webhook URL
6. Click **Add secret**

### 3. (Optional) Add an Anthropic API Key for Better Example Sentences

The bot includes the word used in a sentence. By default it pulls examples from
the free Dictionary API, which are often weak or use uncommon meanings. If you
add an Anthropic API key, the bot instead generates a natural, everyday sentence
with Claude (and falls back to the dictionary if the key is missing or the call
fails).

1. Get an API key from the [Anthropic Console](https://console.anthropic.com/)
2. In your GitHub repo, go to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Paste your API key
6. Click **Add secret**

### 4. Enable GitHub Actions

The workflow is already set up in `.github/workflows/daily-wordle.yml`. It will automatically run every day at 12:00 AM PST.

### 5. Test It (Optional)

To test immediately without waiting for the schedule:

1. Go to **Actions** tab in your repo
2. Click on **Post Yesterday's Wordle**
3. Click **Run workflow** > **Run workflow**

## What Gets Posted

The bot posts a nice embed that looks like:

> **Yesterday's Wordle was: FREAK**
>
> The spoiler-free zone is officially over. Let the roasting begin.
>
> **Puzzle:** #1682 | **Date:** January 26, 2026
>
> *Shit-talking may now commence*

## Local Testing

```bash
# Set your webhook URL
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Optional: enable Claude-generated example sentences
export ANTHROPIC_API_KEY="sk-ant-..."

# Run the script
node send-wordle.js
```

## Customization

Edit `send-wordle.js` to customize:
- The random roast messages
- The embed color (currently Wordle green: `0x538D4E`)
- The message format

## Credits

- NYT for the Wordle API (undocumented but public)
- Your crew for needing a safe space to roast each other's Wordle skills
