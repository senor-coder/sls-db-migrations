 #! bin/sh

echo "Preparing for DB migrations"
project="auth"
migrations_bucket="prod-db-migrations"
zip_name="migrations.zip"

echo "Zipping migrations"
cd dbmigration && zip -r "../$zip_name" * && cd -

# Upload the ZIP to s3
s3_upload_path="s3://$migrations_bucket/$project/$zip_name"
echo "Uploading migration archive to S3: ${s3_upload_path}"
aws s3 cp "$zip_name" "$s3_upload_path"

# Clean up the created zip
echo "Deleting migration archive: $zip_name"
rm "$zip_name"

## Invoke s3-migrate lambda
sls-dbmigrate up --lambda "dbMigrationHandler" --bucket "$migrations_bucket" --archive-path "$s3_upload_path" prod