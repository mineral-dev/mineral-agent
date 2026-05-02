#!/bin/bash
# Source DATABASE_URL from .env.local, then run the pickup script
set -a
source "$(dirname "$0")/../.env.local"
set +a
cd /Users/andy/Project/mineral-agent
node /Users/andy/Project/mineral-agent/scripts/pickup_task.mjs
