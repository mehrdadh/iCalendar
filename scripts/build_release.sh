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
VERSION=$(grep -o '"version": "[^"]*' src/manifest.json | grep -o '[^"]*$')
echo -e "${YELLOW}Building version: ${VERSION}${NC}\n"

# Define output directory and filename
OUTPUT_DIR="releases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="icalendar-extension-v${VERSION}-${TIMESTAMP}.zip"
ZIP_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

# Create releases directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Define directories to include
DIRS_TO_INCLUDE=(
    "src"
)

echo -e "${YELLOW}Directories to be included:${NC}"
for dir in "${DIRS_TO_INCLUDE[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir/"
        # Show key files in the directory
        if [ -f "$dir/manifest.json" ]; then
            VERSION_CHECK=$(grep -o '"version": "[^"]*' "$dir/manifest.json" | grep -o '[^"]*$')
            echo "    - manifest.json (v${VERSION_CHECK})"
        fi
        FILE_COUNT=$(find "$dir" -type f | wc -l | tr -d ' ')
        echo "    - ${FILE_COUNT} total files"
    else
        echo -e "  ${RED}✗ $dir/ (missing)${NC}"
    fi
done
echo ""

# Check if src directory exists and has manifest.json
if [ ! -d "src" ]; then
    echo -e "${RED}ERROR: src/ directory not found${NC}"
    exit 1
fi

if [ ! -f "src/manifest.json" ]; then
    echo -e "${RED}ERROR: src/manifest.json not found${NC}"
    exit 1
fi

# Remove old zip if it exists
if [ -f "$ZIP_PATH" ]; then
    rm "$ZIP_PATH"
fi

# Create the zip file
echo -e "${YELLOW}Creating release package...${NC}"
cd src
zip -r "../${ZIP_PATH}" . -x "*.DS_Store" -x "__MACOSX/*" > /dev/null 2>&1
cd ..

# Check if zip was created successfully
if [ $? -eq 0 ] && [ -f "$ZIP_PATH" ]; then
    FILE_SIZE=$(ls -lh "$ZIP_PATH" | awk '{print $5}')
    FILE_SIZE_BYTES=$(stat -f%z "$ZIP_PATH" 2>/dev/null || stat -c%s "$ZIP_PATH" 2>/dev/null)
    UNCOMPRESSED_SIZE=$(unzip -l "$ZIP_PATH" | tail -1 | awk '{print $1}')
    UNCOMPRESSED_SIZE_HR=$(numfmt --to=iec-i --suffix=B $UNCOMPRESSED_SIZE 2>/dev/null || echo "N/A")

    echo -e "${GREEN}✓ Release package created successfully!${NC}\n"
    echo -e "${GREEN}========================================${NC}"
    echo -e "  Output: ${ZIP_PATH}"
    echo -e "  Compressed Size: ${FILE_SIZE} (${FILE_SIZE_BYTES} bytes)"
    echo -e "  Uncompressed Size: ${UNCOMPRESSED_SIZE_HR}"
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
