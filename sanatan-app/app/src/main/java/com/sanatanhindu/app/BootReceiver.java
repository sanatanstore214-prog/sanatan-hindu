package com.sanatanhindu.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Device restart / app update ke baad saare reminders dobara schedule karo,
 * warna reboot par alarms mit jaate hain.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String a = intent.getAction();
        if (a == null) return;
        if (a.equals(Intent.ACTION_BOOT_COMPLETED)
                || a.equals("android.intent.action.QUICKBOOT_POWERON")
                || a.equals(Intent.ACTION_MY_PACKAGE_REPLACED)
                || a.equals(Intent.ACTION_LOCKED_BOOT_COMPLETED)) {
            ReminderScheduler.createChannel(context);
            ReminderScheduler.rescheduleAll(context);
        }
    }
}
