package com.sanatanhindu.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

/**
 * Sanatan Hindu — offline devotional app (Aarti, Chalisa, Mantra, Vrat calendar)
 * wrapped in a WebView, monetised with Google AdMob (banner + interstitial).
 *
 * Saara content app ke andar offline hai. Internet sirf ads load karne ke
 * liye use hota hai — agar net na ho to app phir bhi chalta hai, bas ad
 * nahi dikhta.
 */
public class MainActivity extends AppCompatActivity {

    // ================================================================
    // AD UNIT IDs — abhi GOOGLE ke OFFICIAL TEST IDs lage hain (safe).
    // Apna paisa kamane ke liye apne real Ad Unit IDs yahan dalo:
    //   AdMob -> apni app -> "Ad units" -> Banner & Interstitial banao.
    // WARNING: apni real IDs lagne ke baad APNE phone se ad MAT click karo.
    // ================================================================
    private static final String BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111";
    private static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";

    private WebView webView;
    private FrameLayout adContainer;
    private AdView bannerAd;
    private InterstitialAd interstitialAd;
    // Har kuch screen-change ke baad hi full-screen ad dikhao (annoying na ho)
    private int navCount = 0;
    private static final int INTERSTITIAL_EVERY = 4;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // AdMob initialise (background thread me hota hai)
        MobileAds.initialize(this, initializationStatus -> {});

        adContainer = findViewById(R.id.ad_container);
        webView = findViewById(R.id.webview);

        setupWebView();
        loadBanner();
        loadInterstitial();

        // Local assets ko https://appassets.androidx.org/ se serve karo
        webView.loadUrl("https://appassets.androidx.org/assets/web/index.html");
    }

    private void setupWebView() {
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

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
                // Internal app pages -> WebView me hi khulein
                if ("appassets.androidx.org".equals(url.getHost())) {
                    return false;
                }
                // Bahari link (website, WhatsApp, store) -> browser me khulein
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                }
                return true;
            }
        });
    }

    private void loadBanner() {
        bannerAd = new AdView(this);
        bannerAd.setAdUnitId(BANNER_AD_UNIT_ID);
        bannerAd.setAdSize(AdSize.BANNER);
        adContainer.removeAllViews();
        adContainer.addView(bannerAd);
        bannerAd.loadAd(new AdRequest.Builder().build());
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, INTERSTITIAL_AD_UNIT_ID,
                new AdRequest.Builder().build(),
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd ad) {
                        interstitialAd = ad;
                        interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                interstitialAd = null;
                                loadInterstitial(); // agla ad pehle se taiyaar rakho
                            }
                        });
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        interstitialAd = null;
                    }
                });
    }

    private void maybeShowInterstitial() {
        navCount++;
        if (navCount % INTERSTITIAL_EVERY == 0 && interstitialAd != null) {
            interstitialAd.show(this);
        }
    }

    /** Web app (JavaScript) se Android ko call karne ka bridge. */
    private class AndroidBridge {
        @JavascriptInterface
        public void onNavigate() {
            // JS thread se UI thread par switch
            runOnUiThread(MainActivity.this::maybeShowInterstitial);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        if (bannerAd != null) bannerAd.pause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bannerAd != null) bannerAd.resume();
    }

    @Override
    protected void onDestroy() {
        if (bannerAd != null) bannerAd.destroy();
        super.onDestroy();
    }
}
