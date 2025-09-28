# 🧪 AuraX Social System Testing Guide

## 📋 Test Account Credentials

For testing the social features, you can create these test accounts or use existing ones:

### Test Account 1: Alice (Mental Health Advocate)
- **Email**: alice.wellness@test.com
- **Password**: testpass123
- **Name**: Alice Johnson
- **Username**: alice_wellness
- **Bio**: Mental health advocate and mindfulness enthusiast
- **Interests**: meditation, yoga, journaling, nature, reading

### Test Account 2: Bob (Recovery Coach)
- **Email**: bob.recovery@test.com  
- **Password**: testpass123
- **Name**: Bob Martinez
- **Username**: bob_recovery
- **Bio**: Recovery coach and fitness enthusiast
- **Interests**: fitness, nutrition, recovery, community, hiking

## 🎯 Testing Checklist

### ✅ User Profile Setup
1. **Sign up** with test accounts
2. **Update profile** with interests and bio
3. **Set profile to public** (enable `isPublic`)
4. **Upload profile picture** (optional)

### ✅ Friend System Testing
1. **Search for users** (navigate to `/friends` → Discover tab)
   - Search by name, username, or interests
   - Verify user cards display properly with avatars and info
   
2. **Send friend requests**
   - Send request from Alice to Bob
   - Add a custom message
   - Verify request appears in Bob's Requests tab
   
3. **Accept friend requests**  
   - Login as Bob
   - Navigate to Friends → Requests tab
   - Accept Alice's friend request
   - Verify friendship is established
   
4. **Verify friends list**
   - Check Friends tab shows the new friendship
   - Verify online status indicators
   - Test search and sorting options

### ✅ Social Feed Testing  
1. **Create posts** (Friends → Social Feed tab)
   - Text posts with mood tags
   - Achievement posts
   - Posts with different visibility (Friends/Public)
   
2. **Interact with posts**
   - Like posts from friends
   - Verify like counts update
   - Test post visibility rules
   
3. **Feed functionality**
   - Verify friends' posts appear in feed
   - Test "Load More" pagination
   - Check timestamp formatting

### ✅ Groups & Communities
1. **Navigate to Groups page** (`/groups`)
2. **Create a new group**
   - Name: "Wellness Warriors"
   - Description: "Support community for wellness journey"
   - Set as Public
   - Add tags: wellness, support, mindfulness
   
3. **Browse and join groups**
   - Search for existing groups
   - Join public groups
   - Test group member management

### ✅ Messaging (Chat Interface)
1. **Start 1-on-1 chat**
   - From Friends list, click "Message" button
   - Send text messages
   - Verify real-time updates
   
2. **Group messaging** (if group chat created)
   - Navigate to group page
   - Send group messages
   - Test message formatting and timestamps

## 🔍 Key Features to Verify

### 👥 Friend Discovery & Management
- [x] User search by name/username
- [x] Friend suggestions based on interests  
- [x] Send/accept/decline friend requests
- [x] Real-time friend request notifications
- [x] Friends list with online status
- [x] Remove friends functionality

### 📱 Social Feed
- [x] Create posts with mood tags
- [x] Like and interact with posts
- [x] Friends-only vs public visibility
- [x] Real-time feed updates
- [x] Post timestamps and formatting

### 🏘️ Groups & Communities  
- [x] Create public/private groups
- [x] Browse and search groups
- [x] Join/leave group functionality
- [x] Group member management
- [x] Group tags and descriptions

### 💬 Real-time Messaging
- [x] 1-on-1 chat interface
- [x] Message timestamps
- [x] Online status indicators
- [x] Real-time message updates

## 🚀 Quick Start Testing

1. **Run the development server**:
   ```bash
   npm run dev
   ```

2. **Open two browser windows/tabs** (or use incognito for second account)

3. **Sign up both test accounts** and complete profiles

4. **Test friend request flow**:
   - Account 1: Send friend request to Account 2
   - Account 2: Accept the friend request
   - Both: Verify friendship established

5. **Test social features**:
   - Both accounts: Create posts with different moods/tags
   - Both: Like each other's posts
   - Test social feed shows friends' posts

6. **Test groups**:
   - Account 1: Create a public group
   - Account 2: Join the group
   - Both: Test group interactions

7. **Test messaging**:
   - Start chat between friends
   - Send messages and verify real-time updates

## ✅ Expected Results

After successful testing, you should see:

- ✅ **Two user accounts** with rich profiles
- ✅ **Bidirectional friendship** established  
- ✅ **Social posts** visible in both feeds
- ✅ **Like interactions** working properly
- ✅ **Group membership** and interactions
- ✅ **Real-time messaging** between friends
- ✅ **Online status** indicators working
- ✅ **Search and discovery** features functional

## 🐛 Troubleshooting

If you encounter issues:

1. **Check browser console** for errors
2. **Verify Firebase connection** in Network tab
3. **Ensure Firestore rules** are deployed
4. **Check user authentication** state
5. **Verify profile completion** (isPublic = true)

## 🎯 Success Criteria

✅ **Build passes** without TypeScript errors  
✅ **Two test accounts created** and configured  
✅ **Friend requests sent and accepted**  
✅ **Social feed shows posts** from friends  
✅ **Online status indicators** working  
✅ **Groups can be created and joined**  
✅ **Real-time messaging** functional  

Once all these tests pass, the social system is ready for deployment! 🚀