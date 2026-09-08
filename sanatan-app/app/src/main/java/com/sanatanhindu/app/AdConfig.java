package com.sanatanhindu.app;

/**
 * Bhakti Daily — centralized AdMob configuration.
 *
 * Abhi GOOGLE ke OFFICIAL TEST IDs lage hain (safe — inse paisa nahi aata).
 * Apni kamai shuru karne ke liye:
 *   1. https://admob.google.com par app banao -> App ID + Ad Unit IDs lo.
 *   2. build.gradle me manifestPlaceholders -> admobAppId badlo (App ID).
 *   3. Niche BANNER/INTERSTITIAL IDs apni real IDs se badlo.
 * WARNING: real IDs lagne ke baad apne phone se apne ad par click MAT karo.
 */
public final class AdConfig {
    private AdConfig() {}

    public static final String BANNER_AD_UNIT_ID       = "ca-app-pub-3940256099942544/6300978111";
    public static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";

    /** Har itne "natural navigation boundary" ke baad ek interstitial. */
    public static final int INTERSTITIAL_EVERY = 4;
}
