package com.sanatanhindu.app;

/**
 * Bhakti Daily — centralized AdMob configuration (earning engine).
 *
 * DO BUILD, DO KAAM:
 *   - RELEASE build (.aab, Google Play)  -> aapke REAL AdMob IDs (kamai).
 *   - DEBUG build ("Bhakti TEST" app)     -> hamesha Google TEST ads, apne phone par
 *     bina darr ke test karne ke liye. (Apne hi REAL ad par tap = account ban ka risk.)
 *
 * REAL IDs badalne hain? scripts/set_admob_ids.sh chalao (IDs check karke yahan likhta hai).
 * App ID build.gradle me hai (ADMOB_APP_ID_REAL).
 *
 * Format -> kamai (India, approx): Rewarded > Interstitial > App open > Banner.
 */
public final class AdConfig {
    private AdConfig() {}

    /** Debug build me sirf test ads. */
    private static final boolean TEST_ADS = BuildConfig.DEBUG;

    // ---- REAL ad unit IDs (release / Google Play) — AdMob app "Bhakti Daily" ----
    static final String REAL_BANNER_AD_UNIT_ID       = "ca-app-pub-4606541517815413/9602495526";
    static final String REAL_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-4606541517815413/4126807561";
    static final String REAL_REWARDED_AD_UNIT_ID     = "ca-app-pub-4606541517815413/1500644223";
    static final String REAL_APP_OPEN_AD_UNIT_ID     = "ca-app-pub-4606541517815413/6561399218";

    // ---- Google official TEST IDs (debug build) ----
    private static final String TEST_BANNER       = "ca-app-pub-3940256099942544/9214589741"; // adaptive banner
    private static final String TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
    private static final String TEST_REWARDED     = "ca-app-pub-3940256099942544/5224354917";
    private static final String TEST_APP_OPEN     = "ca-app-pub-3940256099942544/9257395921";

    public static final String BANNER_AD_UNIT_ID       = TEST_ADS ? TEST_BANNER       : REAL_BANNER_AD_UNIT_ID;
    public static final String INTERSTITIAL_AD_UNIT_ID = TEST_ADS ? TEST_INTERSTITIAL : REAL_INTERSTITIAL_AD_UNIT_ID;
    public static final String REWARDED_AD_UNIT_ID     = TEST_ADS ? TEST_REWARDED     : REAL_REWARDED_AD_UNIT_ID;
    public static final String APP_OPEN_AD_UNIT_ID     = TEST_ADS ? TEST_APP_OPEN     : REAL_APP_OPEN_AD_UNIT_ID;

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
