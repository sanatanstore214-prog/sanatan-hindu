#!/usr/bin/env bash
# Bhakti Daily — apply your REAL AdMob IDs in one step (validates, patches, builds).
#
# Usage (from sanatan-app/):
#   scripts/set_admob_ids.sh <APP_ID> <BANNER_ID> <INTERSTITIAL_ID> <REWARDED_ID> <APP_OPEN_ID> [--dry-run] [--no-build]
#
#   APP_ID   looks like  ca-app-pub-1234567890123456~1234567890   (tilde ~)
#   unit IDs look like   ca-app-pub-1234567890123456/1234567890   (slash /)
#
# What it does:
#   - checks every ID's format and that all 5 belong to the SAME AdMob account
#   - refuses Google's test IDs (they never earn money)
#   - patches app/build.gradle (ADMOB_APP_ID_REAL) + AdConfig.java (4 REAL_* unit IDs);
#     the debug "Bhakti TEST" build keeps Google test ads
#   - writes store-assets/app-ads.txt with your publisher ID (derived from APP_ID)
#   - builds the signed release .aab + .apk (unless --no-build / --dry-run)
set -euo pipefail
cd "$(dirname "$0")/.."

DRY=0; BUILD=1; ARGS=()
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1; BUILD=0 ;;
    --no-build) BUILD=0 ;;
    *) ARGS+=("$a") ;;
  esac
done
if [ "${#ARGS[@]}" -ne 5 ]; then
  sed -n '2,9p' "$0"; exit 2
fi
APP="${ARGS[0]}"; BANNER="${ARGS[1]}"; INTER="${ARGS[2]}"; REWARD="${ARGS[3]}"; OPEN="${ARGS[4]}"
TEST_PUB="3940256099942544"
fail() { echo "❌ $*" >&2; exit 1; }

[[ "$APP" =~ ^ca-app-pub-([0-9]{16})~([0-9]{8,12})$ ]] || fail "APP_ID galat: '$APP' (App ID me ~ hota hai: ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY)"
PUB="${BASH_REMATCH[1]}"
[ "$PUB" != "$TEST_PUB" ] || fail "Ye Google ka TEST App ID hai — isse kamai nahi hoti. AdMob me bana apna App ID do."
for pair in "BANNER:$BANNER" "INTERSTITIAL:$INTER" "REWARDED:$REWARD" "APP_OPEN:$OPEN"; do
  name="${pair%%:*}"; id="${pair#*:}"
  [[ "$id" =~ ^ca-app-pub-([0-9]{16})/([0-9]{8,12})$ ]] || fail "$name ID galat: '$id' (Ad unit ID me / hota hai: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY)"
  [ "${BASH_REMATCH[1]}" = "$PUB" ] || fail "$name ID kisi doosre AdMob account ka hai (pub ${BASH_REMATCH[1]} ≠ App ID ka pub $PUB)"
done
dups=$(printf '%s\n' "$BANNER" "$INTER" "$REWARD" "$OPEN" | sort | uniq -d)
[ -z "$dups" ] || fail "Ek hi ad unit ID do jagah diya gaya: $dups (har format ka alag unit banta hai)"

GRADLE=app/build.gradle
ADCFG=app/src/main/java/com/sanatanhindu/app/AdConfig.java
ADSTXT=store-assets/app-ads.txt
echo "✓ Sab IDs sahi format me, ek hi account (pub-$PUB)"

if [ "$DRY" = 1 ]; then
  echo "— dry run: ye badlav honge —"
  echo "  $GRADLE : ADMOB_APP_ID_REAL -> $APP"
  echo "  $ADCFG  : BANNER=$BANNER INTERSTITIAL=$INTER REWARDED=$REWARD APP_OPEN=$OPEN"
  echo "  $ADSTXT : google.com, pub-$PUB, DIRECT, f08c47fec0942fa0"
  exit 0
fi

# Sirf REAL (release) values badalte hain; debug build ke Google TEST IDs jaise hain waise rehte hain.
sed -i -E "s#(def ADMOB_APP_ID_REAL[[:space:]]*=[[:space:]]*)\"[^\"]*\"#\1\"$APP\"#" "$GRADLE"
sed -i -E "s#(REAL_BANNER_AD_UNIT_ID[[:space:]]*=[[:space:]]*)\"[^\"]*\"#\1\"$BANNER\"#"             "$ADCFG"
sed -i -E "s#(REAL_INTERSTITIAL_AD_UNIT_ID[[:space:]]*=[[:space:]]*)\"[^\"]*\"#\1\"$INTER\"#"        "$ADCFG"
sed -i -E "s#(REAL_REWARDED_AD_UNIT_ID[[:space:]]*=[[:space:]]*)\"[^\"]*\"#\1\"$REWARD\"#"          "$ADCFG"
sed -i -E "s#(REAL_APP_OPEN_AD_UNIT_ID[[:space:]]*=[[:space:]]*)\"[^\"]*\"#\1\"$OPEN\"#"            "$ADCFG"
sed -i -E "s#^google\.com, pub-[0-9X]+, DIRECT, f08c47fec0942fa0#google.com, pub-$PUB, DIRECT, f08c47fec0942fa0#" "$ADSTXT"

# verify every patch actually landed (sed is silent when nothing matches)
grep -q "ADMOB_APP_ID_REAL = \"$APP\"" "$GRADLE" || fail "build.gradle patch nahi hua"
for pair in "BANNER:$BANNER" "INTERSTITIAL:$INTER" "REWARDED:$REWARD" "APP_OPEN:$OPEN"; do
  n="${pair%%:*}"; id="${pair#*:}"
  grep -E "REAL_${n}_AD_UNIT_ID" "$ADCFG" | grep -q "\"$id\"" || fail "AdConfig.java me REAL_${n} par $id nahi laga"
done
! grep -E "REAL_[A-Z_]+_AD_UNIT_ID|def ADMOB_APP_ID_REAL" "$ADCFG" "$GRADLE" | grep -q "$TEST_PUB" || fail "REAL (release) me abhi bhi test ID baaki hai"
grep -q "pub-$PUB" "$ADSTXT"                     || fail "app-ads.txt patch nahi hua"
echo "✓ build.gradle, AdConfig.java, app-ads.txt update ho gaye"

if [ "$BUILD" = 1 ]; then
  export ANDROID_HOME="${ANDROID_HOME:-/root/android-sdk}" ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/root/android-sdk}"
  ./gradlew bundleRelease assembleRelease --no-daemon --console=plain
  echo "✓ Build: app/build/outputs/bundle/release/app-release.aab (Play) + apk/release/app-release.apk (phone)"
fi
echo "⚠️ Yaad rahe: apne hi ads par kabhi click mat karna. Phone ko AdMob → Settings → Test devices me jodo."
