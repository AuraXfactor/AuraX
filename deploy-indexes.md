# Firestore Index Deployment Instructions

## Required Indexes for Fam System

The fam loading and request functionality requires composite indexes for both `famMembers` and `famRequests` collections. The indexes have been added to `firestore.indexes.json` but need to be deployed.

### Index Details:

**famMembers Collection:**
- Fields: `userId` (Ascending), `status` (Ascending), `joinedAt` (Descending)

**famRequests Collection:**
- Index 1: `toUserId` (Ascending), `createdAt` (Descending)
- Index 2: `fromUserId` (Ascending), `createdAt` (Descending)

### Deployment Steps:

1. **Login to Firebase CLI:**
   ```bash
   firebase login
   ```

2. **Set the project:**
   ```bash
   firebase use --add
   # Select: aura-app-prod-4dc34
   ```

3. **Deploy the indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Alternative: Manual Index Creation

If CLI deployment fails, create the index manually in the Firebase Console:

1. Go to: https://console.firebase.google.com/v1/r/project/aura-app-prod-4dc34/firestore/indexes
2. Click "Create Index"
3. Set Collection ID: `famMembers`
4. Add fields:
   - Field: `userId`, Order: `Ascending`
   - Field: `status`, Order: `Ascending`
   - Field: `joinedAt`, Order: `Descending`
5. Click "Create"

### Verification

After deployment, the fam loading should work without the index error. The system includes fallback logic that will work even without the index, but performance will be better with the proper index in place.