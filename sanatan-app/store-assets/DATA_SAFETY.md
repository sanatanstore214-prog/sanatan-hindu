# Google Play — Data Safety form answers (Bhakti Daily)

Use these when filling the **Data safety** section in Play Console.

## Does your app collect or share user data?
**Yes** — because of the Google AdMob ads SDK.

## Data types
| Data type | Collected | Shared | Purpose | By |
|-----------|-----------|--------|---------|-----|
| Device or other IDs (Advertising ID) | Yes | Yes | Advertising / analytics | Google AdMob SDK |
| App activity (app interactions) | Yes (anonymous) | No | Analytics / app functionality | App (local) + AdMob |

- The app itself does **not** collect name, email, contacts, location,
  photos, or files.
- Favorites / settings / streak / reminders are stored **only on the
  device** (not "collected" in Play terms — not sent off device).

## Security practices
- **Data encrypted in transit:** Yes (ad requests use HTTPS).
- **Users can request data deletion:** Uninstalling removes all local data;
  no server data is held by the developer.

## Advertising ID declaration
- App uses Advertising ID: **Yes** (via Google AdMob). Declare the
  `com.google.android.gms.permission.AD_ID` permission usage as "Advertising
  or marketing".

## Notifications
- Uses `POST_NOTIFICATIONS` for **local** daily reminders (not marketing
  push from a server).

## Permissions summary (why each is present)
| Permission | Reason |
|-----------|--------|
| INTERNET / ACCESS_NETWORK_STATE | Load ads (content is offline) |
| POST_NOTIFICATIONS | Daily bhakti reminders |
| RECEIVE_BOOT_COMPLETED | Re-arm reminders after phone restart |
| VIBRATE | Reminder + Jaap counter vibration |
| SET_WALLPAPER | Set devotional wallpaper (user action only) |
| WRITE_EXTERNAL_STORAGE (maxSdk 28) | Save wallpaper to gallery on Android 9 & below (Android 10+ uses scoped MediaStore, no permission) |
| AD_ID (auto by AdMob) | Personalised/measured ads |

## Pre-launch checklist
- [ ] Privacy Policy URL set (host PRIVACY_POLICY.md publicly)
- [ ] Data safety form filled as above
- [ ] Ads declaration = "Yes, contains ads"
- [ ] Target audience / content rating questionnaire
- [ ] Real AdMob App ID + Ad Unit IDs swapped in (see AdConfig.java & build.gradle)
- [ ] Signed release (App Bundle) uploaded
