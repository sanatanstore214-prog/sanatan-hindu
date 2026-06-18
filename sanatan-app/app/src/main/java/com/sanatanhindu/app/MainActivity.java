package com.sanatanhindu.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
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
 * Design rule: CONTENT pehle load hota hai, ADS baad me try/catch me — taaki
 * agar ads/Play-services fail bhi ho jaye to app phir bhi normal khule.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "SanatanHindu";

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
    private int navCount = 0;
    private static final int INTERSTITIAL_EVERY = 4;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        adContainer = findViewById(R.id.ad_container);
        webView = findViewById(R.id.webview);

        // ---- 1) Sabse pehle CONTENT load karo (ye kabhi fail nahi hona chahiye) ----
        setupWebView();
        webView.loadUrl("https://appassets.androidx.org/assets/web/index.html");

        // ---- 2) Ads alag se, try/catch me — fail ho to app par koi asar nahi ----
        initAdsSafely();
    }

    private void setupWebView() {
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setBackgroundColor(Color.parseColor("#FFF8EE"));

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
                if ("appassets.androidx.org".equals(url.getHost())) {
                    return false; // internal page -> WebView me hi khole
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url)); // bahari link -> browser
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                // Agar content load na ho to white screen ki jagah message dikhao
                if (request.isForMainFrame()) {
                    String msg = "<html><body style='font-family:sans-serif;text-align:center;"
                            + "padding:40px;background:#FFF8EE;color:#7B241C'>"
                            + "<h2>🚩 सनातन हिन्दू</h2><p>App load nahi ho paya. "
                            + "App band karke dobara kholiye.</p></body></html>";
                    view.loadData(msg, "text/html; charset=utf-8", "UTF-8");
                }
            }
        });
    }

    private void initAdsSafely() {
        try {
            MobileAds.initialize(this, status -> {});
            loadBanner();
            loadInterstitial();
        } catch (Throwable t) {
            Log.w(TAG, "Ads init skipped: " + t.getMessage());
        }
    }

    private void loadBanner() {
        try {
            bannerAd = new AdView(this);
            bannerAd.setAdUnitId(BANNER_AD_UNIT_ID);
            bannerAd.setAdSize(AdSize.BANNER);
            adContainer.removeAllViews();
            adContainer.addView(bannerAd);
            bannerAd.loadAd(new AdRequest.Builder().build());
        } catch (Throwable t) {
            Log.w(TAG, "Banner skipped: " + t.getMessage());
        }
    }

    private void loadInterstitial() {
        try {
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
                                    loadInterstitial();
                                }
                            });
                        }

                        @Override
                        public void onAdFailedToLoad(@NonNull LoadAdError error) {
                            interstitialAd = null;
                        }
                    });
        } catch (Throwable t) {
            Log.w(TAG, "Interstitial skipped: " + t.getMessage());
        }
    }

    private void maybeShowInterstitial() {
        try {
            navCount++;
            if (navCount % INTERSTITIAL_EVERY == 0 && interstitialAd != null) {
                interstitialAd.show(this);
            }
        } catch (Throwable ignored) {
        }
    }

    /** Web app (JavaScript) se Android ko call karne ka bridge. */
    private class AndroidBridge {
        @JavascriptInterface
        public void onNavigate() {
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
