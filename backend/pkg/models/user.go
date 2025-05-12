package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID        int
	Email     string
	Password  string
	FirstName string
	LastName  string
	DOB       time.Time
	Avatar    sql.NullString
	Nickname  sql.NullString
	About     sql.NullString
	IsPrivate bool
}
