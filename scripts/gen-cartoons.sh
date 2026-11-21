#!/bin/bash
# Generates the CreatorOS AI 3D cartoon illustration set via the Gemini image API.
# Run: bash scripts/gen-cartoons.sh
cd "$(dirname "$0")/.."
mkdir -p public/cartoon
bun scripts/gen-cartoons.mjs
