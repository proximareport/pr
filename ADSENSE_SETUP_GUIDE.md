# Google AdSense Setup Guide for Proxima Report

## 🚨 IMPORTANT: You Need to Replace Ad Slot IDs

The current ad system is set up with **placeholder ad slot IDs** (1234567890, 1234567891, etc.). You **MUST** replace these with your actual ad slot IDs from Google AdSense for ads to display properly.

## 🔧 How to Get Your Ad Slot IDs

### Step 1: Go to Google AdSense
1. Visit [Google AdSense](https://www.google.com/adsense)
2. Sign in with your Google account
3. Select your Proxima Report site

### Step 2: Create Ad Units
1. Click **"Ads"** in the left sidebar
2. Click **"By ad unit"**
3. Click **"+ Create new ad unit"**

### Step 3: Configure Each Ad Unit

#### 1. Banner Ad (Homepage Hero)
- **Name**: `Homepage Hero Banner`
- **Ad size**: `Responsive`
- **Ad format**: `Display ads`
- **Copy the Ad unit code** - you'll see something like:
  ```html
  <ins class="adsbygoogle"
       data-ad-client="ca-pub-9144996607586274"
       data-ad-slot="1234567890"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  ```
- **Note the `data-ad-slot` value** (e.g., `1234567890`)

#### 2. Sidebar Ad
- **Name**: `Sidebar Vertical`
- **Ad size**: `300x600` (Vertical)
- **Ad format**: `Display ads`
- **Copy the Ad unit code and note the slot ID**

#### 3. In-Content Ad
- **Name**: `In-Content Rectangle`
- **Ad size**: `300x250` (Rectangle)
- **Ad format**: `Display ads`
- **Copy the Ad unit code and note the slot ID**

#### 4. Article Top Ad
- **Name**: `Article Top Horizontal`
- **Ad size**: `Responsive`
- **Ad format**: `Display ads`
- **Copy the Ad unit code and note the slot ID**

#### 5. Article Bottom Ad
- **Name**: `Article Bottom Horizontal`
- **Ad size**: `Responsive`
- **Ad format**: `Display ads`
- **Copy the Ad unit code and note the slot ID**

#### 6. Homepage Grid Ad
- **Name**: `Homepage Grid Rectangle`
- **Ad size**: `300x250` (Rectangle)
- **Ad format**: `Display ads`
- **Copy the Ad unit code and note the slot ID**

## 📝 Update Your Ad Slot IDs

Once you have all your ad slot IDs, update the `AD_SLOTS` object in `client/src/components/AdPlacement.tsx`:

```typescript
const AD_SLOTS = {
  'banner': 'YOUR_BANNER_SLOT_ID',           // Replace 1234567890
  'sidebar': 'YOUR_SIDEBAR_SLOT_ID',         // Replace 1234567891
  'in-content': 'YOUR_INCONTENT_SLOT_ID',    // Replace 1234567892
  'article-top': 'YOUR_ARTICLETOP_SLOT_ID',  // Replace 1234567893
  'article-bottom': 'YOUR_ARTICLEBOTTOM_SLOT_ID', // Replace 1234567894
  'homepage-hero': 'YOUR_HOMEPAGEHERO_SLOT_ID',   // Replace 1234567895
  'homepage-grid': 'YOUR_HOMEPAGEGRID_SLOT_ID',   // Replace 1234567896
};
```

## 🎯 Ad Placement Strategy

### Homepage
- **Hero Ad**: After featured article (full-width responsive)
- **In-Content Ad**: After first 3 articles (rectangle format)
- **Grid Ad**: After articles grid (rectangle format)

### Article Pages
- **Article Top Ad**: After feature image (horizontal format)
- **Sidebar Ad**: In right sidebar (vertical format)
- **Article Bottom Ad**: Before comments (horizontal format)

### All Pages
- **Banner Ads**: In header/footer areas (responsive format)

## ⚠️ Common Issues & Solutions

### Issue: Only Anchor Ads Work
**Cause**: Missing or incorrect ad slot IDs
**Solution**: Replace placeholder IDs with real ones from AdSense

### Issue: Ads Don't Display
**Cause**: Ad blocker or consent not given
**Solution**: Check browser console for errors, ensure cookie consent

### Issue: Ads Show as Placeholders
**Cause**: AdSense not fully approved or site not ready
**Solution**: Wait for Google's review process to complete

### Issue: Responsive Ads Not Working
**Cause**: Incorrect ad format settings
**Solution**: Use `data-ad-format="auto"` and `data-full-width-responsive="true"`

## 🔍 Testing Your Ads

### 1. Check Browser Console
Look for any JavaScript errors related to ads

### 2. Verify Ad Slot IDs
Ensure all slot IDs match exactly what's in AdSense

### 3. Test Cookie Consent
Accept cookies and refresh page to see if ads appear

### 4. Check Ad Blocker
Disable ad blocker temporarily to test

### 5. View Page Source
Search for your ad slot IDs to ensure they're properly embedded

## 📊 Monitoring Performance

### AdSense Dashboard
- **Earnings**: Track revenue from ads
- **Page views**: Monitor ad impressions
- **CTR**: Click-through rates
- **RPM**: Revenue per thousand impressions

### Google Analytics
- **Page views**: Track which pages get most traffic
- **User behavior**: Understand how users interact with ads
- **A/B testing**: Test different ad placements

## 🚀 Optimization Tips

### 1. Ad Placement
- Place ads where users naturally look
- Avoid overwhelming content with too many ads
- Use responsive ads for mobile optimization

### 2. Content Strategy
- High-quality content = more page views = more ad revenue
- Regular updates keep users coming back
- SEO optimization increases organic traffic

### 3. User Experience
- Don't let ads interfere with reading
- Maintain site performance
- Respect user privacy and consent

## 📞 Need Help?

If you're still having issues after following this guide:

1. **Check Google AdSense Help Center**
2. **Verify your site meets AdSense policies**
3. **Ensure your site is fully approved**
4. **Wait 24-48 hours for changes to take effect**

## ✅ Checklist

- [ ] Created all required ad units in AdSense
- [ ] Copied all ad slot IDs
- [ ] Updated `AD_SLOTS` in `AdPlacement.tsx`
- [ ] Tested ads on different pages
- [ ] Verified ads display correctly
- [ ] Checked mobile responsiveness
- [ ] Monitored AdSense dashboard for impressions

---

**Remember**: Google AdSense can take 24-48 hours to start serving ads after setup. Be patient and ensure all configurations are correct.
