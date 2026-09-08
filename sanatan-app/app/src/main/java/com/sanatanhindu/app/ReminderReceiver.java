package com.sanatanhindu.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * Alarm fire hone par notification dikhata hai aur agle din ke liye
 * reminders dobara schedule kar deta hai (daily repeat).
 */
public class ReminderReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("id");
        if (id == null) id = "morning";
        String title = intent.getStringExtra("title");
        if (title == null || title.length() == 0) title = "🙏 आज की भक्ति करें";
        String target = intent.getStringExtra("target");
        if (target == null) target = "today";

        ReminderScheduler.createChannel(context);

        // Tap -> app khule aur relevant content par jaye (deep link)
        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra("route", target);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(context, (id.hashCode() & 0xffff), open, flags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(context, ReminderScheduler.CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_bhakti)
                .setColor(Color.parseColor("#E8590C"))
                .setContentTitle(title)
                .setContentText("अभी खोलें और आज की भक्ति करें 🚩")
                .setStyle(new NotificationCompat.BigTextStyle().bigText("अभी खोलें और आज की भक्ति करें — Chalisa, Aarti व Mantra. 🚩 जय श्री राम"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(pi);

        try {
            NotificationManagerCompat nm = NotificationManagerCompat.from(context);
            if (nm.areNotificationsEnabled()) {
                nm.notify(id.hashCode() & 0xffff, b.build());
            }
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS not granted (Android 13+) — silently skip
        }

        // Kal ke liye dobara schedule (daily repeat)
        ReminderScheduler.rescheduleAll(context);
    }
}
