# 👤 **GUEST USER PERMISSIONS & CAPABILITIES**

## ✅ **WHAT GUEST USERS CAN DO:**

### 📅 **Events:**
- ✅ **View Events** - Can see all published events they have access to
- ✅ **RSVP to Events** - Accept or decline event invitations
- ✅ **Join Events** - Become attendees through invite links
- ✅ **View Event Details** - See event information, location, dates
- ❌ **Cannot Create Events** - No event creation access
- ❌ **Cannot Edit Events** - No event management capabilities
- ❌ **Cannot Delete Events** - No deletion permissions

### 📋 **Tasks:**
- ✅ **View Tasks** - Can see tasks assigned to them
- ✅ **Update Assigned Tasks** - Mark their own tasks as complete/in-progress
- ✅ **View Task Details** - See task descriptions, due dates, priorities
- ❌ **Cannot Create Tasks** - No task creation access
- ❌ **Cannot Assign Tasks** - Cannot assign tasks to others
- ❌ **Cannot Delete Tasks** - No deletion permissions
- ❌ **Cannot Edit Other Tasks** - Can only update tasks assigned to them

### 📊 **Polls:**
- ✅ **View Polls** - Can see all polls for events they attend
- ✅ **Vote on Polls** - Participate in voting
- ✅ **View Poll Results** - See voting results
- ❌ **Cannot Create Polls** - No poll creation access
- ❌ **Cannot Edit Polls** - No poll management capabilities
- ❌ **Cannot Delete Polls** - No deletion permissions

### 💬 **Chat:**
- ✅ **Read Messages** - Can view chat messages for events they attend
- ✅ **Send Messages** - Can participate in event chats
- ✅ **View Chat History** - Access to previous messages
- ❌ **Cannot Moderate Chat** - No moderation capabilities
- ❌ **Cannot Delete Messages** - Cannot delete others' messages

### 👤 **Profile:**
- ✅ **View Profile** - Can see their own profile
- ✅ **Update Profile** - Can edit their personal information
- ✅ **Change Avatar** - Can upload profile pictures
- ❌ **Cannot View Other Profiles** - Limited profile access

## ❌ **WHAT GUEST USERS CANNOT DO:**

### 🚫 **Administrative Functions:**
- ❌ **Admin Panel Access** - No access to admin dashboard
- ❌ **User Management** - Cannot manage other users
- ❌ **Platform Analytics** - No access to system analytics
- ❌ **System Settings** - Cannot modify platform settings

### 🚫 **Management Functions:**
- ❌ **Event Management** - Cannot create, edit, or delete events
- ❌ **Task Management** - Cannot create or assign tasks
- ❌ **Poll Management** - Cannot create or manage polls
- ❌ **Invite Management** - Cannot send invites to others

### 🚫 **Advanced Features:**
- ❌ **Event Templates** - Cannot create or use templates
- ❌ **Bulk Operations** - No bulk actions available
- ❌ **Export Functions** - Cannot export data
- ❌ **Integration Settings** - No access to integrations

## 🎯 **GUEST USER WORKFLOW:**

### **1. Receiving Invitation:**
```
📧 Email Invite → 🔗 Click Link → 📄 Event Details → ✅ RSVP
```

### **2. Joining Event:**
```
✅ Accept RSVP → 👤 Become Attendee → 🎉 Access Event Features
```

### **3. Event Participation:**
```
📋 View Assigned Tasks → 💬 Chat with Others → 📊 Vote on Polls
```

### **4. Task Management:**
```
📋 See My Tasks → ✏️ Update Status → ✅ Mark Complete
```

## 🔒 **PERMISSION ENFORCEMENT:**

### **Backend API Restrictions:**
```typescript
// Only these endpoints are accessible to GUEST users:
GET    /events                    # View events
POST   /events/:id/rsvp           # RSVP to events
GET    /tasks                     # View assigned tasks only
PATCH  /tasks/:id                 # Update assigned tasks only
GET    /polls                     # View polls
POST   /polls/:id/vote            # Vote on polls
GET    /chat/:eventId/messages    # Read chat
POST   /chat/:eventId/messages    # Send messages
GET    /auth/profile              # View profile
PATCH  /auth/profile              # Update profile
```

### **Frontend UI Restrictions:**
- ❌ **No Create Buttons** - Create event/task/poll buttons hidden
- ❌ **No Edit/Delete Actions** - Management buttons not shown
- ❌ **No Admin Menu** - Admin panel not accessible
- ❌ **Read-Only Views** - Most content is view-only

## 🎉 **GUEST USER EXPERIENCE:**

### **Dashboard View:**
- 📅 **My Events** - Events they're attending
- 📋 **My Tasks** - Tasks assigned to them
- 📊 **Recent Polls** - Polls they can vote on
- 💬 **Recent Messages** - Latest chat activity

### **Event View:**
- 📄 **Event Details** - Full event information
- 👥 **Attendee List** - See other attendees
- 📋 **Event Tasks** - Tasks related to the event
- 📊 **Event Polls** - Polls for the event
- 💬 **Event Chat** - Chat with other attendees

### **Task View:**
- 📋 **My Tasks Only** - Filtered to assigned tasks
- ✏️ **Status Updates** - Can change task status
- 📝 **Add Comments** - Can comment on tasks
- 📅 **Due Dates** - See task deadlines

## 🔧 **TECHNICAL IMPLEMENTATION:**

### **Role-Based Access Control:**
```typescript
// Backend Permission Check
@Roles('GUEST')
@UseGuards(JwtAuthGuard, RolesGuard)
async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
  // Only allow if task is assigned to the user
  return this.tasksService.updateAssignedTask(id, userId, dto);
}
```

### **Frontend Permission Gates:**
```typescript
// Component-Level Restrictions
<PermissionGate resource="tasks" action="create">
  <CreateTaskButton />  {/* Hidden for GUEST users */}
</PermissionGate>

<PermissionGate resource="tasks" action="update" resourceData={task}>
  <EditTaskButton />    {/* Only shown for assigned tasks */}
</PermissionGate>
```

## 📧 **EMAIL INVITE SYSTEM - NOW WORKING!**

### **Fixed Issues:**
- ✅ **Real API Integration** - Invite links now use real backend data
- ✅ **RSVP Functionality** - Actual database updates when accepting/declining
- ✅ **Event Loading** - Shows real event details from invite code
- ✅ **User Authentication** - Proper login flow for RSVP

### **Invite Flow:**
1. **Organizer Sends Invite** → Email with invite link
2. **Guest Clicks Link** → `/invite/[code]` page loads real event
3. **Guest Reviews Event** → Sees actual event details
4. **Guest RSVPs** → Real database update, becomes attendee
5. **Guest Accesses Event** → Can participate with guest permissions

**The invite system is now fully functional with real data! 🎊**
