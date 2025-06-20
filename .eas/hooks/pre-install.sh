#!/bin/bash

echo "📦 복원 중: google-services.json from GOOGLE_SERVICES_JSON"

# EAS 서버에서 주입된 환경변수로 복원
echo "$GOOGLE_SERVICES_JSON" | base64 -d > android/app/google-services.json

echo "✅ 복원 완료: android/app/google-services.json"
