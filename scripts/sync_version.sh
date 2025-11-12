#!/bin/bash

# Extract version from manifest.json and update Jekyll data file
VERSION=$(grep -o '"version": *"[^"]*"' ../src/manifest.json | grep -o '[0-9.]*')

# Create or update the Jekyll data file
mkdir -p ../docs/_data
echo "{ \"number\": \"$VERSION\" }" > ../docs/_data/version.json

echo "✓ Synced version $VERSION to Jekyll data"
