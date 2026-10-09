# AI Message Responder

Desktop app that drafts replies to Gmail and Slack messages without any account access. Select an area of the message on screen, and a local AnythingLLM vision model drafts a reply in British English.

## Setup
1. In AnythingLLM, create a workspace with a vision-capable model and generate a developer API key (Settings > Developer API).
2. `npm install`, then `npm run dev`.
3. Open Settings in the app, enter the address, API key and workspace slug, then Test connection.
4. Press Ctrl+Shift+R, drag over a message, and copy the draft.

Screenshots stay in memory and are only sent to your local AnythingLLM.
