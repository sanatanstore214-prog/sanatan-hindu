package com.sanatanhindu.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.WallpaperManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Environment;
import android.provider.MediaStore;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Bhakti Daily — WebView host + AdMob + native bridge (reminders, share,
 * notifications, deep-link). Content pehle load hota hai; ads try/catch me,
 * premium/focus me band; reading & launch par kabhi interstitial nahi.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "BhaktiDaily";
    private static final int NOTIF_PERM_REQ = 1001;

    private WebView webView;
    private FrameLayout adContainer;
    private AdView bannerAd;
    private InterstitialAd interstitialAd;
    private int navCount = 0;
    private boolean adsEnabled = true;
    private String pendingRoute = null;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        pendingRoute = getIntent() != null ? getIntent().getStringExtra("route") : null;

        adContainer = findViewById(R.id.ad_container);
        webView = findViewById(R.id.webview);

        ReminderScheduler.createChannel(this);
        setupWebView();
        webView.loadUrl("https://appassets.androidx.org/assets/web/index.html");

        initAdsSafely();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String r = intent != null ? intent.getStringExtra("route") : null;
        if (r != null && webView != null) navigateTo(r);
    }

    private void navigateTo(final String route) {
        final String safe = route.replace("'", "");
        runOnUiThread(new Runnable() {
            public void run() {
                webView.evaluateJavascript(
                        "location.hash='#/" + safe + "';window.dispatchEvent(new Event('hashchange'));", null);
            }
        });
    }

    // ---------------- WebView ----------------
    private void setupWebView() {
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setBackgroundColor(Color.parseColor("#FBF6EE"));
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidx.org".equals(url.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, url)); } catch (Exception ignored) {}
                return true;
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) {
                    view.loadData("<html><body style='font-family:sans-serif;text-align:center;padding:40px;background:#FBF6EE;color:#8A2B1E'>"
                            + "<h2>🚩 Bhakti Daily</h2><p>App load nahi ho paya. Dobara kholiye.</p></body></html>",
                            "text/html; charset=utf-8", "UTF-8");
                }
            }
        });
    }

    // ---------------- Ads ----------------
    private void initAdsSafely() {
        try {
            MobileAds.initialize(this, s -> {});
            loadBanner();
            loadInterstitial();
        } catch (Throwable t) { Log.w(TAG, "ads init skipped: " + t.getMessage()); }
    }
    private void loadBanner() {
        try {
            if (!adsEnabled) return;
            bannerAd = new AdView(this);
            bannerAd.setAdUnitId(AdConfig.BANNER_AD_UNIT_ID);
            bannerAd.setAdSize(AdSize.BANNER);
            adContainer.removeAllViews();
            adContainer.addView(bannerAd);
            bannerAd.loadAd(new AdRequest.Builder().build());
        } catch (Throwable t) { Log.w(TAG, "banner skipped: " + t.getMessage()); }
    }
    private void loadInterstitial() {
        try {
            InterstitialAd.load(this, AdConfig.INTERSTITIAL_AD_UNIT_ID, new AdRequest.Builder().build(),
                    new InterstitialAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull InterstitialAd ad) {
                            interstitialAd = ad;
                            interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                                @Override public void onAdDismissedFullScreenContent() { interstitialAd = null; loadInterstitial(); }
                            });
                        }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { interstitialAd = null; }
                    });
        } catch (Throwable t) { Log.w(TAG, "interstitial skipped: " + t.getMessage()); }
    }
    private void maybeShowInterstitial() {
        try {
            if (!adsEnabled) return;
            navCount++;
            if (navCount % AdConfig.INTERSTITIAL_EVERY == 0 && interstitialAd != null) interstitialAd.show(this);
        } catch (Throwable ignored) {}
    }

    // ---------------- JS bridge ----------------
    private class AndroidBridge {
        @JavascriptInterface public void onNavigate() { runOnUiThread(MainActivity.this::maybeShowInterstitial); }
        @JavascriptInterface public void showInterstitial() {
            runOnUiThread(() -> { try { if (adsEnabled && interstitialAd != null) interstitialAd.show(MainActivity.this); } catch (Throwable ignored) {} });
        }
        @JavascriptInterface public void setAdsEnabled(final boolean on) {
            runOnUiThread(() -> {
                adsEnabled = on;
                if (adContainer != null) adContainer.setVisibility(on ? View.VISIBLE : View.GONE);
                if (on && bannerAd == null) loadBanner();
            });
        }
        @JavascriptInterface public void shareText(final String text) {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("text/plain");
                    i.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(i, "शेयर करें"));
                } catch (Throwable t) { Log.w(TAG, "shareText: " + t.getMessage()); }
            });
        }
        @JavascriptInterface public void shareImage(final String b64, final String caption) {
            runOnUiThread(() -> {
                try {
                    byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                    File dir = new File(getCacheDir(), "shared_images");
                    if (!dir.exists()) dir.mkdirs();
                    File f = new File(dir, "bhakti_card.png");
                    FileOutputStream fos = new FileOutputStream(f);
                    fos.write(bytes); fos.close();
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", f);
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("image/png");
                    i.putExtra(Intent.EXTRA_STREAM, uri);
                    if (caption != null) i.putExtra(Intent.EXTRA_TEXT, caption);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(i, "कार्ड शेयर करें"));
                } catch (Throwable t) { Log.w(TAG, "shareImage: " + t.getMessage()); }
            });
        }
        @JavascriptInterface public void setReminders(String json) { ReminderScheduler.saveAndSchedule(MainActivity.this, json); }
        @JavascriptInterface public String getReminders() { return ReminderScheduler.getJson(MainActivity.this); }
        @JavascriptInterface public void requestNotificationPermission() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIF_PERM_REQ);
                    }
                }
            });
        }
        @JavascriptInterface public boolean hasNotificationPermission() {
            try { return NotificationManagerCompat.from(MainActivity.this).areNotificationsEnabled(); } catch (Throwable t) { return true; }
        }
        @JavascriptInterface public void logEvent(String name, String params) { Log.d("BhaktiEvent", name + " " + params); }
        @JavascriptInterface public String getInitialRoute() { String r = pendingRoute; pendingRoute = null; return r == null ? "" : r; }
        @JavascriptInterface public void vibrate(int ms) {
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v == null || ms <= 0) return;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                else v.vibrate(ms);
            } catch (Throwable ignored) {}
        }
        @JavascriptInterface public void openPlayStore() {
            runOnUiThread(() -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + getPackageName()))); }
                catch (Throwable t) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + getPackageName()))); } catch (Throwable ignored) {}
                }
            });
        }
        @JavascriptInterface public boolean setWallpaper(String b64) {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                WallpaperManager.getInstance(MainActivity.this).setBitmap(bmp);
                return true;
            } catch (Throwable t) { Log.w(TAG, "setWallpaper: " + t.getMessage()); return false; }
        }
        @JavascriptInterface public boolean saveImage(String b64, String name) {
            try {
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                String fname = (name == null ? "bhakti" : name) + "_" + System.currentTimeMillis() + ".png";
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Images.Media.DISPLAY_NAME, fname);
                    cv.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    cv.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/BhaktiDaily");
                    Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) return false;
                    OutputStream os = getContentResolver().openOutputStream(uri);
                    os.write(bytes); os.close();
                    return true;
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "BhaktiDaily");
                    if (!dir.exists()) dir.mkdirs();
                    File f = new File(dir, fname);
                    FileOutputStream fos = new FileOutputStream(f); fos.write(bytes); fos.close();
                    sendBroadcast(new Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, Uri.fromFile(f)));
                    return true;
                }
            } catch (Throwable t) { Log.w(TAG, "saveImage: " + t.getMessage()); return false; }
        }
        @JavascriptInterface public void copyText(String text) {
            runOnUiThread(() -> {
                try {
                    ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Bhakti Daily", text));
                } catch (Throwable ignored) {}
            });
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, @NonNull String[] perms, @NonNull int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == NOTIF_PERM_REQ && webView != null) {
            webView.evaluateJavascript("if((location.hash||'').indexOf('reminders')>-1){window.dispatchEvent(new Event('hashchange'));}", null);
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
    @Override protected void onPause() { if (bannerAd != null) bannerAd.pause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (bannerAd != null) bannerAd.resume(); }
    @Override protected void onDestroy() { if (bannerAd != null) bannerAd.destroy(); super.onDestroy(); }
}
