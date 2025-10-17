#!/bin/bash

# Chrome Extension Key Generator
# Generates a permanent extension key and displays the extension ID

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Chrome Extension Key Generator${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Navigate to project root (one level up from scripts directory)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

KEY_FILE="key.pem"

# Check if key.pem already exists
if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Key file already exists: ${KEY_FILE}${NC}"
    echo -e "${YELLOW}Using existing key...${NC}\n"
else
    echo -e "${CYAN}Generating new private key...${NC}"

    # Generate the private key
    openssl genrsa 2048 2>/dev/null | openssl pkcs8 -topk8 -nocrypt -out "$KEY_FILE" 2>/dev/null

    if [ $? -eq 0 ] && [ -f "$KEY_FILE" ]; then
        echo -e "${GREEN}✓ Private key generated: ${KEY_FILE}${NC}"
        echo -e "${RED}⚠️  IMPORTANT: Keep this file secure and NEVER commit it to git!${NC}\n"
    else
        echo -e "${RED}ERROR: Failed to generate private key${NC}"
        exit 1
    fi
fi

# Extract public key in base64 format
echo -e "${CYAN}Extracting public key...${NC}"
PUBLIC_KEY=$(openssl rsa -in "$KEY_FILE" -pubout -outform DER 2>/dev/null | openssl base64 -A)

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to extract public key${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Public key extracted${NC}\n"

# Calculate extension ID
echo -e "${CYAN}Calculating extension ID...${NC}"

# Use Python to calculate the extension ID from the public key
EXTENSION_ID=$(python3 -c "
import base64
import hashlib

# Decode the public key
key = base64.b64decode('$PUBLIC_KEY')

# Calculate SHA-256 hash
hash_bytes = hashlib.sha256(key).digest()

# Convert first 16 bytes to extension ID format (a-p)
extension_id = ''.join(chr(97 + b % 26) for b in hash_bytes[:32])

print(extension_id)
" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$EXTENSION_ID" ]; then
    echo -e "${RED}ERROR: Failed to calculate extension ID${NC}"
    echo -e "${YELLOW}Make sure Python 3 is installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Extension ID calculated${NC}\n"

# Display results
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}RESULTS${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${CYAN}Extension ID:${NC}"
echo -e "${YELLOW}${EXTENSION_ID}${NC}\n"

echo -e "${CYAN}Public Key (for manifest.json):${NC}"
echo -e "${YELLOW}${PUBLIC_KEY}${NC}\n"

echo -e "${CYAN}OAuth Redirect URI (for Google Cloud Console):${NC}"
echo -e "${YELLOW}https://${EXTENSION_ID}.chromiumapp.org/${NC}\n"

# Check if manifest.json has the key
if [ -f "manifest.json" ]; then
    if grep -q '"key":' manifest.json; then
        echo -e "${GREEN}✓ manifest.json already has a 'key' field${NC}"
    else
        echo -e "${YELLOW}⚠️  manifest.json does NOT have a 'key' field${NC}"
        echo -e "${YELLOW}You need to add the public key to manifest.json:${NC}\n"
        echo -e '  "key": "'${PUBLIC_KEY}'",'
        echo ""
    fi
fi

# Check if key.pem is in .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "key.pem\|*.pem" .gitignore; then
        echo -e "${GREEN}✓ key.pem is in .gitignore${NC}"
    else
        echo -e "${RED}⚠️  WARNING: key.pem is NOT in .gitignore${NC}"
        echo -e "${RED}Add 'key.pem' or '*.pem' to .gitignore to prevent committing it!${NC}"
    fi
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}NEXT STEPS${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo "1. Add the public key to manifest.json (if not already added)"
echo "2. Add the OAuth redirect URI to Google Cloud Console:"
echo -e "   ${YELLOW}https://${EXTENSION_ID}.chromiumapp.org/${NC}"
echo "3. Reload your extension in Chrome"
echo "4. Keep ${KEY_FILE} backed up securely (never commit to git!)"
echo ""

echo -e "${GREEN}Done!${NC}\n"
