package utils

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
)

// DeleteImageFromTable retrieves and deletes the image file for a given record in a table.
func DeleteImageFromTable(db *sql.DB, table string, idField string, id any, userID any, imageColumn string, staticPrefix string, uploadDir string, defaultImage string) error {

	var spec_field string
	if table == "groups" {
		spec_field = "creator_id"
	} else if table == "users" {
		spec_field = "id"
	} else {
		spec_field = "user_id"
	}

	var imagePath string
	query := fmt.Sprintf(`SELECT %s FROM %s WHERE %s = $1 AND %s = $2`, imageColumn, table, idField, spec_field)
	err := db.QueryRow(query, id, userID).Scan(&imagePath)
	if err == sql.ErrNoRows {
		return nil
	} else if err != nil {
		fmt.Println("Error querying database:", err)
		fmt.Println("Query:", query)
		fmt.Println("Parameters:", id, userID)
		return err
	}

	if imagePath != "" && imagePath != staticPrefix+defaultImage {
		// Convert /static/... to /uploads/... path
		filePath := strings.Replace(imagePath, staticPrefix, uploadDir, 1)
		err := os.Remove("." + filePath)
		if err != nil && !os.IsNotExist(err) {
			return err
		}
	}

	return nil
}
