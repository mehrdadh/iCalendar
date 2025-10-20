#!/bin/bash

# Script to create a git tag based on the version in manifest.json
# Usage: ./scripts/create_git_tag.sh [--push]

set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Path to manifest.json
MANIFEST_FILE="$PROJECT_ROOT/manifest.json"

# Check if manifest.json exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Error: manifest.json not found at $MANIFEST_FILE"
    exit 1
fi

# Extract version from manifest.json
# Try using jq if available, otherwise use grep + sed
if command -v jq &> /dev/null; then
    VERSION=$(jq -r '.version' "$MANIFEST_FILE")
else
    # Fallback to grep and sed if jq is not available
    VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$MANIFEST_FILE" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi

# Validate version was extracted
if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from manifest.json"
    exit 1
fi

# Create tag name with 'v' prefix
TAG_NAME="v$VERSION"

echo "Version found: $VERSION"
echo "Creating git tag: $TAG_NAME"

# Check if tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo "Warning: Tag $TAG_NAME already exists"
    read -p "Do you want to delete and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG_NAME"
        echo "Deleted existing tag $TAG_NAME"
    else
        echo "Aborted"
        exit 1
    fi
fi

# Create the tag
git tag -a "$TAG_NAME" -m "Release version $VERSION"
echo "Successfully created tag $TAG_NAME"

# Check if --push flag was provided
if [ "$1" == "--push" ]; then
    echo "Pushing tag to remote..."
    git push origin "$TAG_NAME"
    echo "Successfully pushed tag $TAG_NAME to remote"
else
    echo ""
    echo "Tag created locally. To push to remote, run:"
    echo "  git push origin $TAG_NAME"
    echo ""
    echo "Or run this script with --push flag:"
    echo "  ./scripts/create_git_tag.sh --push"
fi
