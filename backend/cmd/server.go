package main

import (
	"log"
	"net/http"
	"os"

	"socialbackend/pkg/db"
	"socialbackend/pkg/handlers"
	"socialbackend/pkg/middleware"
	"socialbackend/pkg/websocket"

	"github.com/go-chi/chi/v5"
)

func main() {
	db.Init()
	db.ApplyMigrations(db.DB)

	r := chi.NewRouter()

	// Public
	r.Get("/api/health", handlers.Health)
	r.Post("/api/register", middleware.RateLimit(handlers.Register))
	r.Post("/api/login", middleware.RateLimit(handlers.Login))
	r.Post("/api/logout", handlers.Logout)

	// Authenticated
	r.With(middleware.RequireAuth).Get("/api/me", handlers.Me)
	r.With(middleware.RequireAuth).Delete("/api/me", handlers.DeleteMyProfile)
	r.With(middleware.RequireAuth).Get("/api/me/data", handlers.GetMyPersonalData)
	r.With(middleware.RequireAuth).Get("/api/hello", HelloUser)

	// Profile access
	r.With(middleware.RequireAuth).Get("/api/profile/{id}", handlers.GetUserProfile)
	r.With(middleware.RequireAuth).Post("/api/profile/edit", handlers.UpdateUserProfile)
	r.With(middleware.RequireAuth).Post("/api/upload/avatar", handlers.UploadAvatar)

	// Follow
	r.With(middleware.RequireAuth).Post("/api/follow/{id}", handlers.FollowUser)
	r.With(middleware.RequireAuth).Get("/api/follow/status/{id}", handlers.FollowStatus)
	r.With(middleware.RequireAuth).Post("/api/follow/unfollow/{id}", handlers.UnfollowUser)
	r.With(middleware.RequireAuth).Post("/api/follow/accept/{id}", handlers.AcceptFollowRequest)
	r.With(middleware.RequireAuth).Post("/api/follow/reject/{id}", handlers.RejectFollowRequest)
	r.With(middleware.RequireAuth).Get("/api/follow/followers", handlers.ListFollowers)
	r.With(middleware.RequireAuth).Get("/api/follow/following", handlers.ListFollowingUsers)
	r.With(middleware.RequireAuth).Get("/api/follow/stats", handlers.FollowStats)

	// Posts
	r.With(middleware.RequireAuth).Post("/api/posts", handlers.CreatePost)
	r.With(middleware.RequireAuth).Get("/api/posts/feed", handlers.GetFeed)
	r.With(middleware.RequireAuth).Get("/api/posts/{id}", handlers.GetPostByID)
	r.With(middleware.RequireAuth).Get("/api/posts/by-user/{id}", handlers.GetPostsByUser)
	r.With(middleware.RequireAuth).Put("/api/posts/{id}", handlers.EditPost)
	r.With(middleware.RequireAuth).Delete("/api/posts/{id}", handlers.DeletePost)

	// Likes
	r.With(middleware.RequireAuth).Post("/api/posts/{id}/like", handlers.LikePost)
	r.With(middleware.RequireAuth).Post("/api/posts/{id}/unlike", handlers.UnlikePost)
	r.With(middleware.RequireAuth).Get("/api/posts/{id}/likes", handlers.GetLikes)
	r.With(middleware.RequireAuth).Get("/api/posts/{id}/liked", handlers.HasLiked)

	// Comments
	r.With(middleware.RequireAuth).Post("/api/posts/{id}/comments", handlers.CreateComment)
	r.With(middleware.RequireAuth).Get("/api/posts/{id}/comments", handlers.GetComments)
	r.With(middleware.RequireAuth).Put("/api/comments/{id}", handlers.EditComment)
	r.With(middleware.RequireAuth).Delete("/api/comments/{id}", handlers.DeleteComment)

	// Explore
	r.With(middleware.RequireAuth).Get("/api/explore", handlers.ExploreUsers)

	// Groups
	r.With(middleware.RequireAuth).Post("/api/groups", handlers.CreateGroup)
	r.With(middleware.RequireAuth).Get("/api/groups", handlers.ListUserGroups)
	r.With(middleware.RequireAuth).Get("/api/groups/{id}", handlers.GetGroupByID)
	r.With(middleware.RequireAuth).Get("/api/groups/discover", handlers.DiscoverGroups)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/join", handlers.RequestToJoinGroup)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/invite/{userId}", handlers.InviteUserToGroup)
	r.With(middleware.RequireAuth).Get("/api/groups/{id}/invite-options", handlers.GetInvitableUsers)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/accept-request/{userId}", handlers.AcceptJoinRequest)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/reject-request/{userId}", handlers.RejectJoinRequest)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/accept-invite", handlers.AcceptInvite)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/reject-invite", handlers.RejectInvite)
	r.With(middleware.RequireAuth).Put("/api/groups/{id}", handlers.UpdateGroup)
	r.With(middleware.RequireAuth).Delete("/api/groups/{id}", handlers.DeleteGroup)

	// Group members
	r.With(middleware.RequireAuth).Get("/api/groups/{id}/members", handlers.GetGroupMembers)
	r.With(middleware.RequireAuth).Delete("/api/groups/{id}/members/{userId}", handlers.RemoveGroupMember)

	// Group posts
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/posts", handlers.CreateGroupPost)
	r.With(middleware.RequireAuth).Get("/api/groups/{id}/posts", handlers.GetGroupPosts)

	// Group Events
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/events", handlers.CreateGroupEvent)
	r.With(middleware.RequireAuth).Get("/api/groups/{id}/events", handlers.GetGroupEvents)
	r.With(middleware.RequireAuth).Delete("/api/groups/{id}/events/{eventId}", handlers.DeleteGroupEvent)
	r.With(middleware.RequireAuth).Post("/api/groups/{id}/events/{eventId}/rsvp", handlers.RSVPEvent)
	r.With(middleware.RequireAuth).Get("/api/groups/{id}/events/{eventId}", handlers.GetGroupEventDetail)
	r.With(middleware.RequireAuth).Patch("/api/groups/{id}/events/{eventId}", handlers.UpdateGroupEvent)

	// notifications
	r.With(middleware.RequireAuth).Get("/api/notifications", handlers.GetNotifications)
	r.With(middleware.RequireAuth).Delete("/api/notifications/{id}", handlers.DeleteNotification)
	r.With(middleware.RequireAuth).Patch("/api/notifications/{id}/read", handlers.MarkNotificationAsRead)
	r.With(middleware.RequireAuth).Get("/api/notifications/unread/count", handlers.CountUnreadNotifications)

	// chat
	r.With(middleware.RequireAuth).Get("/api/chat/mutuals", handlers.GetMutualChatUsers)
	r.With(middleware.RequireAuth).Get("/api/chat/private/{id}", handlers.GetPrivateMessages)
	r.With(middleware.RequireAuth).Get("/api/chat/group/{id}", handlers.GetGroupMessages)

	// websocket
	r.With(middleware.RequireAuth).Get("/api/ws", websocket.ServeWS)

	// Static files
	fs := http.StripPrefix("/static/", http.FileServer(http.Dir("./uploads")))
	r.Handle("/static/*", fs)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	go websocket.GlobalHub.Run()

	log.Println("Backend running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func HelloUser(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello, user! You are logged in."))
}
