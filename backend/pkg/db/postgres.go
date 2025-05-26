package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// Init initializes the database connection
// It uses the DATABASE_URL environment variable to connect to the database.
func Init() {
	connStr := os.Getenv("DATABASE_URL")
	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("DB connect error:", err)
	}
	if err = DB.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}
	log.Println("Connected to PostgreSQL")
}
