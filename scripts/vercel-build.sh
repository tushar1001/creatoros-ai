#!/bin/bash
# Vercel build script for CreatorOS AI.
#
# What it does:
#   1. When DATABASE_URL is a Postgres URL (set automatically by the
#      Vercel > Storage > Neon integration, or manually by you), sync the
#      Prisma schema to the hosted database - so the tables exist on first
#      deploy without any manual migration step.
#   2. Generate the Prisma client for Postgres.
#   3. Build the Next.js app.
#
# If DATABASE_URL is not set yet, the build still succeeds; connecting the
# database and redeploying is all that remains.

set -e

if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgres*)
      echo "[build] DATABASE_URL detected - syncing Prisma schema to the database..."
      prisma db push --schema prisma/schema.postgres.prisma --accept-data-loss --skip-generate
      ;;
    *)
      echo "[build] WARNING: DATABASE_URL is set but is not a Postgres URL - skipping database sync."
      ;;
  esac
else
  echo "[build] DATABASE_URL is not set yet - add a Postgres database via Vercel > Storage, then redeploy."
fi

echo "[build] Generating Prisma client (postgres)..."
prisma generate --schema prisma/schema.postgres.prisma

echo "[build] Building Next.js app..."
next build
