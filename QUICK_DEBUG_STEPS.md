# Quick Debug Steps for "Missing or insufficient permissions"

## Step 1: Apply Emergency Rules (IMMEDIATE TEST)

Copy this to your Firebase Console -> Firestore -> Rules and click "Publish":

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write, create, update, delete: if true;
    }
  }
}
```

⚠️ **WARNING: These rules are EXTREMELY insecure - only for testing!**

## Step 2: Test Message Sending

1. Try sending a message where you got the error
2. If it works now → Issue is in your security rules
3. If it still fails → Issue is in code/authentication

## Step 3: Check Browser Console

Open Developer Tools (F12) → Console tab and look for these messages:

**Group Messages:**
- `📤 Sending group message...` 
- Tries to access: `groupChats/{groupId}/messages`

**Social Chat Messages:**
- `📤 Sending social chat message...`
- Tries to access: `chats/{chatId}/messages`

**Soul Chat Messages:**
- `📤 Sending soul chat message...`
- Tries to access: `users/{userId}/chats/{chatId}/messages`

## Step 4: Find the Exact Error

In console, look for:
- Which log message appears before the error?
- Any Firestore error messages with collection paths?

## Step 5: Use Debug Page

Go to: `http://localhost:3000/debug-permissions`
- Click "Test All Permissions" 
- See which operations fail

## Common Issues:

1. **Authentication not working** - User object is null/undefined
2. **Wrong collection path** - Code using different path than rules expect
3. **Missing required fields** - Data structure doesn't match what rules expect
4. **Rules not deployed** - Firebase Console rules not saved properly

## Report Back:

Tell me:
1. Do the emergency rules fix the issue? (Yes/No)
2. Which console log appears before the error? (Group/Social/Soul chat)
3. What does the debug page show?