#!/bin/bash

# Chrome Extension Release Builder
# This script packages the extension for Chrome Web Store submission

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Chrome Extension Release Builder${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*' manifest.json | grep -o '[^"]*$')
echo -e "${YELLOW}Building version: ${VERSION}${NC}\n"

# Define output directory and filename
OUTPUT_DIR="releases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="icalendar-extension-v${VERSION}-${TIMESTAMP}.zip"
ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

# Create releases directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Define files and directories to include
FILES_TO_INCLUDE=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "background.js"
    "styles.css"
    "images/logo_16x16.png"
    "images/logo_48x48.png"
    "images/logo_128x128.png"
    "images/logo_512x512.png"
)

# Define documentation files (optional - can be excluded for store submission)
DOC_FILES=(
)

echo -e "${YELLOW}Files to be included:${NC}"
for file in "${FILES_TO_INCLUDE[@]}" "${DOC_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✓ $file"
    else
        echo -e "  ${RED}✗ $file (missing)${NC}"
    fi
done
echo ""

# Check if all required files exist
MISSING_FILES=0
for file in "${FILES_TO_INCLUDE[@]}"; do
    if [ ! -e "$file" ]; then
        echo -e "${RED}ERROR: Required file missing: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}Build failed: $MISSING_FILES required file(s) missing${NC}"
    exit 1
fi

# Remove old zip if it exists
if [ -f "$ZIP_PATH" ]; then
    rm "$ZIP_PATH"
fi

# Create the zip file
echo -e "${YELLOW}Creating release package...${NC}"
zip -r "$ZIP_PATH" "${FILES_TO_INCLUDE[@]}" "${DOC_FILES[@]}" -x "*.DS_Store" -x "__MACOSX/*" > /dev/null 2>&1

# Check if zip was created successfully
if [ $? -eq 0 ] && [ -f "$ZIP_PATH" ]; then
    FILE_SIZE=$(ls -lh "$ZIP_PATH" | awk '{print $5}')
    echo -e "${GREEN}✓ Release package created successfully!${NC}\n"
    echo -e "${GREEN}========================================${NC}"
    echo -e "  Output: ${ZIP_PATH}"
    echo -e "  Size: ${FILE_SIZE}"
    echo -e "${GREEN}========================================${NC}\n"

    # List contents of the zip
    echo -e "${YELLOW}Package contents:${NC}"
    unzip -l "$ZIP_PATH"

    echo -e "\n${GREEN}Ready for Chrome Web Store upload!${NC}"
    echo -e "Upload at: ${YELLOW}https://chrome.google.com/webstore/devconsole${NC}\n"
else
    echo -e "${RED}ERROR: Failed to create release package${NC}"
    exit 1
fi
