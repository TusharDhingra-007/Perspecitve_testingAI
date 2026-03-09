#!/bin/bash
# Build script for Vercel — generates env.js from environment variables

echo "=== Build started ==="
echo "FIREBASE_PROJECT_ID is set: $([ -n \"$FIREBASE_PROJECT_ID\" ] && echo 'YES' || echo 'NO')"
echo "FIREBASE_API_KEY is set: $([ -n \"$FIREBASE_API_KEY\" ] && echo 'YES' || echo 'NO')"

cat > js/env.js << EOF
const ENV = {
    FIREBASE_API_KEY: "${FIREBASE_API_KEY}",
    FIREBASE_AUTH_DOMAIN: "${FIREBASE_AUTH_DOMAIN}",
    FIREBASE_DATABASE_URL: "${FIREBASE_DATABASE_URL}",
    FIREBASE_PROJECT_ID: "${FIREBASE_PROJECT_ID}",
    FIREBASE_STORAGE_BUCKET: "${FIREBASE_STORAGE_BUCKET}",
    FIREBASE_MESSAGING_SENDER_ID: "${FIREBASE_MESSAGING_SENDER_ID}",
    FIREBASE_APP_ID: "${FIREBASE_APP_ID}",
    FIREBASE_MEASUREMENT_ID: "${FIREBASE_MEASUREMENT_ID}"
};
EOF

echo "env.js generated successfully"
echo "=== Build complete ==="
