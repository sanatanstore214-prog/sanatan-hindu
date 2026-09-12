package com.sanatanhindu.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.util.Calendar;

/**
 * Home-screen widget: aaj ki tithi/date + "आज की भक्ति" (vaar-devta) + tap ->
 * app khule aur today's bhakti par jaye. Roz saamne rehne se app delete nahi hota.
 */
public class BhaktiWidget extends AppWidgetProvider {

    private static final String[] DAYS = { "रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार" };
    private static final String[] MON = { "जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस" };
    // Mirror of content.js weekday deities (Sun..Sat)
    private static final String[] DEITY = { "श्री राम / सूर्य", "शिव जी", "हनुमान जी", "गणेश जी", "विष्णु जी", "लक्ष्मी माँ", "शनि / हनुमान" };

    @Override
    public void onUpdate(Context context, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) updateOne(context, mgr, id);
    }

    static void updateOne(Context context, AppWidgetManager mgr, int id) {
        Calendar c = Calendar.getInstance();
        int wd = c.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun
        String dateStr = DAYS[wd] + " · " + c.get(Calendar.DAY_OF_MONTH) + " " + MON[c.get(Calendar.MONTH)];

        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_bhakti);
        rv.setTextViewText(R.id.widget_date, dateStr);
        rv.setTextViewText(R.id.widget_deity, DEITY[wd]);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra("route", "today");
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(context, 42, open, flags);
        rv.setOnClickPendingIntent(R.id.widget_root, pi);

        mgr.updateAppWidget(id, rv);
    }
}
