package com.raggiodev.netpocket;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int TACTICAL_BG = Color.parseColor("#0B0F19");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Do not draw the WebView behind the status bar / navigation bar.
        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.getDecorView().setBackgroundColor(TACTICAL_BG);

        // Light (white) system bar icons on the dark tactical background.
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        // Android 15+/16 (targetSdk 35+) enforces edge-to-edge and ignores the opt-out flag,
        // so pad the content root by any system bar / display cutout insets that are still
        // delivered to it. When the Capacitor SystemBars plugin has already padded the decor
        // view, these insets arrive as zero and this listener is a no-op (no double padding).
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            boolean imeVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, imeVisible ? 0 : bars.bottom);

            // Zero the consumed insets instead of returning CONSUMED so the WebView keeps
            // recalculating env(safe-area-inset-*) correctly (Chromium issue 461332423).
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                .build();
        });
        ViewCompat.requestApplyInsets(content);
    }
}

