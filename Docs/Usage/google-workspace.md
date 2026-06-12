# Google Workspace Integration

Jarvis provides full automation for Gmail, Google Drive, and Google Calendar through dedicated CLI tools. This guide covers email, file, and calendar operations.

## Overview

Three CLI tools provide Google Workspace access:
- **gmcli** - Gmail operations
- **gdcli** - Google Drive file management
- **gccli** - Google Calendar events and scheduling

**Important:** Each command requires an account email as the first argument. Check configured accounts with `<tool> accounts list`.

## Gmail Operations (gmcli)

### Searching Email

```bash
gmcli vikram@malkans.net search "is:unread in:inbox"
gmcli vikram@malkans.net search "from:boss@company.com subject:urgent"
gmcli vikram@malkans.net search "filename:pdf after:2024/01/01"
```

**Common search queries:**
- `is:unread` - Unread messages
- `is:starred` - Starred messages
- `in:inbox` - Inbox only
- `from:email@example.com` - From specific sender
- `subject:keyword` - Subject contains keyword
- `has:attachment` - Has attachments
- `filename:pdf` - Attachment type
- `after:2024/01/01` - Date range
- `label:Work` - Specific label

**Combining queries:**
```bash
gmcli vikram@malkans.net search "in:inbox is:unread from:kashyap@malkans.net"
```

### Reading Threads

```bash
# Read full thread
gmcli vikram@malkans.net thread <threadId>

# Download attachments
gmcli vikram@malkans.net thread <threadId> --download
```

Attachments save to `~/.gmcli/attachments/`

### Marking Email as Read

After reading a thread, mark it as read:

```bash
gmcli vikram@malkans.net labels <threadId> --remove UNREAD
```

**Multiple threads:**
```bash
gmcli vikram@malkans.net labels <id1> <id2> <id3> --remove UNREAD
```

**Jarvis always marks emails as read after reading them.** This is a configured preference.

### Managing Labels

```bash
# List all labels
gmcli vikram@malkans.net labels list

# Add label
gmcli vikram@malkans.net labels <threadId> --add Work

# Remove label
gmcli vikram@malkans.net labels <threadId> --remove UNREAD

# Multiple operations
gmcli vikram@malkans.net labels <threadId> --add Important --remove UNREAD
```

**System labels:**
- INBOX
- UNREAD
- STARRED
- IMPORTANT
- TRASH
- SPAM

### Sending Email

```bash
# Basic send
gmcli vikram@malkans.net send \
  --to "recipient@example.com" \
  --subject "Subject line" \
  --body "Message body"

# With CC and BCC
gmcli vikram@malkans.net send \
  --to "person1@example.com,person2@example.com" \
  --cc "cc@example.com" \
  --bcc "bcc@example.com" \
  --subject "Subject" \
  --body "Body"

# With attachment
gmcli vikram@malkans.net send \
  --to "recipient@example.com" \
  --subject "Documents" \
  --body "Attached are the files" \
  --attach /path/to/file.pdf

# Reply to existing thread
gmcli vikram@malkans.net send \
  --to "recipient@example.com" \
  --subject "Re: Original Subject" \
  --body "Reply text" \
  --reply-to <messageId>
```

### Managing Drafts

```bash
# List drafts
gmcli vikram@malkans.net drafts list

# View draft
gmcli vikram@malkans.net drafts get <draftId>

# Create draft
gmcli vikram@malkans.net drafts create \
  --to "recipient@example.com" \
  --subject "Draft subject" \
  --body "Draft body"

# Send draft
gmcli vikram@malkans.net drafts send <draftId>

# Delete draft
gmcli vikram@malkans.net drafts delete <draftId>
```

## Google Calendar (gccli)

### Listing Calendars

```bash
gccli vikram@malkans.net calendars
```

Use `primary` as the calendar ID for your main calendar.

### Viewing Events

```bash
# List events (defaults to next week)
gccli vikram@malkans.net events primary

# Specific date range
gccli vikram@malkans.net events primary \
  --from 2026-06-01T00:00:00Z \
  --to 2026-06-30T23:59:59Z

# Limit results
gccli vikram@malkans.net events primary --max 50

# Search events
gccli vikram@malkans.net events primary --query "team meeting"
```

### Event Details

```bash
gccli vikram@malkans.net event primary <eventId>
```

### Creating Events

**Timed event:**
```bash
gccli vikram@malkans.net create primary \
  --summary "Team Meeting" \
  --start "2026-06-15T10:00:00-05:00" \
  --end "2026-06-15T11:00:00-05:00" \
  --location "Conference Room A" \
  --description "Quarterly planning"
```

**All-day event:**
```bash
gccli vikram@malkans.net create primary \
  --summary "Vacation" \
  --start "2026-07-01" \
  --end "2026-07-05" \
  --all-day
```

**With attendees:**
```bash
gccli vikram@malkans.net create primary \
  --summary "Team Sync" \
  --start "2026-06-15T14:00:00-05:00" \
  --end "2026-06-15T15:00:00-05:00" \
  --attendees "person1@example.com,person2@example.com"
```

**Date/time format:**
- Timed events: `YYYY-MM-DDTHH:MM:SS-05:00` (with timezone offset)
- All-day events: `YYYY-MM-DD` with `--all-day` flag

### Updating Events

```bash
gccli vikram@malkans.net update primary <eventId> \
  --summary "Updated Title" \
  --start "2026-06-15T15:00:00-05:00"
```

All create options work with update (all optional).

### Deleting Events

```bash
gccli vikram@malkans.net delete primary <eventId>
```

### Checking Availability

```bash
gccli vikram@malkans.net freebusy primary \
  --from 2026-06-15T00:00:00Z \
  --to 2026-06-16T00:00:00Z

# Multiple calendars
gccli vikram@malkans.net freebusy primary,work@group.calendar.google.com \
  --from 2026-06-15T00:00:00Z \
  --to 2026-06-16T00:00:00Z
```

### Accepting Calendar Invites

**Current workflow:** Copy event details to vikram@malkans.net calendar.

**Process:**
1. Find invite email with gmcli
2. Extract event details (title, start, end, location, description)
3. Create copy on vikram@malkans.net calendar
4. Confirm creation

**Example:**
```bash
# 1. Search for invite
gmcli vikram@malkans.net search "subject:Invitation"

# 2. Read invite details
gmcli vikram@malkans.net thread <threadId>

# 3. Create copy
gccli vikram@malkans.net create primary \
  --summary "Event Title" \
  --start "2026-06-15T10:00:00-05:00" \
  --end "2026-06-15T11:00:00-05:00" \
  --location "Location" \
  --description "Description"
```

**Note:** This creates a copy on your calendar but does NOT send an RSVP to the organizer.

## Google Drive (gdcli)

### Listing Files

```bash
# List all files
gdcli vikram@malkans.net list

# Search by name
gdcli vikram@malkans.net search "filename"

# Search by MIME type
gdcli vikram@malkans.net search --mime "application/pdf"
```

### Uploading Files

```bash
gdcli vikram@malkans.net upload /path/to/local/file.pdf

# Upload to specific folder
gdcli vikram@malkans.net upload /path/to/file.pdf --parent <folderId>
```

### Downloading Files

```bash
gdcli vikram@malkans.net download <fileId> /path/to/destination/
```

### Sharing Files

```bash
# Share with specific user
gdcli vikram@malkans.net share <fileId> user@example.com

# Make publicly accessible
gdcli vikram@malkans.net share <fileId> --public
```

**Note:** Sharing is a side-effect operation. Jarvis will confirm before sharing.

### Deleting Files

```bash
gdcli vikram@malkans.net delete <fileId>
```

**Note:** Deletion is destructive. Jarvis will confirm before deleting.

## Operating Rules

### Account Management

Each command requires the email as the first argument:

```bash
# Check configured accounts
gmcli accounts list
gdcli accounts list
gccli accounts list
```

Currently configured account: `vikram@malkans.net`

### Side Effects Require Confirmation

Jarvis will confirm before:
- Sending emails
- Creating/updating calendar events
- Accepting calendar invites
- Sharing Drive files
- Deleting Drive files

**Override confirmation by being explicit:**
- "Send this email now"
- "Create the event immediately"
- "Share this file with the team"

### Reading Skill Documentation

For complex operations, Jarvis reads skill documentation:

```bash
Read: /home/zhiroku/.pi/agent/skills/gmcli/SKILL.md
Read: /home/zhiroku/.pi/agent/skills/gdcli/SKILL.md
Read: /home/zhiroku/.pi/agent/skills/gccli/SKILL.md
```

This ensures accurate command syntax for non-trivial operations.

## Common Workflows

### Email Triage

```bash
# Find important unread
gmcli vikram@malkans.net search "is:unread in:inbox -category:promotions"

# Read threads
gmcli vikram@malkans.net thread <threadId>

# Mark as read
gmcli vikram@malkans.net labels <threadId> --remove UNREAD
```

### Calendar Review

```bash
# This week's events
gccli vikram@malkans.net events primary

# Specific date
gccli vikram@malkans.net events primary \
  --from 2026-06-15T00:00:00Z \
  --to 2026-06-15T23:59:59Z
```

### Accepting Multiple Invites

```bash
# Search for invites
gmcli vikram@malkans.net search "filename:ics OR subject:Invitation"

# Read each
gmcli vikram@malkans.net thread <threadId1>
gmcli vikram@malkans.net thread <threadId2>

# Create calendar copies
gccli vikram@malkans.net create primary --summary "..." --start "..." --end "..."
```

## Data Storage

- **gmcli**: `~/.gmcli/` (credentials, tokens, attachments)
- **gdcli**: `~/.gdcli/` (credentials, tokens)
- **gccli**: `~/.gccli/` (credentials, tokens)

## Tips

1. **Use search liberally** - Gmail search syntax is powerful
2. **Mark emails as read** - Keep inbox state accurate
3. **Batch operations** - Process multiple emails/events together
4. **Verify before sharing** - Double-check file sharing permissions
5. **Use calendar copies for invites** - Current workflow doesn't send RSVPs
