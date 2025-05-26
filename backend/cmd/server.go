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

	r.Use(middleware.CORSMiddleware)            // CORS
	r.Use(middleware.SecurityHeadersMiddleware) // Sécurité
	r.Use(middleware.SetCSRFToken)              // CSRF token

	// Public
	r.Get("/api/health", handlers.Health)
	r.Get("/api/csrf", middleware.GetCSRFToken)
	r.Post("/api/register", middleware.RateLimit(handlers.Register))
	r.Post("/api/login", middleware.RateLimit(handlers.Login))

	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)    // Authenticated routes
		r.Use(middleware.CSRFMiddleware) // CSRF token for authenticated routes
		// Authenticated
		r.Post("/api/logout", handlers.Logout)
		r.Get("/api/me", handlers.Me)
		r.Delete("/api/me", handlers.DeleteMyProfile)
		r.Get("/api/me/data", handlers.GetMyPersonalData)
		r.Get("/api/hello", HelloUser)

		// Profile access
		r.Get("/api/profile/{id}", handlers.GetUserProfile)
		r.Post("/api/profile/edit", handlers.UpdateUserProfile)
		r.Post("/api/upload/avatar", handlers.UploadAvatar)

		// Follow
		r.Post("/api/follow/{id}", handlers.FollowUser)
		r.Get("/api/follow/status/{id}", handlers.FollowStatus)
		r.Post("/api/follow/unfollow/{id}", handlers.UnfollowUser)
		r.Post("/api/follow/accept/{id}", handlers.AcceptFollowRequest)
		r.Post("/api/follow/reject/{id}", handlers.RejectFollowRequest)
		r.Get("/api/follow/followers", handlers.ListFollowers)
		r.Get("/api/follow/following", handlers.ListFollowingUsers)
		r.Get("/api/follow/stats", handlers.FollowStats)

		// Posts
		r.Post("/api/posts", handlers.CreatePost)
		r.Get("/api/posts/feed", handlers.GetFeed)
		r.Get("/api/posts/{id}", handlers.GetPostByID)
		r.Get("/api/posts/by-user/{id}", handlers.GetPostsByUser)
		r.Put("/api/posts/{id}", handlers.EditPost)
		r.Delete("/api/posts/{id}", handlers.DeletePost)

		// Likes
		r.Post("/api/posts/{id}/like", handlers.LikePost)
		r.Post("/api/posts/{id}/unlike", handlers.UnlikePost)
		r.Get("/api/posts/{id}/likes", handlers.GetLikes)
		r.Get("/api/posts/{id}/liked", handlers.HasLiked)

		// Comments
		r.Post("/api/posts/{id}/comments", handlers.CreateComment)
		r.Get("/api/posts/{id}/comments", handlers.GetComments)
		r.Put("/api/comments/{id}", handlers.EditComment)
		r.Delete("/api/comments/{id}", handlers.DeleteComment)

		// Explore
		r.Get("/api/explore", handlers.ExploreUsers)

		// Groups
		r.Post("/api/groups", handlers.CreateGroup)
		r.Get("/api/groups", handlers.ListUserGroups)
		r.Get("/api/groups/{id}", handlers.GetGroupByID)
		r.Get("/api/groups/discover", handlers.DiscoverGroups)
		r.Post("/api/groups/{id}/join", handlers.RequestToJoinGroup)
		r.Post("/api/groups/{id}/invite/{userId}", handlers.InviteUserToGroup)
		r.Get("/api/groups/{id}/invite-options", handlers.GetInvitableUsers)
		r.Post("/api/groups/{id}/accept-request/{userId}", handlers.AcceptJoinRequest)
		r.Post("/api/groups/{id}/reject-request/{userId}", handlers.RejectJoinRequest)
		r.Post("/api/groups/{id}/accept-invite", handlers.AcceptInvite)
		r.Post("/api/groups/{id}/reject-invite", handlers.RejectInvite)
		r.Put("/api/groups/{id}", handlers.UpdateGroup)
		r.Delete("/api/groups/{id}", handlers.DeleteGroup)

		// Group members
		r.Get("/api/groups/{id}/members", handlers.GetGroupMembers)
		r.Delete("/api/groups/{id}/members/{userId}", handlers.RemoveGroupMember)

		// Group posts
		r.Post("/api/groups/{id}/posts", handlers.CreateGroupPost)
		r.Get("/api/groups/{id}/posts", handlers.GetGroupPosts)

		// Group Events
		r.Post("/api/groups/{id}/events", handlers.CreateGroupEvent)
		r.Get("/api/groups/{id}/events", handlers.GetGroupEvents)
		r.Delete("/api/groups/{id}/events/{eventId}", handlers.DeleteGroupEvent)
		r.Post("/api/groups/{id}/events/{eventId}/rsvp", handlers.RSVPEvent)
		r.Get("/api/groups/{id}/events/{eventId}", handlers.GetGroupEventDetail)
		r.Patch("/api/groups/{id}/events/{eventId}", handlers.UpdateGroupEvent)

		// notifications
		r.Get("/api/notifications", handlers.GetNotifications)
		r.Delete("/api/notifications/{id}", handlers.DeleteNotification)
		r.Patch("/api/notifications/{id}/read", handlers.MarkNotificationAsRead)
		r.Get("/api/notifications/unread/count", handlers.CountUnreadNotifications)

		// chat
		r.Get("/api/chat/mutuals", handlers.GetMutualChatUsers)
		r.Get("/api/chat/private/{id}", handlers.GetPrivateMessages)
		r.Get("/api/chat/group/{id}", handlers.GetGroupMessages)

		// websocket
		r.Get("/api/ws", websocket.ServeWS)

	})

	// Start server
	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8000"
	}

	go websocket.GlobalHub.Run()

	log.Println("Backend running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func HelloUser(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Hello, user! You are logged in."))
}
