# Logo & Favicon Setup Instructions

## ✅ Code Changes Complete

The following files have been updated:
- ✅ [src/app/layout.tsx](app/src/app/layout.tsx) - Added favicon metadata
- ✅ [src/app/page.tsx](app/src/app/page.tsx) - Replaced text logo with Image component

---

## 📁 Required Image Files

You need to create the following image files in `/app/public/`:

### 1. Main Logo
**File**: `/app/public/logo.png`
- **Size**: 2048x2048 (original) or similar high-res
- **Format**: PNG with transparent background (or JPG if no transparency needed)
- **Usage**: Navigation bar (will be resized to height: 48px)

**Action**: Save your uploaded logo as `logo.png` in the `public` folder.

---

### 2. Favicon (Browser Tab Icon)

#### favicon.ico
**File**: `/app/public/favicon.ico`
- **Size**: 16x16 and 32x32 (multi-size ICO)
- **Source**: Extract just the **folder + checkmark icon** (without text)
- **Tool**: Use [favicon.io](https://favicon.io/favicon-converter/) or [RealFaviconGenerator](https://realfavicongenerator.net/)

#### favicon-16x16.png
**File**: `/app/public/favicon-16x16.png`
- **Size**: 16x16 px
- **Source**: Folder + checkmark icon only

#### favicon-32x32.png
**File**: `/app/public/favicon-32x32.png`
- **Size**: 32x32 px
- **Source**: Folder + checkmark icon only

---

### 3. Apple Touch Icon (iOS/iPadOS Home Screen)

**File**: `/app/public/apple-touch-icon.png`
- **Size**: 180x180 px
- **Source**: Full logo with text, or just icon
- **Format**: PNG
- **Background**: Can add a solid color background (e.g., white or teal)

---

### 4. OpenGraph/Social Media Image

**File**: `/app/public/og-image.png`
- **Size**: 1200x630 px
- **Usage**: Twitter, Facebook, LinkedIn link previews
- **Design**: Logo + tagline on solid background

**Suggested layout**:
```
┌─────────────────────────────────┐
│                                 │
│         [AlertDoc Logo]         │
│                                 │
│   NRI Compliance Health Check   │
│   2-minute compliance check     │
│                                 │
└─────────────────────────────────┘
```

---

## 🛠️ How to Create These Images

### Option 1: Online Tools (Easiest)
1. **Favicon Generator**: https://favicon.io/favicon-converter/
   - Upload your logo
   - Download the generated package
   - Copy files to `/app/public/`

2. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - More comprehensive
   - Generates all sizes + platform-specific icons
   - Provides code snippets (we've already added them)

### Option 2: Manual (Design Tool)
1. **Figma/Canva/Photoshop**:
   - Create artboards at exact sizes listed above
   - Export as PNG (or ICO for favicon.ico)
   - Save to `/app/public/`

2. **ImageMagick (Command Line)**:
   ```bash
   # Install ImageMagick first
   brew install imagemagick  # macOS

   # Create favicons from logo
   convert logo.png -resize 16x16 favicon-16x16.png
   convert logo.png -resize 32x32 favicon-32x32.png
   convert logo.png -resize 180x180 apple-touch-icon.png

   # Create ICO (multi-size)
   convert favicon-16x16.png favicon-32x32.png favicon.ico

   # Create OG image (1200x630)
   convert logo.png -resize 1200x630 -gravity center -extent 1200x630 og-image.png
   ```

---

## 📋 File Checklist

After creating all files, your `/app/public/` should have:

```
/app/public/
├── logo.png              ✅ Main logo (navigation)
├── favicon.ico           ✅ Multi-size favicon
├── favicon-16x16.png     ✅ 16x16 favicon
├── favicon-32x32.png     ✅ 32x32 favicon
├── apple-touch-icon.png  ✅ 180x180 iOS icon
└── og-image.png          ✅ 1200x630 social media preview
```

---

## 🎨 Design Recommendations

### For Favicon (16x16 and 32x32):
- **Keep it simple**: Use ONLY the folder + checkmark icon
- **No text**: "AlertDoc" text won't be readable at 16px
- **High contrast**: Navy icon + white/transparent background
- **Bold lines**: Your "brutal" design already works well for small sizes

### For Apple Touch Icon (180x180):
- **Add padding**: 20px margin around logo
- **Optional background**: Solid color (white, teal, or navy)
- **Rounded corners**: iOS applies them automatically

### For OG Image (1200x630):
- **Include branding**: Full logo + tagline
- **Readable text**: At least 48px font size
- **Safe zone**: Keep important content 40px from edges
- **Background**: Use your brand colors (teal + navy + white)

---

## 🧪 Testing

### After adding all files:

1. **Favicon**:
   - Open http://localhost:3003 (or your dev server)
   - Check browser tab icon
   - Try different browsers (Chrome, Safari, Firefox)

2. **Apple Touch Icon**:
   - Open site on iPhone/iPad Safari
   - Tap "Share" → "Add to Home Screen"
   - Check icon appearance

3. **OpenGraph**:
   - Share your site URL on Twitter/LinkedIn
   - Check preview card appearance
   - Use [OpenGraph Preview](https://www.opengraph.xyz/) to test

4. **Navigation Logo**:
   - Verify logo appears in nav bar
   - Test on mobile and desktop
   - Check that it's clickable (returns to home)

---

## 🚀 Quick Start

**Minimum to get started** (do these first):

1. Save your uploaded logo as `/app/public/logo.png`
2. Use [favicon.io](https://favicon.io/favicon-converter/) to generate favicons
3. Download and extract to `/app/public/`
4. Restart dev server: `npm run dev`
5. Check http://localhost:3003

**Later** (for production):
- Create custom OG image (1200x630)
- Optimize Apple touch icon
- Test social media previews

---

## 📝 Notes

- **Next.js will automatically serve** files from `/public/` at the root URL
- `/public/logo.png` → accessible at `http://yoursite.com/logo.png`
- **No imports needed** for favicon files in `layout.tsx` - Next.js handles it via metadata
- **Image optimization**: Next.js Image component automatically optimizes `/logo.png`

---

## ❓ Need Help?

If you get stuck:
1. Check that files are in `/app/public/` (not `/app/src/public/`)
2. Restart dev server after adding images
3. Clear browser cache (Cmd+Shift+R on Mac)
4. Check browser console for 404 errors

---

**Current Status**:
- ✅ Code updated
- ⏳ Waiting for you to add image files to `/app/public/`

Once you add the files, the logo will appear automatically! 🎉
