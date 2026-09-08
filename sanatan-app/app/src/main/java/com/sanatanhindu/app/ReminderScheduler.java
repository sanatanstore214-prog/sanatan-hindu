package com.sanatanhindu.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Bhakti Daily — daily reminder scheduling via AlarmManager.
 *
 * Design: koi SCHEDULE_EXACT_ALARM permission nahi (Play-safe). Har alarm
 * setAndAllowWhileIdle se lagta hai aur fire hone par agle din ke liye
 * dobara schedule ho jaata hai (ReminderReceiver se). Boot ke baad
 * BootReceiver sab dobara laga deta hai.
 */
public final class ReminderScheduler {
    private static final String TAG = "BhaktiReminder";
    public static final String PREFS = "bhakti_prefs";
    public static final String KEY_JSON = "reminders_json";
    public static final String CHANNEL_ID = "bhakti_reminders";

    private ReminderScheduler() {}

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static String getJson(Context c) {
        return prefs(c).getString(KEY_JSON, "");
    }

    /** JS se aaya hua reminders JSON: store karo + reschedule karo. */
    public static void saveAndSchedule(Context c, String json) {
        prefs(c).edit().putString(KEY_JSON, json == null ? "" : json).apply();
        rescheduleAll(c);
    }

    /** Storage se saare reminders dobara schedule karo (boot / save ke baad). */
    public static void rescheduleAll(Context c) {
        String json = getJson(c);
        if (json == null || json.length() == 0) return;
        try {
            JSONArray arr = new JSONArray(json);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                String id = o.optString("id", "r" + i);
                boolean enabled = o.optBoolean("enabled", false);
                int hour = o.optInt("hour", 8);
                int minute = o.optInt("minute", 0);
                String title = o.optString("title", "🙏 आज की भक्ति");
                String target = o.optString("target", "today");
                if (enabled) scheduleOne(c, id, hour, minute, title, target);
                else cancelOne(c, id);
            }
        } catch (Exception e) {
            Log.w(TAG, "rescheduleAll failed: " + e.getMessage());
        }
    }

    public static void scheduleOne(Context c, String id, int hour, int minute, String title, String target) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long trigger = nextTrigger(hour, minute);
        PendingIntent pi = buildPending(c, id, title, target);
        try {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            Log.d(TAG, "scheduled " + id + " at " + hour + ":" + minute);
        } catch (Exception e) {
            Log.w(TAG, "schedule failed: " + e.getMessage());
        }
    }

    public static void cancelOne(Context c, String id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(buildPending(c, id, "", "today"));
    }

    private static PendingIntent buildPending(Context c, String id, String title, String target) {
        android.content.Intent i = new android.content.Intent(c, ReminderReceiver.class);
        i.setAction("com.sanatanhindu.app.REMIND." + id);
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("target", target);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(c, requestCode(id), i, flags);
    }

    private static int requestCode(String id) {
        return (id.hashCode() & 0x0fffffff) | 0x1000; // stable, non-zero
    }

    /** Aaj ka hh:mm agar future hai to aaj, warna kal. */
    private static long nextTrigger(int hour, int minute) {
        Calendar now = Calendar.getInstance();
        Calendar t = Calendar.getInstance();
        t.set(Calendar.HOUR_OF_DAY, hour);
        t.set(Calendar.MINUTE, minute);
        t.set(Calendar.SECOND, 0);
        t.set(Calendar.MILLISECOND, 0);
        if (t.getTimeInMillis() <= now.getTimeInMillis() + 1000) {
            t.add(Calendar.DAY_OF_YEAR, 1);
        }
        return t.getTimeInMillis();
    }

    public static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "भक्ति रिमाइंडर", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("रोज़ की भक्ति का स्मरण");
            ch.enableVibration(true);
            nm.createNotificationChannel(ch);
        }
    }
}
