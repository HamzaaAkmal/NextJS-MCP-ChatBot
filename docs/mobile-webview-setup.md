# Mobile WebView Setup Guide

This guide helps you integrate the chatbot into an Android app using WebView.

## Android WebView Configuration

### 1. Enable Required WebView Features

Add to your `MainActivity.kt` or `MainActivity.java`:

```kotlin
import android.webkit.WebView
import android.webkit.WebSettings
import android.webkit.WebChromeClient
import android.webkit.PermissionRequest
import android.os.Build

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        setupWebView()
    }

    private fun setupWebView() {
        val webSettings: WebSettings = webView.settings
        
        // Enable JavaScript (required for chatbot)
        webSettings.javaScriptEnabled = true
        
        // Enable DOM Storage (required for app state)
        webSettings.domStorageEnabled = true
        
        // Enable Database (for local storage)
        webSettings.databaseEnabled = true
        
        // Enable mixed content for development
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Improve performance
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH)
        
        // Enable zoom controls (optional)
        webSettings.builtInZoomControls = false
        webSettings.displayZoomControls = false
        
        // Set user agent (helps with responsive design)
        webSettings.userAgentString = webSettings.userAgentString + " MobileApp"
        
        // Handle microphone/camera permissions for voice chat
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.resources)
                }
            }
        }
        
        // Load your chatbot URL
        webView.loadUrl("https://your-chatbot-domain.com")
    }
    
    // Handle back button
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

### 2. Add Required Permissions

Add to your `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet permission (required) -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Network state (recommended) -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Microphone for voice chat (optional) -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    
    <!-- Camera for image upload (optional) -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- File access for attachments (optional) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="28" />

    <application
        android:usesCleartextTraffic="true"
        ... >
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
        </activity>
    </application>
</manifest>
```

### 3. Layout File (activity_main.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:fitsSystemWindows="true">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
```

## Mobile-First Features Implemented

### ✅ Touch Optimization
- All buttons are at least 44x44dp (iOS) / 48x48dp (Android) for easy tapping
- Touch manipulation enabled to prevent double-tap zoom
- Tap highlight removed for better UX

### ✅ Safe Area Support
- Automatic padding for notches and navigation bars
- Uses CSS `env(safe-area-inset-*)` variables
- Works on iPhone X and newer Android devices

### ✅ Responsive Design
- Mobile-first approach with desktop enhancements
- Adaptive layouts from 320px to 4K screens
- Touch-friendly spacing and sizing

### ✅ Performance
- Overscroll bounce disabled for native feel
- Smooth scrolling enabled
- Optimized animations for 60fps

### ✅ Keyboard Handling
- Input automatically adjusts when keyboard appears
- No layout shifts when typing
- Proper focus management

## Testing Checklist

- [ ] Voice chat works (microphone permission)
- [ ] File uploads work (storage permission)
- [ ] Camera uploads work (camera permission)
- [ ] Keyboard doesn't cover input
- [ ] No horizontal scrolling
- [ ] Touch targets are easy to tap
- [ ] Safe areas respected on notched devices
- [ ] Back button works correctly
- [ ] App persists state on rotation
- [ ] Offline handling works

## Common Issues & Solutions

### Issue: Voice chat not working
**Solution**: Ensure microphone permission is granted and WebChromeClient handles permission requests.

### Issue: Keyboard covers input
**Solution**: Add `android:windowSoftInputMode="adjustResize"` to activity in manifest.

### Issue: Can't upload files
**Solution**: Implement file chooser in WebChromeClient:

```kotlin
override fun onShowFileChooser(
    webView: WebView,
    filePathCallback: ValueCallback<Array<Uri>>,
    fileChooserParams: FileChooserParams
): Boolean {
    // Implement file chooser
    return true
}
```

### Issue: White screen on load
**Solution**: Check internet permission and HTTPS/cleartext traffic settings.

## Production Deployment

1. **Enable HTTPS**: Voice chat requires HTTPS in production
2. **Optimize Bundle**: Run `pnpm build` for production build
3. **Enable Compression**: Use gzip/brotli on server
4. **CDN**: Use CDN for static assets
5. **Caching**: Configure proper cache headers

## PWA Alternative

Instead of WebView, consider making it a Progressive Web App (PWA):
- Add to home screen support
- Offline functionality
- Push notifications
- Native-like experience

The app already includes PWA metadata in the layout.

## Support

For issues or questions:
- Check browser console in WebView for errors
- Enable remote debugging: `WebView.setWebContentsDebuggingEnabled(true)`
- Test on multiple Android versions and screen sizes
