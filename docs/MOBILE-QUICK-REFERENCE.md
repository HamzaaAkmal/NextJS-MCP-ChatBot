# Mobile-First Quick Reference

## CSS Classes Added

### Safe Area Support
```tsx
<div className="safe-area-inset">      // All safe areas
<div className="safe-top">             // Top notch/status bar
<div className="safe-bottom">          // Bottom navigation bar
<div className="pb-safe">              // Padding bottom with min 1rem
<div className="pt-safe">              // Padding top with min 0.5rem
```

### Touch Optimization
```tsx
<button className="touch-manipulation">  // Better touch response
<div className="overscroll-none">        // No bounce scroll
<div className="overscroll-contain">     // Contain scroll
<div className="smooth-scroll">          // Smooth scrolling
```

### Mobile Scrollbar
```tsx
<div className="mobile-hide-scrollbar">  // Hide scrollbar on mobile only
<div className="no-scrollbar">           // Hide scrollbar always
```

## Responsive Button Sizes

### Before
```tsx
<Button size="icon">...</Button>
```

### After (Mobile-First)
```tsx
<Button 
  size="icon" 
  className="h-10 w-10 md:h-9 md:w-9 touch-manipulation"
>
  ...
</Button>
```

## Responsive Padding

### Before
```tsx
<div className="px-6">...</div>
```

### After (Mobile-First)
```tsx
<div className="px-4 md:px-6">...</div>
```

## Responsive Icon Sizes

### Before
```tsx
<Icon size={16} />
```

### After (Mobile-First)
```tsx
<Icon className="h-5 w-5 md:h-4 md:w-4" />
```

## Tailwind Breakpoints

```css
/* Mobile first - no prefix needed */
className="text-sm"              /* All sizes */

/* Tablet and up */
className="md:text-base"         /* ≥ 768px */

/* Desktop */
className="lg:text-lg"           /* ≥ 1024px */

/* Large desktop */
className="xl:text-xl"           /* ≥ 1280px */

/* Extra large */
className="2xl:text-2xl"         /* ≥ 1536px */
```

## Common Mobile Patterns

### Sticky Header with Safe Area
```tsx
<header className="sticky top-0 z-50 bg-background/95 backdrop-blur safe-top">
```

### Bottom Input with Safe Area
```tsx
<div className="absolute bottom-0 pb-safe">
```

### Touch-Friendly Button
```tsx
<Button 
  className="h-10 w-10 touch-manipulation rounded-full"
  onClick={handleClick}
>
```

### Responsive Container
```tsx
<div className="max-w-3xl mx-auto px-3 md:px-6">
```

### Mobile-First Gap
```tsx
<div className="flex gap-2 md:gap-4">
```

## Testing Commands

```bash
# Check TypeScript errors
pnpm type-check

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start dev server
pnpm dev
```

## Mobile Testing URLs

```bash
# Local testing
http://localhost:3000

# Mobile device on same network
http://192.168.1.x:3000  # Replace with your local IP

# Tunnel for external testing (if using ngrok)
https://xxxx.ngrok.io
```

## Chrome DevTools Device Emulation

1. Open DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device:
   - iPhone SE (smallest)
   - iPhone 14 Pro (notch)
   - Pixel 7 (Android)
   - Galaxy S23 (Android)
   - iPad Air (tablet)

## Quick WebView Test

```kotlin
// Minimal Android WebView setup
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
}
webView.loadUrl("http://10.0.2.2:3000")  // Android emulator local
```

## Troubleshooting

### Input covered by keyboard?
```tsx
// Add to body or main container
className="h-screen flex flex-col"
```

### Voice chat not working?
1. Check HTTPS (required for getUserMedia)
2. Verify microphone permission
3. Check browser compatibility

### Layout shifting?
```tsx
// Use fixed heights where possible
className="h-screen"  // Not h-full
className="min-h-screen"  // For full page
```

### Touch delay?
```tsx
// Add to interactive elements
className="touch-manipulation"
```

## File Locations

```
src/
├── app/
│   ├── layout.tsx                 ✅ Mobile meta tags
│   ├── (chat)/layout.tsx         ✅ Safe areas
│   └── globals.css               ✅ Mobile utilities
├── components/
│   ├── chat-bot.tsx              ✅ Mobile optimized
│   ├── prompt-input.tsx          ✅ Touch-friendly
│   ├── message.tsx               ✅ Responsive
│   └── layouts/
│       ├── app-header.tsx        ✅ Mobile header
│       └── app-sidebar.tsx       ✅ Touch sidebar
docs/
├── mobile-webview-setup.md       📖 WebView guide
└── MOBILE-ENHANCEMENTS.md        📖 Full documentation
public/
└── manifest.json                 📱 PWA manifest
```

## Next Steps

1. ✅ All mobile-first changes are complete
2. 🧪 Test on real devices
3. 📱 Build Android WebView wrapper
4. 🚀 Deploy to production
5. 📊 Monitor mobile metrics

## Need Help?

- Review: [MOBILE-ENHANCEMENTS.md](./MOBILE-ENHANCEMENTS.md)
- Android: [mobile-webview-setup.md](./mobile-webview-setup.md)
- Issues: Check browser console and WebView logs
