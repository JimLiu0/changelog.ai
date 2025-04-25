This tool is designed for simplicity and demo purposes, prioritizing ease of use over scalability for now.

Assumptions/Forced requirements
This project prioritizes simplicity and local usage for developers.

1. Public GitHub repositories only (avoids OAuth or token management).
2. Changelogs are generated between two commits within the same branch.
3. Users must provide their own OpenAI API key (for changelog generation).
4. No user authentication or account management (local-only usage).
5. Diff size threshold for inline display (~5000 characters); larger diffs provided as downloadable patch files.
6. GitHub API unauthenticated rate limits apply (60 requests/hour).

Dev userflow:
1. Sets up dev env
2. Puts their openai api key into .env
3. Starts dev
4. Puts in github repo link
5. Selects start and end commit
6. Generates initial changelog message
7. Modifies changelog or metadata associated
8. Preview changelog
9. Publish changelog
10. Continue creating change log entries. Resume from the last published changelog’s end commit.

Enduser user flow:
1. Clicks on a link to see the changelog for a product.
2. Scrolls through changelog entries with summaries and key highlights visible.
3. Expands entries for full details or diffs as needed.
4. Copies or references changelog entries for their own use (e.g., upgrade notes, patch tracking).



