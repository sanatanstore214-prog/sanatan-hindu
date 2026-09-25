# Google Play — Data Safety form answers (Bhakti Daily)

Use these when filling the **Data safety** section in Play Console.

## Does your app collect or share user data?
**Yes** — because of the Google AdMob ads SDK.

## Data types
| Data type | Collected | Shared | Purpose | By |
|-----------|-----------|--------|---------|-----|
| Device or other IDs (Advertising ID) | Yes | Yes | Advertising / analytics | Google AdMob SDK |
| App activity (app interactions) | Yes (anonymous) | No | Analytics / app functionality | App (local) + AdMob |
| Name (display name) | Yes — **only if** user joins/creates a Group Jaap | Yes — visible to that group's members | App functionality (group leaderboard) | App → Firebase Firestore |
| App activity (jaap count) | Yes — **only if** in a Group Jaap | Yes — group total & leaderboard | App functionality | App → Firebase Firestore |

- The app itself does **not** collect email, phone number, contacts,
  location, photos, or files.
- **Status/DP photo (v4.0):** if the user picks a photo for their DP/status,
  it is resized and kept **only on the device** (localStorage) to draw the
  card. It is never uploaded. It leaves the device only if the user
  themselves shares the generated image. → Not "collected" in Play terms.
- **Ads (v4.0):** Google AdMob serves banner, interstitial, rewarded and
  app-open ads. Rewarded ads give only in-app virtual "पुण्य अंक"/designs.
  Google UMP shows a consent form to EEA/UK/CH users (a "European
  regulations" message must be published in AdMob → Privacy & messaging).
- Favorites / settings / streak / reminders / your saved name are stored
  **only on the device** (not "collected" in Play terms) **unless** you opt
  in to **Group Jaap**.
- **Group Jaap (optional):** if a user creates or joins a group, only their
  **chosen display name** and **jaap count** are sent to the developer's
  Firebase (Firestore) so the group can show a shared total and leaderboard.
  No advertising ID, contacts, phone number or location is sent. If the
  Group feature is not configured by the developer, **no data leaves the
  device at all** (feature stays inactive).

## Security practices
- **Data encrypted in transit:** Yes (ad + Firestore requests use HTTPS).
- **Users can request data deletion:** Uninstalling removes all local data.
  For Group Jaap, "समूह छोड़ें" (Leave group) stops further contribution; to
  erase a member's name/count from the cloud, the developer can delete that
  member doc in the Firebase console (document a support email in the Play
  listing for deletion requests).

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
- [ ] Privacy Policy URL set in Play Console: https://docs.google.com/document/d/e/2PACX-1vTKdl20eFsGi8rpn3Rn7oW_FwF6iXiVpaO1-WX6EKpx7PHMw65tMMEV3Br_KfoA-JeJQ7imUrH9FO1e/pub (already public; same text as PRIVACY_POLICY.md)
- [ ] Data safety form filled as above
- [ ] Ads declaration = "Yes, contains ads"
- [ ] Target audience / content rating questionnaire
- [ ] Real AdMob App ID + Ad Unit IDs swapped in (see AdConfig.java & build.gradle)
- [ ] Signed release (App Bundle) uploaded
