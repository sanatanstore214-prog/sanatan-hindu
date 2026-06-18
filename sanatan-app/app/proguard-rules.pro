# Keep JavaScript interface methods used by the WebView bridge
-keepclassmembers class com.sanatanhindu.app.** {
    @android.webkit.JavascriptInterface <methods>;
}
