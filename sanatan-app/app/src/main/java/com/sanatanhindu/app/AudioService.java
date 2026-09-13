package com.sanatanhindu.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

/**
 * Bhakti Daily — background audio (aarti/bhajan/mantra).
 * MediaPlayer + MediaSession + foreground MediaStyle notification + audio focus.
 * Screen off / app background me bhi chalta hai; lockscreen par controls dikhte hain.
 * Audio source: "http(s)://..." stream, ya bundled asset path (e.g. web/audio/x.mp3).
 */
public class AudioService extends Service {
    private static final String TAG = "BhaktiAudio";
    private static final String CH = "bhakti_audio";
    private static final int NID = 7788;

    public static final String A_PLAY = "PLAY", A_PAUSE = "PAUSE", A_RESUME = "RESUME", A_STOP = "STOP", A_SEEK = "SEEK";

    public interface Listener { void onState(String state, int pos, int dur, String title); }
    public static Listener listener; // set by MainActivity while visible

    private MediaPlayer mp;
    private MediaSessionCompat session;
    private AudioManager am;
    private AudioFocusRequest focusReq;
    private AssetFileDescriptor afd;
    private String title = "";
    private boolean prepared = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable ticker;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
        am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        session = new MediaSessionCompat(this, "BhaktiAudio");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { resume(); }
            @Override public void onPause() { pause(); }
            @Override public void onStop() { stopAll(); }
            @Override public void onSeekTo(long p) { seek((int) p); }
        });
        try { session.setActive(true); } catch (Throwable ignored) {}
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) return START_NOT_STICKY;
        switch (intent.getAction()) {
            case A_PLAY: play(intent.getStringExtra("src"), intent.getStringExtra("title")); break;
            case A_PAUSE: pause(); break;
            case A_RESUME: resume(); break;
            case A_STOP: stopAll(); break;
            case A_SEEK: seek(intent.getIntExtra("pos", 0)); break;
        }
        return START_NOT_STICKY;
    }

    private void play(String src, String t) {
        if (src == null) return;
        title = t == null ? "भक्ति" : t;
        try {
            prepared = false;
            if (mp == null) {
                mp = new MediaPlayer();
                mp.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
                mp.setOnPreparedListener(m -> { requestFocus(); m.start(); prepared = true; startForegroundNotif(true); startTicker(); emit("playing"); });
                mp.setOnCompletionListener(m -> { emit("ended"); stopTicker(); ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH); updateNotif(false); });
                mp.setOnErrorListener((m, w, e) -> { Log.w(TAG, "err " + w + "/" + e); emit("error"); return true; });
            } else { mp.reset(); }
            closeAfd();
            if (src.startsWith("http")) {
                mp.setDataSource(src);
            } else {
                afd = getAssets().openFd(src); // e.g. web/audio/sample-om.wav
                mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            }
            mp.prepareAsync();
            emit("loading");
        } catch (Throwable e) { Log.w(TAG, "play: " + e.getMessage()); emit("error"); }
    }

    private void resume() { try { if (mp != null && prepared && !mp.isPlaying()) { requestFocus(); mp.start(); startForegroundNotif(true); startTicker(); emit("playing"); } } catch (Throwable ignored) {} }
    private void pause() { try { if (mp != null && mp.isPlaying()) { mp.pause(); stopTicker(); updateNotif(false); emit("paused"); ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_DETACH); } } catch (Throwable ignored) {} }
    private void seek(int pos) { try { if (mp != null && prepared) { mp.seekTo(pos); emit(mp.isPlaying() ? "playing" : "paused"); } } catch (Throwable ignored) {} }
    private void stopAll() {
        try { stopTicker(); if (mp != null) { mp.stop(); mp.reset(); mp.release(); mp = null; } } catch (Throwable ignored) {}
        closeAfd(); abandonFocus(); prepared = false; emit("stopped");
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private void emit(String state) {
        int pos = 0, dur = 0;
        try { if (mp != null && prepared) { pos = mp.getCurrentPosition(); dur = mp.getDuration(); } } catch (Throwable ignored) {}
        updateSession(state, pos, dur);
        if (listener != null) { try { listener.onState(state, pos, dur, title); } catch (Throwable ignored) {} }
    }

    private void startTicker() {
        stopTicker();
        ticker = new Runnable() { public void run() { emit("playing"); handler.postDelayed(this, 800); } };
        handler.postDelayed(ticker, 800);
    }
    private void stopTicker() { if (ticker != null) handler.removeCallbacks(ticker); ticker = null; }

    // ---- audio focus ----
    private final AudioManager.OnAudioFocusChangeListener focusListener = f -> {
        if (f == AudioManager.AUDIOFOCUS_LOSS || f == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) pause();
    };
    private void requestFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusReq = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                        .setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build())
                        .setOnAudioFocusChangeListener(focusListener).build();
                am.requestAudioFocus(focusReq);
            } else { am.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN); }
        } catch (Throwable ignored) {}
    }
    private void abandonFocus() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) { if (focusReq != null) am.abandonAudioFocusRequest(focusReq); }
            else am.abandonAudioFocus(focusListener);
        } catch (Throwable ignored) {}
    }

    private void closeAfd() { try { if (afd != null) { afd.close(); afd = null; } } catch (Throwable ignored) {} }

    // ---- notification / session ----
    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CH) == null) {
                NotificationChannel c = new NotificationChannel(CH, "भक्ति ऑडियो", NotificationManager.IMPORTANCE_LOW);
                c.setShowBadge(false); nm.createNotificationChannel(c);
            }
        }
    }
    private PendingIntent svc(String action) {
        Intent i = new Intent(this, AudioService.class).setAction(action);
        return PendingIntent.getService(this, action.hashCode() & 0xffff, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private Notification buildNotif(boolean playing) {
        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentPI = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CH)
                .setSmallIcon(R.drawable.ic_stat_bhakti)
                .setContentTitle(title).setContentText("🚩 Bhakti Daily")
                .setContentIntent(contentPI).setOnlyAlertOnce(true).setOngoing(playing)
                .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        playing ? "Pause" : "Play", svc(playing ? A_PAUSE : A_RESUME))
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", svc(A_STOP))
                .setStyle(new MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1));
        return b.build();
    }
    private void startForegroundNotif(boolean playing) {
        try {
            int type = Build.VERSION.SDK_INT >= 29 ? android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0;
            ServiceCompat.startForeground(this, NID, buildNotif(playing), type);
        } catch (Throwable t) { Log.w(TAG, "fg: " + t.getMessage()); }
    }
    private void updateNotif(boolean playing) {
        try { NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE); if (nm != null) nm.notify(NID, buildNotif(playing)); } catch (Throwable ignored) {}
    }
    private void updateSession(String state, int pos, int dur) {
        try {
            int st = "playing".equals(state) ? PlaybackStateCompat.STATE_PLAYING
                    : ("paused".equals(state) ? PlaybackStateCompat.STATE_PAUSED : PlaybackStateCompat.STATE_STOPPED);
            session.setPlaybackState(new PlaybackStateCompat.Builder()
                    .setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SEEK_TO | PlaybackStateCompat.ACTION_STOP)
                    .setState(st, pos, 1f).build());
        } catch (Throwable ignored) {}
    }

    @Override public void onDestroy() {
        stopTicker();
        try { if (mp != null) { mp.release(); mp = null; } } catch (Throwable ignored) {}
        closeAfd(); abandonFocus();
        try { if (session != null) session.release(); } catch (Throwable ignored) {}
        super.onDestroy();
    }
}
