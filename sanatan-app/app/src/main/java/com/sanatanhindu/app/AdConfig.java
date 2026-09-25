package com.sanatanhindu.app;

/**
 * Bhakti Daily — centralized AdMob configuration (earning engine).
 *
 * Abhi GOOGLE ke OFFICIAL TEST IDs lage hain (safe — inse paisa nahi aata).
 * Asli kamai ke liye (EARNING_GUIDE.md dekho):
 *   1. https://admob.google.com par app banao -> App ID + 4 Ad Unit IDs lo
 *      (Banner, Interstitial, Rewarded, App open).
 *   2. build.gradle me manifestPlaceholders -> admobAppId = apna App ID.
 *   3. Niche charon *_AD_UNIT_ID apni real IDs se badlo.
 * WARNING: real IDs lagne ke baad apne hi ad par click MAT karo (account ban).
 *
 * Format -> kamai (India, approx): Rewarded > App open ~ Interstitial > Banner.
 */
public final class AdConfig {
    private AdConfig() {}

    // ---- Ad unit IDs (TEST — replace with your own) ----
    public static final String BANNER_AD_UNIT_ID       = "ca-app-pub-3940256099942544/9214589741"; // adaptive banner
    public static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";
    public static final String REWARDED_AD_UNIT_ID     = "ca-app-pub-3940256099942544/5224354917";
    public static final String APP_OPEN_AD_UNIT_ID     = "ca-app-pub-3940256099942544/9257395921";

    // ---- Interstitial pacing (AdMob policy: only at natural breaks, not too often) ----
    /** Itne natural breaks (paath khatam, mala poori, tab badla) ke baad ek interstitial. */
    public static final int  INTERSTITIAL_EVERY          = 3;
    /** Do full-screen ads ke beech kam se kam itna gap. */
    public static final long INTERSTITIAL_MIN_GAP_MS     = 90_000L;
    /** App khulne ke baad itni der tak koi interstitial nahi. */
    public static final long INTERSTITIAL_SESSION_GRACE_MS = 45_000L;

    // ---- App open ad (only when user returns to the app) ----
    /** Itni der background me rehne ke baad hi app-open ad. */
    public static final long APP_OPEN_MIN_BACKGROUND_MS  = 30_000L;
    /** Do app-open ads ke beech kam se kam gap. */
    public static final long APP_OPEN_MIN_GAP_MS         = 3L * 60L * 60L * 1000L;  // 3 hours
    /** Google guidance: loaded app-open ad 4 ghante baad expire. */
    public static final long APP_OPEN_EXPIRY_MS          = 4L * 60L * 60L * 1000L;
    /** Pehle itne launches me app-open ad nahi (naye user ka pehla anubhav saaf rahe). */
    public static final int  APP_OPEN_SKIP_FIRST_LAUNCHES = 2;
    /** Share/WhatsApp/link se laute user ko itni der tak app-open ad nahi. */
    public static final long APP_OPEN_AFTER_EXTERNAL_MS  = 5L * 60L * 1000L;
}
