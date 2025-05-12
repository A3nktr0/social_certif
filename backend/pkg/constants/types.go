package constants

// WebSocket channels
const (
	ChannelNotifications = "notifications"
	ChannelChat          = "chat"
	ChannelEvents        = "events"
	ChannelPresence      = "presence"
)

// Notification types
const (
	NotifFollowRequest         = "follow_request"
	NotifFollowAccepted        = "follow_accepted"
	NotifFollow                = "follow"
	NotifFollowRequestResolved = "follow_request_resolved"
	NotifGroupJoinRequest      = "group_join_request"
	NotifGroupInvite           = "group_invite"
	NotifGroupJoinAccepted     = "group_join_accepted"
	NotifGroupInviteAccepted   = "group_invite_accepted"
	NotifGroupJoinRejected     = "group_join_rejected"
	NotifGroupInviteRejected   = "group_invite_rejected"
	NotifGroupEventCreated     = "group_event_created"
)
