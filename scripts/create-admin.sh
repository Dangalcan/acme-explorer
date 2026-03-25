#!/usr/bin/env bash
# create-admin.sh — Creates an administrator user in Firebase Auth + Firestore
# Usage: ./scripts/create-admin.sh
# Requires: curl, python3

set -euo pipefail

# ── JSON helper (no jq needed) ─────────────────────────────────────────────────
json_get() { python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))" ; }
json_has() { python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if '$1' in d else 'no')" ; }

# ── Config ─────────────────────────────────────────────────────────────────────
API_KEY="AIzaSyC8qNztSsGVqja8mtIvpgtxzfvik6yNdu0"
PROJECT_ID="acme-explorer-7ed09"

# ── Prompt for admin details ───────────────────────────────────────────────────
echo "=== Create Admin User ==="
read -rp "Name:       " NAME
read -rp "Surname:    " SURNAME
read -rp "Email:      " EMAIL
read -rsp "Password:   " PASSWORD
echo
read -rp "Phone (optional, E.164 e.g. +34600000000): " PHONE
read -rp "Address (optional): " ADDRESS

# ── Validate password strength ────────────────────────────────────────────────
if ! echo "$PASSWORD" | grep -qP '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'; then
  echo "ERROR: Password must be at least 8 chars and include uppercase, lowercase, digit and special char (@\$!%*?&)."
  exit 1
fi

# ── Step 1: Create user in Firebase Auth ──────────────────────────────────────
echo
echo "Creating Firebase Auth user..."
AUTH_RESPONSE=$(curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"returnSecureToken\":true}")

if [[ "$(echo "$AUTH_RESPONSE" | json_has error)" == "yes" ]]; then
  echo "ERROR creating Auth user:"
  echo "$AUTH_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['error']['message'])"
  exit 1
fi

FIREBASE_UID=$(echo "$AUTH_RESPONSE" | json_get localId)
ID_TOKEN=$(echo "$AUTH_RESPONSE" | json_get idToken)
echo "Auth user created — UID: $FIREBASE_UID"

# ── Step 2: Write actor document to Firestore ──────────────────────────────────
echo "Writing Firestore document to actors/${FIREBASE_UID}..."

OPTIONAL_FIELDS=""
if [[ -n "$PHONE" ]]; then
  OPTIONAL_FIELDS+="\"phoneNumber\":{\"stringValue\":\"${PHONE}\"},"
fi
if [[ -n "$ADDRESS" ]]; then
  OPTIONAL_FIELDS+="\"address\":{\"stringValue\":\"${ADDRESS}\"},"
fi

FIRESTORE_URL="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/actors/${FIREBASE_UID}"

FIRESTORE_RESPONSE=$(curl -s -X PATCH \
  "${FIRESTORE_URL}" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"fields\": {
      \"name\":    {\"stringValue\": \"${NAME}\"},
      \"surname\": {\"stringValue\": \"${SURNAME}\"},
      \"email\":   {\"stringValue\": \"${EMAIL}\"},
      ${OPTIONAL_FIELDS}
      \"role\":    {\"stringValue\": \"administrator\"},
      \"version\": {\"integerValue\": \"0\"}
    }
  }")

if [[ "$(echo "$FIRESTORE_RESPONSE" | json_has error)" == "yes" ]]; then
  echo "ERROR writing Firestore document:"
  echo "$FIRESTORE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['error']['message'])"
  echo
  echo "The Auth user was already created (UID: $FIREBASE_UID)."
  echo "You may need to delete it manually from the Firebase console before retrying."
  exit 1
fi

echo
echo "Done! Administrator created successfully."
echo "  UID:     $FIREBASE_UID"
echo "  Email:   $EMAIL"
echo "  Role:    administrator"
