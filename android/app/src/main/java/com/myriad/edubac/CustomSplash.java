package com.myriad.edubac;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CustomSplash")
public class CustomSplash extends Plugin {

    @PluginMethod
    public void hide(PluginCall call) {
        MainActivity activity = (MainActivity) getActivity();

        if (activity != null) {
            activity.runOnUiThread(activity::hideCustomSplash);
        }

        call.resolve();
    }
}