# Case Manager - Visual Workflows Guide

## 🎯 Common User Journeys

This guide shows step-by-step workflows for typical case management scenarios.

---

## Workflow 1: First Contact (New Lead)

```
📥 New lead arrives in CRM
    ↓
👤 Sales agent opens Case Manager
    ↓
🤖 System automatically creates:
    • CALL_NOW action (due in 15 min)
    • In-app notification reminder
    ↓
📞 Agent clicks "Call Client" button
    ↓
💬 After call, agent adds feedback
    ↓
🤖 AI generates coaching recommendations
    ↓
📅 Agent schedules meeting (if interested)
    ↓
⏰ System creates T-24h and T-2h reminders
```

**UI Actions**:
1. Click **"Manage"** button on lead card
2. See CALL_NOW action in right panel
3. Click **"Call Client"** in Quick Actions
4. After call, enter feedback in Feedback Editor
5. Click **"Submit Feedback"** 
6. View AI recommendations
7. Click **"Schedule Meeting"** 
8. Pick date/time, submit

---

## Workflow 2: Qualifying a Potential Lead

```
📊 Lead shows interest
    ↓
🔄 Change stage to "Potential"
    ↓
📝 Stage Change Modal requires feedback
    ↓
💬 Enter conversation details:
    • Client needs
    • Budget discussed
    • Objections
    • Timeline
    ↓
🤖 AI Coach analyzes and provides:
    • 3-5 specific recommendations
    • Follow-up script
    • Risk flags
    ↓
✨ Click "Create Action" on recommendations
    ↓
📅 Schedule meeting with client
    ↓
⏰ Two reminders auto-created:
    • 24 hours before
    • 2 hours before
    ↓
🔔 Notifications appear at due times
```

**UI Actions**:
1. Click **"Potential"** in stage timeline
2. Modal opens requesting feedback
3. Fill feedback text area (be detailed!)
4. Optional: Set meeting date/time
5. Click **"Change to Potential"**
6. Wait 3-5 seconds for AI response
7. View recommendations in purple panel
8. Click **"Create Action"** on any recommendation

**AI Coaching Tips**:
- More detail = better recommendations
- Mention specific objections
- Include budget numbers
- Note timeline urgency
- Describe client personality

---

## Workflow 3: Handling Low Budget Clients

```
💰 Client's budget is below expectations
    ↓
🔄 Change stage to "Low Budget"
    ↓
📊 Stage Change Modal requests:
    • Total budget, OR
    • Down payment + Monthly installment
    ↓
🔍 System searches inventory:
    • Filters by max price
    • Considers payment plans
    • Matches area/bedrooms if provided
    ↓
📋 Results displayed:
    • Top 10 matched units
    • Recommendation text
    • Affordability analysis
    ↓
🎯 Three outcomes:
    1. Good matches → Present options
    2. Limited options → Set expectations
    3. No matches → Adjust budget or archive
```

**UI Actions**:
1. Click **"Low Budget"** in stage timeline
2. Fill budget form:
   - **Option A**: Enter total budget (e.g., 3,000,000 EGP)
   - **Option B**: Enter down payment (e.g., 500,000) + monthly (e.g., 40,000)
3. Click **"Change to Low Budget"**
4. Wait for inventory search
5. View results in **"Inventory Matches"** card
6. Contact client with options

**Inventory Matching Logic**:
```
If total budget provided:
  → Search: price_in_egp <= totalBudget

If only DP + monthly:
  → Estimate: maxPrice = downPayment + (monthly × 60)
  → Search: price_in_egp <= maxPrice

Results sorted by price (low to high)
Limited to top 10 units
```

---

## Workflow 4: Reassigning to Different Agent (Face Change)

```
🚫 Agent cannot convert lead
    ↓
💭 Consider reassignment
    ↓
👤 Click "Change Face" button
    ↓
📋 Modal shows available agents
    ↓
✅ Select new agent
    ↓
📝 Add reason (optional but recommended)
    ↓
🔄 System:
    • Records face change in database
    • Updates lead assignment
    • Notifies new agent
    • Notifies previous agent
    ↓
📊 Logged in activity timeline
```

**UI Actions**:
1. Click **"👤 Change Face"** button (top right)
2. Select new agent from dropdown
3. Enter reason: "Client needs Arabic speaker" or "Expertise mismatch"
4. Click **"Reassign Lead"**
5. Verification: See face change in Activity Log

**When to Change Face**:
- ✅ Language barrier
- ✅ Expertise mismatch (luxury vs. affordable)
- ✅ Personality clash
- ✅ Geographic specialization needed
- ✅ Workload balancing
- ✅ Second opinion for non-potential verification

---

## Workflow 5: Closing the Deal

```
🎉 Client agrees to purchase
    ↓
🔄 Change stage to "Closed Deal"
    ↓
🤖 System automatically:
    • Creates immediate ASK_FOR_REFERRALS action
    • Schedules 30-day follow-up referral request
    • Sends congratulations notification
    ↓
🤝 Agent asks for referrals
    ↓
📝 Records referrals in system
    ↓
⏰ 30 days later:
    • Reminder notification sent
    • Follow-up for more referrals
```

**UI Actions**:
1. Click **"Closed Deal"** in stage timeline
2. Confirm stage change
3. See congratulations notification
4. See ASK_FOR_REFERRALS action appear
5. Contact client for referrals
6. Mark action as complete when done

**Referral Best Practices**:
- Ask within 24 hours of closing
- Provide referral incentive details
- Make it easy (share link, send message template)
- Follow up after 30 days for more

---

## Workflow 6: Managing Daily Actions

```
🌅 Morning:
    ↓
🔔 Check notification bell
    ↓
📋 View pending actions:
    • Overdue (red)
    • Due today (blue)
    • Upcoming
    ↓
🎯 Prioritize by:
    • Overdue first
    • Stage importance (Hot Case > Call Back)
    • Client value (budget)
    ↓
✅ Complete actions:
    • Click ✓ button
    • Or ✗ to skip
    ↓
📊 Review Activity Log for context
```

**UI Navigation**:
1. Click notification bell icon (top right)
2. See all pending notifications
3. Click notification to go to case
4. In Case Manager, scroll to **"Actions & Reminders"**
5. Complete actions with green ✓ button
6. Skip non-relevant actions with ✗ button

**Action Prioritization**:
```
Priority 1: Overdue actions (red background)
Priority 2: Meeting reminders (within 24h)
Priority 3: CALL_NOW actions
Priority 4: PUSH_MEETING actions
Priority 5: Other actions
```

---

## Workflow 7: Using AI Coaching Effectively

```
📝 Add detailed feedback after client interaction
    ↓
🤖 AI Coach analyzes:
    • Current stage
    • Feedback content
    • Lead history
    • Inventory context
    • Egyptian market patterns
    ↓
💡 Receives recommendations:
    • Specific next actions
    • Timing suggestions
    • Risk warnings
    ↓
🎬 Ready-to-use follow-up script
    ↓
🚀 One-click action creation
```

**Writing Good Feedback** (For Better AI):

❌ **Bad Example**:
```
"Interested"
```

✅ **Good Example**:
```
"Client Ahmed is very interested in 3BR apartment in New Cairo. 
Budget: 5M EGP total, can do 20% down (1M) and 50K/month installments.
Works in banking, married with 2 kids (ages 5 and 8).
Needs modern finishing, ground floor preferred for kids.
Timeline: Wants to move by summer 2025.
Objection: Concerned about community fees and maintenance costs.
Next: Sending brochures tonight, following up Thursday morning."
```

**AI will provide much better recommendations** with:
- Specific numbers (budget, down payment, monthly)
- Family situation and needs
- Preferences (location, finishing, floor)
- Timeline and urgency
- Objections and concerns
- Next steps already planned

---

## Workflow 8: Meeting Preparation

```
📅 Meeting scheduled for tomorrow
    ↓
🔔 Receive 24-hour reminder notification
    ↓
📋 Review Activity Log:
    • Read previous feedback
    • Check AI recommendations
    • Note client preferences
    ↓
🏠 Check Inventory Matches (if Low Budget)
    ↓
📱 Use Follow-up Script from AI Coach
    ↓
✅ Complete REMIND_MEETING action
    ↓
🔔 Receive 2-hour reminder
    ↓
📞 Final preparation
    ↓
🤝 Meeting!
```

**Preparation Checklist**:
- [ ] Read all feedback history
- [ ] Review AI coach script
- [ ] Check inventory matches
- [ ] Prepare property brochures
- [ ] Note client's objections
- [ ] Have financing calculator ready
- [ ] Know community amenities
- [ ] Bring business cards

---

## Workflow 9: Non-Potential Verification

```
🚫 Client not interested/qualified
    ↓
🔄 Change stage to "Non Potential"
    ↓
📝 Required: Detailed feedback explaining why
    ↓
🤖 System suggests: CHANGE_FACE action
    ↓
💭 Manager reviews:
    • Was qualification fair?
    • Could different agent convert?
    • Is budget truly insufficient?
    ↓
✅ If valid non-potential: Archive
❌ If questionable: Change face for second opinion
```

**UI Actions**:
1. Click **"Non Potential"** in stage timeline
2. Enter detailed feedback explaining why (required)
3. Submit stage change
4. System creates CHANGE_FACE action
5. Manager decides: Archive or reassign

**Non-Potential Criteria**:
- Budget truly insufficient (< 1M EGP)
- Wrong property type (commercial vs. residential)
- Wrong location (client in different city)
- Competitor already purchased
- Scam/fake lead

---

## Workflow 10: Automated Reminder System

```
⏰ Cron job runs every 5 minutes
    ↓
🔍 Finds actions where:
    • status = 'PENDING'
    • due_at <= now()
    • notified_at = null
    ↓
🔔 For each action:
    • Send in-app notification
    • Mark as notified
    ↓
👤 User sees notification in bell
    ↓
🖱️ Clicks notification
    ↓
🎯 Redirects to Case Manager
    ↓
✅ Completes action
```

**Notification Flow**:
```
Action created with due_at
    ↓
Stored in database (status: PENDING)
    ↓
Cron runs every 5 minutes
    ↓
If due_at <= now() and notified_at = null:
    • Create notification
    • Set notified_at = now()
    ↓
User sees in bell dropdown
    ↓
Click → Navigate → Complete
```

**Cooldown Logic**:
- Notification sent once per action
- No spam - single notification per reminder
- Re-notify only if manually requested

---

## 📊 Activity Log Timeline

The Activity Log shows chronological history:

```
Nov 6, 2024 2:30 PM - Face Changed
  ↳ Reassigned to Sarah Ahmed
  ↳ Reason: Client needs Arabic speaker

Nov 6, 2024 2:15 PM - Feedback Added • Potential
  ↳ "Client very interested. Discussed..."
  ↳ AI coaching provided

Nov 6, 2024 2:00 PM - Action Completed
  ↳ CALL_NOW

Nov 6, 2024 1:45 PM - Stage changed to New Lead
```

**Timeline includes**:
- 💬 Feedback entries (with AI indicator)
- ✅ Completed actions
- 👥 Face changes
- 🔄 Stage changes (future enhancement)

---

## 🎨 UI Element Guide

### Stage Timeline (Left Panel)

**Visual States**:
- ✅ **Green with checkmark** = Completed stage
- 🔵 **Blue filled** = Current stage  
- ⚪ **Gray outline** = Future stage

**Interaction**:
- Click any stage to open change modal
- Current stage highlighted
- Quick stats below timeline

### AI Coach Panel (Center)

**Elements**:
- 🌟 **Purple gradient background**
- 💡 **Recommendation cards** (white boxes)
- 🎬 **Follow-up script** (collapsible)
- ⚠️ **Risk flags** (amber badges)
- ➡️ **"Create Action" buttons**

### Actions List (Right Panel)

**Action Card Colors**:
- 🔴 **Red** = Overdue
- 🔵 **Blue** = Pending
- ⚪ **Gray** = Recently completed

**Action Icons**:
- 📞 CALL_NOW
- 📅 PUSH_MEETING
- ⏰ REMIND_MEETING
- 👤 CHANGE_FACE
- 🤝 ASK_FOR_REFERRALS

### Notification Bell

**Badge Colors**:
- 🔴 **Red circle** = Unread notifications
- 🔢 **Number** = Unread count

**Dropdown Items**:
- 🔵 **Blue background** = Unread
- ⚪ **White** = Read
- 🔵 **Blue dot** = New notification

---

## 💡 Pro Tips

### Tip 1: Batch Process Actions

Visit Case Manager once per day for each active lead:
1. Review all pending actions
2. Complete in priority order
3. Add cumulative feedback
4. Get AI guidance for next week

### Tip 2: Use AI Follow-up Scripts

Don't reinvent the wheel:
1. Submit feedback after each interaction
2. Copy AI-generated script
3. Personalize slightly
4. Send via WhatsApp
5. Save tons of time!

### Tip 3: Face Change Strategy

**When to switch**:
- After 3 no-answers → Try different time/agent
- Language barrier detected → Assign Arabic/English speaker
- Luxury client → Assign senior agent
- High volume → Balance team workload

### Tip 4: Inventory Matching Power

For every Low Budget lead:
1. Always collect full budget info
2. Get down payment AND monthly capacity
3. Let system find matches
4. Present top 3 units to client
5. Set realistic expectations early

### Tip 5: Leverage Meeting Reminders

When scheduling meetings:
- Always use built-in scheduler
- Gets automatic 24h and 2h reminders
- Shows in notification bell
- Includes case link for quick access

---

## 🎓 Training Checklist

### Week 1: Basics
- [ ] Navigate to Case Manager
- [ ] Change lead stages
- [ ] Add feedback
- [ ] View AI recommendations
- [ ] Complete actions
- [ ] Use notification bell

### Week 2: Advanced
- [ ] Schedule meetings with reminders
- [ ] Change face for leads
- [ ] Use inventory matching
- [ ] Interpret AI coaching
- [ ] Manage multiple cases daily

### Week 3: Mastery
- [ ] Optimize feedback for better AI
- [ ] Strategic face changes
- [ ] Batch action processing
- [ ] Activity log analysis
- [ ] Team coordination

---

## 📈 Success Metrics

Track these KPIs:

**Individual Agent**:
- Action completion rate (target: >90%)
- Average time to first call (target: <30 min)
- Meeting show-up rate (target: >70%)
- Face change success rate (target: >50% conversion after switch)

**Team Level**:
- Total actions completed per day
- AI coaching usage rate
- Average stage progression time
- Deal closure rate by stage

**System Health**:
- Notification delivery rate (target: 100%)
- AI response time (target: <5 sec)
- Reminder accuracy (target: 100%)
- Inventory match relevance (target: >80%)

---

## 🐛 Common Issues & Solutions

### Issue: "AI recommendations are generic"

**Solution**: Provide more detailed feedback
- Include specific numbers
- Mention objections
- Note client preferences
- Describe conversation flow

### Issue: "Too many notifications"

**Solution**: 
- Complete actions promptly
- Use skip button for non-relevant
- Actions only notify once
- Adjust reminder timing in code if needed

### Issue: "Inventory matches not relevant"

**Solution**:
- Verify budget is realistic
- Check area/bedroom filters
- Review client requirements
- May need manual search

### Issue: "Lost track of case history"

**Solution**:
- Check Activity Log (center panel)
- Review all feedback chronologically
- See face changes and why
- View completed actions

---

## 🔗 Integration with Existing CRM

The Case Manager **enhances** the existing CRM, doesn't replace it:

**CRM View** (Table/Cards):
- Quick overview of all leads
- Bulk filtering and search
- Export to CSV
- Statistics dashboard

**Case Manager View** (Individual Lead):
- Deep dive into single case
- Stage management
- AI coaching
- Action tracking
- Team collaboration

**Use CRM for**: Browsing, filtering, bulk operations
**Use Case Manager for**: Individual case work, stage management, coaching

---

## 🚀 Advanced Features

### Custom Actions

Create manual actions anytime:
1. In Actions List, click "+"
2. Select action type
3. Set due date
4. Add notes in payload

### Bulk Face Changes

For managers reassigning multiple leads:
1. Note leads needing reassignment
2. Change face for each
3. Activity log tracks all changes
4. Both agents notified each time

### Inventory Match Refinement

Adjust search to be more specific:
1. Include area preference
2. Set minimum bedrooms
3. System narrows results
4. Present most relevant options

---

**Happy Case Managing!** 🎯

For detailed technical documentation, see `docs/case-manager.md`.

