This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Firestore: Seed required collections and sample data

This project expects several Firestore collections beyond `users`. Use the Admin SDK seeding script to initialize missing data locally or in your project.

Prerequisites:
- Service account credentials with Firestore access. Save as `serviceAccount.json` or set `GOOGLE_APPLICATION_CREDENTIALS` to its path.

Commands:
```bash
# Using npm script (project pre-filled from src/lib/firebase.ts)
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed:firestore

# Or directly with ts-node and explicit flags
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npx ts-node scripts/seed-firestore.ts \
  --project aura-app-prod-4dc34 \
  --uid <your-user-uid>
```

What it seeds (idempotent upserts):
- Top-level: `auraPosts` (with `reactions`, `replies`), `groupChats` (with `messages`), `weeklyQuests`, `rewards`, `auraSquads`.
- Per user (`users/{uid}`): `friends`, `friendRequests`, `chats/{chatId}/messages`, `chatMeta`, `chats/{chatId}/typing`, `journalEntries`, `journalCollections`, `questProgress`, `auraStats/main`, `pointTransactions`, `purchases`.

If `--uid` is omitted, it seeds the first existing user or falls back to `sampleUserA`.

## SoulChat & Aura Coach (Demo Steps)

1. Sign up or log in.
2. Navigate to SoulChat from the header.
3. Open a conversation by navigating to `/soulchat/{otherUid}` where `{otherUid}` is another test account UID.
4. Send a text, a mood sticker (picker next to input), or use voice input.
5. Tap Aura to request a compassionate reply suggestion. If `AURA_COACH_URL` is unset, a local fallback is returned.
6. If using Cloud Function, set env `AURA_COACH_URL` to your deployed function URL. The server reads `x-auth-uid` for logging.
7. Save excerpt to Journal using the footer button; verify `/users/{uid}/journalEntries` in Firestore.
8. SOS menu in header offers escalation actions.

### Firestore Structure
- `/users/{uid}/chats/{chatId}/messages/{messageId}`
- `/users/{uid}/chatMeta/{chatId}`
- `/users/{uid}/aiChatLogs/{logId}` (server)
- `/users/{uid}/journalEntries/{entryId}`
- `/analytics/chatStats/{day}` (server)

### Cloud Functions
- Implemented minimal `functions/index.ts` with `auraCoach` placeholder. Replace with provider SDK + moderation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
