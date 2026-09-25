package com.sanatanhindu.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.WallpaperManager;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Rect;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.PixelCopy;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.os.SystemClock;
import android.util.DisplayMetrics;
import android.webkit.ValueCallback;

import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.view.ViewGroup;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.appopen.AppOpenAd;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

/**
 * Bhakti Daily — WebView host + AdMob + native bridge (reminders, share,
 * notifications, deep-link). Content pehle load hota hai; ads try/catch me,
 * premium/focus me band; reading & launch par kabhi interstitial nahi.
 */
public class MainActivity extends AppCompatActivity {

    private static final String TAG = "BhaktiDaily";
    private static final int NOTIF_PERM_REQ = 1001;
    /** WebViewAssetLoader ka domain. ZAROORI: loader isi domain ki request intercept karta hai —
     *  pehle "appassets.androidx.org" likha tha jo loader ke default se match nahi hota tha, isliye
     *  page kabhi load nahi hota aur har phone par screen khali dikhti thi. Google ka reserved domain
     *  (androidplatform.net) kabhi asli internet par resolve nahi hota — isliye yahi use karo. */
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + ASSET_HOST + "/assets/web/index.html";
    /** Web UI itne der me "ready" na bole to khali screen ki jagah help panel dikhao. */
    private static final long READY_TIMEOUT_MS = 15_000;
    /** Splash kabhi atke nahi: page load ho gaya par ready signal na aaye tab bhi hatao. */
    private static final long REVEAL_AFTER_LOAD_MS = 1_500;
    private static final long REVEAL_HARD_MS = 6_000;

    private WebView webView;
    private FrameLayout adContainer;

    // ---- startup safety (splash overlay, ready handshake, blank-screen self-heal) ----
    private final Handler ui = new Handler(Looper.getMainLooper());
    private View splash, diagPanel;
    private TextView diagInfo;
    private volatile boolean webReady = false;
    private volatile String lastJsError = null;
    private boolean swRender = false;
    private final Runnable readyWatchdog = () -> { if (!webReady) showDiag("timeout"); };
    private final Runnable revealRunnable = this::revealContent;
    private AdView bannerAd;
    private InterstitialAd interstitialAd;
    private int navCount = 0;
    private volatile boolean adsEnabled = true;

    // ---- earning engine state ----
    private volatile RewardedAd rewardedAd;
    private AppOpenAd appOpenAd;
    private long appOpenLoadedAt = 0;          // wall clock
    private long lastFullscreenAt = 0;         // elapsedRealtime
    private long sessionStartAt = 0;           // elapsedRealtime
    private long backgroundedAt = 0;           // elapsedRealtime
    private long lastExternalAt = 0;           // elapsedRealtime
    private volatile boolean showingFullscreen = false;
    private boolean loadingRewarded = false, loadingAppOpen = false;
    private int launchCount = 0;
    private SharedPreferences adPrefs;
    private ConsentInformation consentInformation;
    private final AtomicBoolean adsInitStarted = new AtomicBoolean(false);

    // ---- photo picker (DP maker) ----
    private ValueCallback<Uri[]> fileCallback;
    private ActivityResultLauncher<String> pickImage;
    private String pendingRoute = null;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);   // Android 15/16 enforce edge-to-edge; we pad with insets
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        setupEdgeToEdge();
        setupBackHandling();

        // Photo picker for DP maker (<input type=file> in WebView)
        pickImage = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (fileCallback != null) {
                fileCallback.onReceiveValue(uri != null ? new Uri[]{ uri } : null);
                fileCallback = null;
            }
        });

        pendingRoute = getIntent() != null ? getIntent().getStringExtra("route") : null;

        adContainer = findViewById(R.id.ad_container);
        webView = findViewById(R.id.webview);
        splash = findViewById(R.id.splash);
        diagPanel = findViewById(R.id.diag_panel);
        diagInfo = findViewById(R.id.diag_info);
        setupDiagPanel();
        applyNightAwareColors();

        adPrefs = getSharedPreferences("bhakti_ads", MODE_PRIVATE);
        if (savedInstanceState == null) {
            launchCount = adPrefs.getInt("launch_count", 0) + 1;
            adPrefs.edit().putInt("launch_count", launchCount).apply();
        } else {
            launchCount = adPrefs.getInt("launch_count", 1);
        }
        sessionStartAt = SystemClock.elapsedRealtime();

        ReminderScheduler.createChannel(this);
        setupWebView();
        webView.loadUrl(START_URL);
        armStartupWatchdogs();

        gatherConsentThenInitAds();
        initTts();
        setupAudioListener();
    }

    private boolean isNight() {
        return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
    }
    private int stripColor() { return Color.parseColor(isNight() ? "#1E1711" : "#FFFDF8"); }
    /** WebView/ad-strip ka rang theme ke hisaab se (launch par white/cream flash na ho). */
    private void applyNightAwareColors() {
        int bg = Color.parseColor(isNight() ? "#120C08" : "#FBF3E4");
        if (webView != null) webView.setBackgroundColor(bg);
        if (adContainer != null) adContainer.setBackgroundColor(stripColor());
        View root = findViewById(R.id.root);
        if (root != null) root.setBackgroundColor(stripColor());
    }

    // ---------------- Edge-to-edge (Android 15/16) ----------------
    private void setupEdgeToEdge() {
        final View root = findViewById(R.id.root);
        final View scrim = findViewById(R.id.status_scrim);
        if (root == null) return;
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            if (scrim != null) {
                ViewGroup.LayoutParams lp = scrim.getLayoutParams();
                if (lp.height != bars.top) { lp.height = bars.top; scrim.setLayoutParams(lp); }
            }
            v.setPadding(bars.left, 0, bars.right, Math.max(bars.bottom, ime.bottom));
            // Keyboard khula ho to banner chhupao (text input ke paas ad = galti se click ka risk)
            boolean imeOpen = insets.isVisible(WindowInsetsCompat.Type.ime());
            if (adContainer != null && revealed) adContainer.setVisibility(adsEnabled && !imeOpen && !diagShowing ? View.VISIBLE : View.GONE);
            return WindowInsetsCompat.CONSUMED;
        });
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), root);
        c.setAppearanceLightStatusBars(false);          // white icons on royal maroon
        c.setAppearanceLightNavigationBars(!isNight()); // dark icons on light strip
    }

    /** Splash (royal) -> web UI. WebView hamesha VISIBLE rehta hai (renderer bina ruke paint kare);
     *  sirf upar ka native splash fade hota hai. */
    private boolean revealed = false;
    private boolean diagShowing = false;
    private void revealContent() {
        if (revealed) return;
        revealed = true;
        runOnUiThread(() -> {
            if (splash != null && splash.getVisibility() == View.VISIBLE) {
                splash.animate().cancel();
                splash.animate().alpha(0f).setDuration(240)
                        .withEndAction(() -> splash.setVisibility(View.GONE)).start();
            }
            if (adContainer != null) adContainer.setVisibility(adsEnabled && !diagShowing ? View.VISIBLE : View.GONE);
        });
    }

    // ---------------- Startup safety: ready handshake + help panel ----------------
    private void armStartupWatchdogs() {
        webReady = false;
        ui.removeCallbacks(readyWatchdog);
        ui.removeCallbacks(revealRunnable);
        ui.postDelayed(revealRunnable, REVEAL_HARD_MS);
        ui.postDelayed(readyWatchdog, READY_TIMEOUT_MS);
    }

    /** JS boot poora hua (ok=true) ya boot me error (ok=false, info=error). */
    private void onWebReady(boolean ok, String info) {
        if (!ok) {
            if (info != null && info.length() > 0) lastJsError = info;
            showDiag("boot");
            return;
        }
        webReady = true;
        Log.i(TAG, "web ready in " + (SystemClock.elapsedRealtime() - sessionStartAt) + " ms");
        ui.removeCallbacks(readyWatchdog);
        if (diagShowing) hideDiag();
        if (adPrefs != null) adPrefs.edit().putInt("rp_gone", 0).apply();
        ui.removeCallbacks(revealRunnable);
        ui.postDelayed(revealRunnable, 120);                 // pehla frame paint hone do
        ui.postDelayed(() -> checkRendered(0), 1_800);       // khali render ho to khud theek karo
    }

    private void setupDiagPanel() {
        View b1 = findViewById(R.id.diag_update_webview);
        View b2 = findViewById(R.id.diag_update_chrome);
        View b3 = findViewById(R.id.diag_retry);
        if (b1 != null) b1.setOnClickListener(v -> openStorePage("com.google.android.webview"));
        if (b2 != null) b2.setOnClickListener(v -> openStorePage("com.android.chrome"));
        if (b3 != null) b3.setOnClickListener(v -> retryLoad());
    }

    private void showDiag(String reason) {
        runOnUiThread(() -> {
            if (isFinishing()) return;
            diagShowing = true;
            Log.w(TAG, "startup problem: " + reason + " / " + lastJsError);
            if (diagInfo != null) diagInfo.setText(diagText(reason));
            if (diagPanel != null) diagPanel.setVisibility(View.VISIBLE);
            if (adContainer != null) adContainer.setVisibility(View.GONE);   // error screen par ad nahi
            revealed = true;
            ui.removeCallbacks(revealRunnable);
            if (splash != null) { splash.animate().cancel(); splash.setVisibility(View.GONE); }
        });
    }
    private void hideDiag() {
        diagShowing = false;
        if (diagPanel != null) diagPanel.setVisibility(View.GONE);
        if (adContainer != null && revealed) adContainer.setVisibility(adsEnabled ? View.VISIBLE : View.GONE);
    }
    private void retryLoad() {
        hideDiag();
        lastJsError = null;
        if (webView == null) { recreate(); return; }      // renderer gaya tha: naya WebView
        revealed = false;
        if (splash != null) { splash.setAlpha(1f); splash.setVisibility(View.VISIBLE); }
        webView.loadUrl(START_URL);
        armStartupWatchdogs();
    }
    private void openStorePage(String pkg) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + pkg))); }
        catch (Throwable t) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + pkg))); }
            catch (Throwable ignored) {}
        }
    }
    /** WebView provider + version, jaise "com.google.android.webview 74.0.3729.185". */
    private String webViewVersion() {
        try {
            PackageInfo pi = WebViewCompat.getCurrentWebViewPackage(this);
            if (pi != null) return pi.packageName + " " + pi.versionName;
        } catch (Throwable ignored) {}
        return "unknown";
    }
    private String diagText(String reason) {
        String ver = "?";
        try { ver = getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Throwable ignored) {}
        return "Bhakti Daily " + ver + " · Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")\n"
                + Build.MANUFACTURER + " " + Build.MODEL + "\n"
                + "WebView: " + webViewVersion() + (swRender ? " [sw]" : "") + "\n"
                + "Reason: " + reason + (lastJsError != null ? "\nError: " + lastJsError : "");
    }

    // ---- Blank-screen self-heal: page "ready" hai par screen par kuch nahi bana (GPU/driver) ----
    // PixelCopy se WebView ka chhota snapshot lo. Stage 0: khali mile to thoda ruk kar dobara dekho
    // (dheema phone). Stage 1: ab bhi khali -> software rendering (isi WebView version ke liye yaad).
    // Stage 2: tab bhi khali -> help panel.
    private void checkRendered(final int stage) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || webView == null || !webReady || diagShowing || isFinishing()) return;
        final int w = webView.getWidth(), h = webView.getHeight();
        if (w < 60 || h < 60) return;
        int[] loc = new int[2];
        webView.getLocationInWindow(loc);
        final Bitmap bmp = Bitmap.createBitmap(27, 48, Bitmap.Config.ARGB_8888);
        try {
            PixelCopy.request(getWindow(), new Rect(loc[0], loc[1], loc[0] + w, loc[1] + h), bmp, result -> {
                boolean blank = result == PixelCopy.SUCCESS && isUniform(bmp);
                bmp.recycle();
                if (!blank) return;
                if (stage == 0) {
                    ui.postDelayed(() -> checkRendered(1), 2_500);
                } else if (stage == 1 && !swRender) {
                    Log.w(TAG, "blank render detected -> software layer");
                    swRender = true;
                    if (adPrefs != null) adPrefs.edit().putString("sw_render_for", webViewVersion()).apply();
                    if (webView != null) { webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null); webView.invalidate(); }
                    ui.postDelayed(() -> checkRendered(2), 1_500);
                } else {
                    lastJsError = "blank render";
                    showDiag("blank");
                }
            }, ui);
        } catch (Throwable t) { Log.w(TAG, "pixelcopy: " + t.getMessage()); }
    }
    private static boolean isUniform(Bitmap b) {
        int minR = 255, minG = 255, minB = 255, maxR = 0, maxG = 0, maxB = 0;
        for (int y = 0; y < b.getHeight(); y++) {
            for (int x = 0; x < b.getWidth(); x++) {
                int c = b.getPixel(x, y);
                int r = Color.red(c), g = Color.green(c), bl = Color.blue(c);
                if (r < minR) minR = r; if (r > maxR) maxR = r;
                if (g < minG) minG = g; if (g > maxG) maxG = g;
                if (bl < minB) minB = bl; if (bl > maxB) maxB = bl;
            }
        }
        return (maxR - minR) < 14 && (maxG - minG) < 14 && (maxB - minB) < 14;
    }

    // ---------------- Back (predictive back, Android 16) ----------------
    // Pehle web modal band karo, phir web history, phir app band.
    private void setupBackHandling() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (webView == null) { finish(); return; }
                webView.evaluateJavascript("(window.__onBack&&window.__onBack())?'1':'0'", value -> {
                    if (value != null && value.contains("1")) return;          // modal closed in JS
                    if (webView.canGoBack()) webView.goBack();
                    else finish();
                });
            }
        });
    }

    // Kisi bhi bahari app (WhatsApp/share/browser/Play) par jaane ka samay yaad rakho
    // taaki lautne par turant app-open ad na dikhe.
    @Override public void startActivity(Intent intent) {
        lastExternalAt = SystemClock.elapsedRealtime();
        super.startActivity(intent);
    }
    @Override public void startActivity(Intent intent, Bundle options) {
        lastExternalAt = SystemClock.elapsedRealtime();
        super.startActivity(intent, options);
    }

    private void setupAudioListener() {
        AudioService.listener = new AudioService.Listener() {
            @Override public void onState(String state, int pos, int dur, String title) {
                if (webView == null) return;
                final String js = "window.__audio&&window.__audio('" + state + "'," + pos + "," + dur + "," + JSONObject.quote(title) + ")";
                runOnUiThread(() -> { try { webView.evaluateJavascript(js, null); } catch (Throwable ignored) {} });
            }
        };
    }
    private void sendAudio(String action, String src, String title, int pos) {
        try {
            Intent i = new Intent(this, AudioService.class).setAction(action);
            if (src != null) i.putExtra("src", src);
            if (title != null) i.putExtra("title", title);
            i.putExtra("pos", pos);
            if (AudioService.A_PLAY.equals(action)) ContextCompat.startForegroundService(this, i);
            else startService(i);
        } catch (Throwable t) { Log.w(TAG, "audio svc: " + t.getMessage()); }
    }

    private void initTts() {
        try {
            tts = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
                @Override public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS && tts != null) {
                        try { tts.setLanguage(new Locale("hi", "IN")); } catch (Throwable ignored) {}
                        ttsReady = true;
                        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                            @Override public void onStart(String id) {}
                            @Override public void onDone(String id) { notifyTtsDone(); }
                            @Override public void onError(String id) { notifyTtsDone(); }
                        });
                    }
                }
            });
        } catch (Throwable t) { Log.w(TAG, "tts init: " + t.getMessage()); }
    }
    private void notifyTtsDone() {
        if (webView == null) return;
        runOnUiThread(() -> { try { webView.evaluateJavascript("window.__ttsDone&&window.__ttsDone()", null); } catch (Throwable ignored) {} });
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
                .setDomain(ASSET_HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        applyNightAwareColors();
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);
        // Isi WebView version par pehle khali render mila tha -> seedha software rendering
        if (adPrefs != null && webViewVersion().equals(adPrefs.getString("sw_render_for", ""))) {
            swRender = true;
            webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        webView.setWebChromeClient(new WebChromeClient() {
            // <input type="file" accept="image/*"> -> system photo picker (DP maker)
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    lastExternalAt = SystemClock.elapsedRealtime();
                    pickImage.launch("image/*");
                    return true;
                } catch (Throwable t) {
                    Log.w(TAG, "file chooser: " + t.getMessage());
                    fileCallback = null;
                    return false;
                }
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse r = assetLoader.shouldInterceptRequest(request.getUrl());
                if (r == null && ASSET_HOST.equals(request.getUrl().getHost())) Log.w(TAG, "asset not intercepted: " + request.getUrl());
                return r;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                // Asli reveal JS ke "ready" par hota hai; yeh sirf safety net hai.
                if (!webReady && !revealed) {
                    ui.removeCallbacks(revealRunnable);
                    ui.postDelayed(revealRunnable, REVEAL_AFTER_LOAD_MS);
                }
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (ASSET_HOST.equals(url.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, url)); } catch (Exception ignored) {}
                return true;
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                // (Pehle loadData() se error page banta tha — "#" wale rang ke kaaran woh khud khali dikhta tha.)
                if (req.isForMainFrame()) {
                    lastJsError = "load " + err.getErrorCode() + " " + err.getDescription();
                    showDiag("load");
                }
            }
            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest req, WebResourceResponse resp) {
                if (req.isForMainFrame()) {
                    lastJsError = "http " + resp.getStatusCode() + " " + req.getUrl().getPath();
                    showDiag("load");
                }
            }
            /** WebView renderer crash/kill par app band ya khali na ho: ek baar khud recreate, phir help panel. */
            @Override
            public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                boolean crashed = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && detail != null && detail.didCrash();
                lastJsError = crashed ? "renderer crashed" : "renderer killed (low memory)";
                Log.w(TAG, lastJsError);
                if (view == webView) {
                    ViewGroup p = (ViewGroup) view.getParent();
                    if (p != null) p.removeView(view);
                    try { view.destroy(); } catch (Throwable ignored) {}
                    webView = null;
                }
                int n = adPrefs != null ? adPrefs.getInt("rp_gone", 0) + 1 : 1;
                if (adPrefs != null) adPrefs.edit().putInt("rp_gone", n).apply();
                if (n <= 1) ui.post(MainActivity.this::recreate);
                else showDiag("renderer");
                return true;
            }
        });
    }

    // ---------------- Consent (UMP) -> Ads ----------------
    /** Google UMP: EEA/UK users ko consent form; India me aam taur par form nahi dikhta. */
    private void gatherConsentThenInitAds() {
        try {
            consentInformation = UserMessagingPlatform.getConsentInformation(this);
            ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
            consentInformation.requestConsentInfoUpdate(this, params,
                    () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, formError -> {
                        if (formError != null) Log.w(TAG, "consent form: " + formError.getMessage());
                        if (consentInformation.canRequestAds()) initAdsSafely();
                    }),
                    requestError -> {
                        Log.w(TAG, "consent update: " + requestError.getMessage());
                        if (consentInformation.canRequestAds()) initAdsSafely();
                    });
            // Pichhle session me consent mil chuka ho to turant shuru
            if (consentInformation.canRequestAds()) initAdsSafely();
        } catch (Throwable t) {
            Log.w(TAG, "ump skipped: " + t.getMessage());
            initAdsSafely();
        }
    }

    private void initAdsSafely() {
        if (!adsInitStarted.compareAndSet(false, true)) return;
        // Google guidance: initialize off the main thread (ANR se bachao)
        new Thread(() -> {
            try {
                MobileAds.initialize(this, st -> runOnUiThread(() -> {
                    loadBanner();
                    loadInterstitial();
                    loadRewarded();
                    loadAppOpen();
                }));
            } catch (Throwable t) { Log.w(TAG, "ads init skipped: " + t.getMessage()); }
        }).start();
    }
    private boolean canServe() { return adsInitStarted.get(); }

    private void logAdEvent(String kind, String ev) {
        if (webView == null) return;
        final String js = "window.Analytics&&Analytics.track('ad_" + ev + "',{kind:'" + kind + "'})";
        runOnUiThread(() -> { try { webView.evaluateJavascript(js, null); } catch (Throwable ignored) {} });
    }

    /** Full-screen ads (interstitial / app-open) ka common state + reload. */
    private FullScreenContentCallback fullscreenCallback(final String kind, final Runnable reload) {
        return new FullScreenContentCallback() {
            @Override public void onAdShowedFullScreenContent() {
                showingFullscreen = true;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                logAdEvent(kind, "show");
            }
            @Override public void onAdDismissedFullScreenContent() {
                showingFullscreen = false;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                if (reload != null) reload.run();
            }
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError e) {
                showingFullscreen = false;
                if (reload != null) reload.run();
            }
        };
    }

    // ---- Banner: adaptive anchored (fixed 320x50 se zyada fill + eCPM) ----
    private AdSize adaptiveBannerSize() {
        DisplayMetrics m = getResources().getDisplayMetrics();
        int w = (adContainer != null && adContainer.getWidth() > 0) ? adContainer.getWidth() : m.widthPixels;
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, (int) (w / m.density));
    }
    private void loadBanner() {
        try {
            if (!adsEnabled || !canServe() || adContainer == null) return;
            if (bannerAd != null) { bannerAd.destroy(); bannerAd = null; }
            bannerAd = new AdView(this);
            bannerAd.setAdUnitId(AdConfig.BANNER_AD_UNIT_ID);
            bannerAd.setAdSize(adaptiveBannerSize());
            adContainer.removeAllViews();
            adContainer.addView(bannerAd);
            bannerAd.loadAd(new AdRequest.Builder().build());
        } catch (Throwable t) { Log.w(TAG, "banner skipped: " + t.getMessage()); }
    }

    // ---- Interstitial: sirf natural break par (paath khatam, mala poori), pace ke saath ----
    private void loadInterstitial() {
        try {
            if (!canServe()) return;
            InterstitialAd.load(this, AdConfig.INTERSTITIAL_AD_UNIT_ID, new AdRequest.Builder().build(),
                    new InterstitialAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull InterstitialAd ad) { interstitialAd = ad; }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { interstitialAd = null; }
                    });
        } catch (Throwable t) { Log.w(TAG, "interstitial skipped: " + t.getMessage()); }
    }
    /** force=true: break-count ki shart chhodo; time-gap aur session-grace hamesha lagu. */
    private void maybeShowInterstitial(boolean force) {
        try {
            if (!adsEnabled || showingFullscreen || !canServe()) return;
            navCount++;
            long now = SystemClock.elapsedRealtime();
            if (now - sessionStartAt < AdConfig.INTERSTITIAL_SESSION_GRACE_MS) return;
            if (lastFullscreenAt > 0 && now - lastFullscreenAt < AdConfig.INTERSTITIAL_MIN_GAP_MS) return;
            if (!force && navCount < AdConfig.INTERSTITIAL_EVERY) return;
            final InterstitialAd ad = interstitialAd;
            if (ad == null) { loadInterstitial(); return; }
            navCount = 0;
            interstitialAd = null;
            ad.setFullScreenContentCallback(fullscreenCallback("inter", this::loadInterstitial));
            showingFullscreen = true;
            ad.show(this);
        } catch (Throwable t) { showingFullscreen = false; Log.w(TAG, "inter show: " + t.getMessage()); }
    }

    // ---- Rewarded: sirf user ke tap par; inaam app ke andar (virtual, kabhi paisa nahi) ----
    private void loadRewarded() {
        try {
            if (!canServe() || loadingRewarded || rewardedAd != null) return;
            loadingRewarded = true;
            RewardedAd.load(this, AdConfig.REWARDED_AD_UNIT_ID, new AdRequest.Builder().build(),
                    new RewardedAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull RewardedAd ad) { rewardedAd = ad; loadingRewarded = false; }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { rewardedAd = null; loadingRewarded = false; }
                    });
        } catch (Throwable t) { loadingRewarded = false; Log.w(TAG, "rewarded load: " + t.getMessage()); }
    }
    private void showRewardedNow(final String tag) {
        final RewardedAd ad = rewardedAd;
        if (ad == null || showingFullscreen) { sendReward(tag, false, "not_ready"); loadRewarded(); return; }
        rewardedAd = null;
        final boolean[] earned = { false };
        final boolean[] reported = { false };
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override public void onAdShowedFullScreenContent() {
                showingFullscreen = true;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                logAdEvent("rewarded", "show");
            }
            @Override public void onAdDismissedFullScreenContent() {
                showingFullscreen = false;
                lastFullscreenAt = SystemClock.elapsedRealtime();
                if (!reported[0]) { reported[0] = true; sendReward(tag, earned[0], earned[0] ? "ok" : "closed"); }
                loadRewarded();
            }
            @Override public void onAdFailedToShowFullScreenContent(@NonNull AdError e) {
                showingFullscreen = false;
                if (!reported[0]) { reported[0] = true; sendReward(tag, false, "fail"); }
                loadRewarded();
            }
        });
        try {
            showingFullscreen = true;
            ad.show(this, rewardItem -> earned[0] = true);
        } catch (Throwable t) {
            showingFullscreen = false;
            if (!reported[0]) { reported[0] = true; sendReward(tag, false, "fail"); }
        }
    }
    private void sendReward(String tag, boolean ok, String reason) {
        if (webView == null) return;
        final String js = "window.__reward&&window.__reward(" + JSONObject.quote(tag) + "," + ok + "," + JSONObject.quote(reason) + ")";
        runOnUiThread(() -> { try { webView.evaluateJavascript(js, null); } catch (Throwable ignored) {} });
    }

    // ---- App open: sirf app me LAUTNE par (cold start par nahi), pace + 4h expiry ----
    private boolean isAppOpenFresh() {
        return appOpenAd != null && System.currentTimeMillis() - appOpenLoadedAt < AdConfig.APP_OPEN_EXPIRY_MS;
    }
    private void loadAppOpen() {
        try {
            if (!canServe() || loadingAppOpen || isAppOpenFresh()) return;
            loadingAppOpen = true;
            AppOpenAd.load(this, AdConfig.APP_OPEN_AD_UNIT_ID, new AdRequest.Builder().build(),
                    new AppOpenAd.AppOpenAdLoadCallback() {
                        @Override public void onAdLoaded(@NonNull AppOpenAd ad) {
                            appOpenAd = ad; appOpenLoadedAt = System.currentTimeMillis(); loadingAppOpen = false;
                        }
                        @Override public void onAdFailedToLoad(@NonNull LoadAdError e) { appOpenAd = null; loadingAppOpen = false; }
                    });
        } catch (Throwable t) { loadingAppOpen = false; Log.w(TAG, "appopen load: " + t.getMessage()); }
    }
    private void maybeShowAppOpen() {
        try {
            if (!adsEnabled || showingFullscreen || !canServe()) return;
            if (launchCount <= AdConfig.APP_OPEN_SKIP_FIRST_LAUNCHES) return;
            long now = SystemClock.elapsedRealtime();
            if (lastExternalAt > 0 && now - lastExternalAt < AdConfig.APP_OPEN_AFTER_EXTERNAL_MS) return;
            // Policy: kabhi doosre full-screen ad ke turant baad nahi
            if (lastFullscreenAt > 0 && now - lastFullscreenAt < AdConfig.INTERSTITIAL_MIN_GAP_MS) return;
            if (System.currentTimeMillis() - adPrefs.getLong("appopen_last", 0) < AdConfig.APP_OPEN_MIN_GAP_MS) return;
            if (!isAppOpenFresh()) { appOpenAd = null; loadAppOpen(); return; }
            final AppOpenAd ad = appOpenAd;
            appOpenAd = null;
            ad.setFullScreenContentCallback(fullscreenCallback("appopen", this::loadAppOpen));
            adPrefs.edit().putLong("appopen_last", System.currentTimeMillis()).apply();
            showingFullscreen = true;
            ad.show(this);
        } catch (Throwable t) { showingFullscreen = false; Log.w(TAG, "appopen show: " + t.getMessage()); }
    }

    // ---------------- JS bridge ----------------
    private class AndroidBridge {
        /** Web UI boot ho gaya (ok) ya boot me error aaya (ok=false, info=error text). */
        @JavascriptInterface public void appReady(final boolean ok, final String info) {
            ui.post(() -> onWebReady(ok, info));
        }
        /** window.onerror se aaye JS errors (help panel me dikhane ke liye). */
        @JavascriptInterface public void reportError(String msg) {
            if (msg == null) return;
            Log.w(TAG, "js: " + msg);
            lastJsError = msg.length() > 300 ? msg.substring(0, 300) : msg;
        }
        /** Natural break (tab/screen badla) — har 3rd break par, time-gap ke saath. */
        @JavascriptInterface public void onNavigate() { runOnUiThread(() -> maybeShowInterstitial(false)); }
        /** Bada natural break (paath poora padha / mala poori) — count shart nahi, gap lagu. */
        @JavascriptInterface public void showInterstitial() { runOnUiThread(() -> maybeShowInterstitial(true)); }

        // ---- Rewarded (user-initiated) ----
        @JavascriptInterface public boolean isRewardedReady() { return rewardedAd != null; }
        @JavascriptInterface public void preloadRewarded() { runOnUiThread(MainActivity.this::loadRewarded); }
        @JavascriptInterface public void showRewarded(final String tag) {
            runOnUiThread(() -> showRewardedNow(tag == null ? "" : tag));
        }

        // ---- Privacy (UMP) — EEA/UK users ke liye settings me entry ----
        @JavascriptInterface public boolean isPrivacyOptionsRequired() {
            try {
                return consentInformation != null && consentInformation.getPrivacyOptionsRequirementStatus()
                        == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
            } catch (Throwable t) { return false; }
        }
        @JavascriptInterface public void showPrivacyOptions() {
            runOnUiThread(() -> {
                try { UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, e -> {}); }
                catch (Throwable ignored) {}
            });
        }
        @JavascriptInterface public void setAdsEnabled(final boolean on) {
            runOnUiThread(() -> {
                adsEnabled = on;
                if (adContainer != null && revealed) adContainer.setVisibility(on && !diagShowing ? View.VISIBLE : View.GONE);
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
        @JavascriptInterface public void shareWhatsApp(final String b64, final String caption) {
            runOnUiThread(() -> {
                try {
                    byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                    File dir = new File(getCacheDir(), "shared_images");
                    if (!dir.exists()) dir.mkdirs();
                    File f = new File(dir, "bhakti_blessing.png");
                    FileOutputStream fos = new FileOutputStream(f); fos.write(bytes); fos.close();
                    Uri uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", f);
                    Intent i = new Intent(Intent.ACTION_SEND);
                    i.setType("image/png");
                    i.putExtra(Intent.EXTRA_STREAM, uri);
                    if (caption != null) i.putExtra(Intent.EXTRA_TEXT, caption);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    String[] pkgs = { "com.whatsapp", "com.whatsapp.w4b" };
                    for (String p : pkgs) {
                        Intent w = new Intent(i); w.setPackage(p);
                        if (w.resolveActivity(getPackageManager()) != null) { startActivity(w); return; }
                    }
                    startActivity(Intent.createChooser(i, "शेयर करें"));
                } catch (Throwable t) { Log.w(TAG, "shareWhatsApp: " + t.getMessage()); }
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
        @JavascriptInterface public void speak(String text) {
            try {
                if (!ttsReady || tts == null || text == null) return;
                String t = text.length() > 3900 ? text.substring(0, 3900) : text;
                tts.speak(t, TextToSpeech.QUEUE_FLUSH, null, "bhakti");
            } catch (Throwable ignored) {}
        }
        @JavascriptInterface public void stopSpeak() {
            try { if (tts != null) tts.stop(); } catch (Throwable ignored) {}
        }
        @JavascriptInterface public void audioPlay(String src, String title) {
            String s = (src == null) ? null : (src.startsWith("http") ? src : "web/audio/" + src);
            sendAudio(AudioService.A_PLAY, s, title, 0);
        }
        @JavascriptInterface public void audioPause() { sendAudio(AudioService.A_PAUSE, null, null, 0); }
        @JavascriptInterface public void audioResume() { sendAudio(AudioService.A_RESUME, null, null, 0); }
        @JavascriptInterface public void audioSeek(int pos) { sendAudio(AudioService.A_SEEK, null, null, pos); }
        @JavascriptInterface public void audioStop() { sendAudio(AudioService.A_STOP, null, null, 0); }
        @JavascriptInterface public void openUrl(String url) {
            runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Throwable t) { Log.w(TAG, "openUrl: " + t.getMessage()); } });
        }

        // Native HTTP for Group Jaap (Firestore REST) — avoids WebView CORS.
        // Runs on a background thread, calls back window.__http(reqId, status, responseText).
        @JavascriptInterface public void httpRequest(final String reqId, final String method,
                                                     final String url, final String body) {
            new Thread(new Runnable() { public void run() {
                int code = 0; String resp = "";
                HttpURLConnection conn = null;
                try {
                    conn = (HttpURLConnection) new URL(url).openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(20000);
                    conn.setRequestMethod(method == null ? "GET" : method);
                    conn.setRequestProperty("Accept", "application/json");
                    if (body != null && body.length() > 0) {
                        conn.setDoOutput(true);
                        conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                        byte[] out = body.getBytes("UTF-8");
                        OutputStream os = conn.getOutputStream();
                        os.write(out); os.flush(); os.close();
                    }
                    code = conn.getResponseCode();
                    InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
                    if (is != null) {
                        BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
                        StringBuilder sb = new StringBuilder(); String line;
                        while ((line = br.readLine()) != null) sb.append(line);
                        br.close();
                        resp = sb.toString();
                    }
                } catch (Throwable t) {
                    Log.w(TAG, "httpRequest: " + t.getMessage());
                    if (code == 0) code = -1;
                    if (resp == null || resp.length() == 0) resp = "{\"__err\":" + JSONObject.quote(String.valueOf(t.getMessage())) + "}";
                } finally {
                    if (conn != null) try { conn.disconnect(); } catch (Throwable ignore) {}
                }
                final int fCode = code; final String fResp = resp;
                runOnUiThread(new Runnable() { public void run() {
                    if (webView == null) return;
                    String js = "if(window.__http)window.__http(" + JSONObject.quote(reqId) + ","
                        + fCode + "," + JSONObject.quote(fResp) + ");";
                    webView.evaluateJavascript(js, null);
                }});
            }}).start();
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, @NonNull String[] perms, @NonNull int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == NOTIF_PERM_REQ && webView != null) {
            webView.evaluateJavascript("if((location.hash||'').indexOf('reminders')>-1){window.dispatchEvent(new Event('hashchange'));}", null);
        }
    }

    @Override protected void onPause() { if (bannerAd != null) bannerAd.pause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (bannerAd != null) bannerAd.resume(); }

    // App-open ad: user ghar/doosre app se ≥30s baad lauta ho tab (caps AdConfig me)
    @Override protected void onStart() {
        super.onStart();
        if (backgroundedAt > 0) {
            long away = SystemClock.elapsedRealtime() - backgroundedAt;
            backgroundedAt = 0;
            if (away >= AdConfig.APP_OPEN_MIN_BACKGROUND_MS) maybeShowAppOpen();
        }
    }
    @Override protected void onStop() {
        // Hamare hi full-screen ad ke kaaran stop hua ho to use 'background jaana' mat maano
        if (!showingFullscreen) backgroundedAt = SystemClock.elapsedRealtime();
        super.onStop();
    }

    @Override protected void onDestroy() {
        ui.removeCallbacksAndMessages(null);
        if (fileCallback != null) { try { fileCallback.onReceiveValue(null); } catch (Throwable ignored) {} fileCallback = null; }
        if (bannerAd != null) bannerAd.destroy();
        try { if (tts != null) { tts.stop(); tts.shutdown(); } } catch (Throwable ignored) {}
        AudioService.listener = null;
        super.onDestroy();
    }
}
