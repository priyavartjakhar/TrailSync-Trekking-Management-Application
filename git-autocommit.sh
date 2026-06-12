#!/bin/bash

# Configuration
INTERVAL=1800 # Default to 30 minutes in seconds
if [ -n "$AUTOCOMMIT_INTERVAL" ]; then
  INTERVAL="$AUTOCOMMIT_INTERVAL"
fi

# Get directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🔄 Git Auto-Commit Daemon started."
echo "⏱️  Checking for changes every $INTERVAL seconds."

# Graceful termination handler
cleanup() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Git Auto-Commit Daemon stopping..."
  exit 0
}
trap cleanup SIGINT SIGTERM

while true; do
  # Check if there are any changes (modified, deleted, or untracked that are not ignored)
  if [ -n "$(git status --porcelain)" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Changes detected. Committing..."
    
    # Stage all changes (excluding files in .gitignore)
    git add -A
    
    # Commit with auto message
    COMMIT_MSG="auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
    if git commit -m "$COMMIT_MSG"; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Successfully committed: '$COMMIT_MSG'"
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Commit failed."
    fi
  else
    # Log that no changes were found
    echo "$(date '+%Y-%m-%d %H:%M:%S') - No changes detected."
  fi
  
  # Sleep in a way that responds to signals immediately
  sleep "$INTERVAL" &
  wait $!
done
