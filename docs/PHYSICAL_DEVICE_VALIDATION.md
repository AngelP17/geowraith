# Physical Device Validation Guide

**Version:** 1.0  
**Last Updated:** 2026-02-26  
**Status:** Ready for Testing

---

## Purpose

This guide provides step-by-step instructions for validating GeoWraith on physical devices (smartphones, tablets, laptops) to ensure real-world functionality beyond headless testing.

---

## Test Devices Matrix

| Device Type | OS | Browser | Priority | Test Focus |
|-------------|-----|---------|----------|------------|
| iPhone 14+ | iOS 17+ | Safari | High | Mobile WebGL, camera upload |
| Android flagship | Android 14+ | Chrome | High | Mobile WebGL, file picker |
| MacBook Pro | macOS 14+ | Safari, Chrome | High | Desktop performance |
| Windows laptop | Windows 11 | Chrome, Edge | Medium | Cross-platform |
| iPad Pro | iPadOS 17+ | Safari | Medium | Tablet layout, touch |
| Budget Android | Android 12+ | Chrome | Low | Performance baseline |

---

## Pre-Test Setup

### 1. Server Preparation

```bash
# Start backend with watch mode
cd /path/to/geowraith/backend
npm run watch

# In another terminal, start frontend
cd /path/to/geowraith
npm run dev

# Verify both services
# Backend: http://localhost:8080/health
# Frontend: http://localhost:3001
```

### 2. Network Setup

For testing on mobile devices, expose local server:

**Option A: ngrok (Recommended)**
```bash
# Install ngrok
npm install -g ngrok

# Expose frontend
ngrok http 3001

# Or expose both with nginx proxy
```

**Option B: Local network**
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access via http://YOUR_IP:3001
# Ensure firewall allows connections
```

### 3. Test Images Preparation

Prepare 10 test images with known GPS coordinates:

| Image | Location | Lat/Lon | Expected Accuracy |
|-------|----------|---------|-------------------|
| 1 | Eiffel Tower, Paris | 48.8584, 2.2945 | ±10km |
| 2 | Times Square, NYC | 40.7580, -73.9855 | ±10km |
| 3 | Local landmark (your city) | Known | ±50km |
| 4 | Generic street scene | Known | ±200km |
| 5 | Nature/landscape | Known | ±500km |
| 6 | Indoor | Known | May fail |
| 7 | Night scene | Known | ±300km |
| 8 | Coastal view | Known | ±100km |
| 9 | Mountain landscape | Known | ±200km |
| 10 | Urban canyon | Known | ±50km |

---

## Test Protocol

### Test 1: Basic Upload Flow

**Objective:** Verify image upload works on device

**Steps:**
1. Open GeoWraith in browser
2. Click "Upload Image" / "Choose File"
3. Select test image from device
4. Wait for processing
5. Verify results display

**Pass Criteria:**
- [ ] File picker opens correctly
- [ ] Upload completes without error
- [ ] Progress indicator shows
- [ ] Results panel displays with map
- [ ] No JavaScript errors in console

**Platforms:** All

---

### Test 2: WebGL Map Rendering

**Objective:** Verify 3D map displays correctly

**Steps:**
1. Upload any test image
2. Wait for results
3. Interact with map:
   - Pan (drag)
   - Zoom (pinch/spread)
   - Rotate (two-finger rotate)

**Pass Criteria:**
- [ ] Map tiles load
- [ ] Marker appears at predicted location
- [ ] Pan/zoom/rotate smooth (>30fps)
- [ ] No WebGL context lost errors
- [ ] Map style switcher works (if available)

**Platforms:** All (critical for mobile)

---

### Test 3: Offline Mode

**Objective:** Verify offline tile caching works

**Steps:**
1. Load GeoWraith with internet connected
2. Navigate map around predicted location (load tiles)
3. Disconnect internet (airplane mode/disable WiFi)
4. Refresh page
5. Upload new image
6. Check map displays cached tiles

**Pass Criteria:**
- [ ] Map still displays with cached tiles
- [ ] "Offline mode" indicator shows (if implemented)
- [ ] Prediction still works (backend may need connection)
- [ ] Reconnecting restores online tiles

**Platforms:** Mobile devices (most important)

---

### Test 4: Performance Benchmark

**Objective:** Measure real-world performance

**Steps:**
1. Clear browser cache
2. Upload test image
3. Time each phase:
   - Upload time
   - Processing time
   - Map load time
4. Record results

**Expected Performance:**

| Device | Upload | Processing | Map Load | Total |
|--------|--------|------------|----------|-------|
| High-end mobile | <2s | 3-5s | <3s | <10s |
| Mid-range mobile | <3s | 5-8s | <5s | <15s |
| Desktop | <1s | 2-4s | <2s | <7s |
| Budget device | <5s | 8-15s | <8s | <25s |

**Pass Criteria:**
- Total time within expected range
- No timeout errors
- UI remains responsive

---

### Test 5: Browser Compatibility

**Objective:** Verify cross-browser compatibility

**Test Matrix:**

| Browser | Upload | Map | Results | Console Errors |
|---------|--------|-----|---------|----------------|
| Chrome | [ ] | [ ] | [ ] | None |
| Safari | [ ] | [ ] | [ ] | None |
| Firefox | [ ] | [ ] | [ ] | None |
| Edge | [ ] | [ ] | [ ] | None |
| Samsung Internet | [ ] | [ ] | [ ] | None |

**Platforms:** All

---

### Test 6: Accuracy Validation

**Objective:** Validate real-world geolocation accuracy

**Steps:**
1. Visit a landmark with known coordinates
2. Take photo with phone (enable location services)
3. Upload to GeoWraith
4. Compare predicted vs actual location

**Measurement:**
```
Error (km) = haversine(predicted_lat, predicted_lon, actual_lat, actual_lon)
```

**Expected Results:**
- Landmarks: <100km error (target: <50km)
- Urban scenes: <200km error
- Natural landscapes: <500km error

**Record in spreadsheet:**
| Date | Location | Device | Predicted | Actual | Error km | Pass/Fail |
|------|----------|--------|-----------|--------|----------|-----------|

---

### Test 7: Stress Test

**Objective:** Test system stability

**Steps:**
1. Upload 10 images sequentially
2. Upload 5 images in rapid succession
3. Upload very large image (>10MB)
4. Upload corrupted/invalid image

**Pass Criteria:**
- [ ] System remains stable after 10 uploads
- [ ] Queue handles rapid uploads gracefully
- [ ] Large images rejected or processed
- [ ] Invalid images handled with error message
- [ ] No memory leaks (check browser task manager)

---

### Test 8: Accessibility

**Objective:** Verify accessibility features

**Steps:**
1. Enable screen reader (VoiceOver/TalkBack)
2. Navigate with keyboard only
3. Test with reduced motion preference
4. Check color contrast

**Pass Criteria:**
- [ ] All interactive elements focusable
- [ ] Alt text for images
- [ ] Proper ARIA labels
- [ ] Sufficient color contrast (WCAG AA)

---

## Recording Results

### Test Session Template

```markdown
## Test Session: [Date] - [Device]

### Environment
- Device: [Model]
- OS: [Version]
- Browser: [Version]
- Network: [WiFi/4G/5G]
- Server: [Local/ngrok/Production]

### Tests Completed
- [ ] Test 1: Basic Upload
- [ ] Test 2: WebGL Map
- [ ] Test 3: Offline Mode
- [ ] Test 4: Performance
- [ ] Test 5: Browser Compat
- [ ] Test 6: Accuracy
- [ ] Test 7: Stress
- [ ] Test 8: Accessibility

### Results Summary
- Pass: X
- Fail: Y
- Blocked: Z

### Issues Found
1. [Issue description with screenshot]

### Performance Metrics
- Average upload: Xs
- Average processing: Ys
- Average total: Zs

### Notes
[Any observations]
```

---

## Common Issues & Solutions

### Issue: WebGL Not Supported

**Symptoms:** Map doesn't display, "WebGL not supported" error

**Solution:**
- iOS: Enable WebGL in Safari Settings → Advanced
- Android: Use Chrome (not stock browser)
- Desktop: Update graphics drivers

---

### Issue: Upload Fails on Mobile

**Symptoms:** File picker doesn't open or upload stalls

**Solution:**
- Check file size (<10MB recommended)
- Ensure image is JPEG/PNG
- Try different image source (camera vs gallery)
- Check browser permissions

---

### Issue: Slow Performance

**Symptoms:** Long processing times, UI freezes

**Solution:**
- Close other apps
- Use WiFi instead of cellular
- Reduce image size before upload
- Clear browser cache

---

### Issue: Map Tiles Don't Load

**Symptoms:** Blank map, missing tiles

**Solution:**
- Check internet connection
- Disable VPN/proxy
- Try different map style
- Check console for CORS errors

---

## Sign-Off Criteria

Validation is **COMPLETE** when:

- [ ] All 8 tests completed on at least 3 device types
- [ ] 90%+ tests pass on primary devices (iOS Safari, Android Chrome)
- [ ] No critical bugs (crashes, data loss)
- [ ] Performance within 20% of benchmarks
- [ ] Accuracy within expected ranges
- [ ] Documentation updated with any workarounds

---

## Automated Testing (Future)

For regression prevention, consider:

1. **BrowserStack/Appium:** Automated cross-browser testing
2. **Lighthouse CI:** Performance auditing
3. **Playwright:** E2E test automation
4. **Sentry:** Real-user monitoring in production

---

## Appendix: Debugging Tools

### Browser DevTools

**iOS Safari:**
1. Settings → Safari → Advanced → Web Inspector
2. Connect to Mac
3. Open Safari Develop menu

**Android Chrome:**
1. Enable Developer Options
2. Enable USB Debugging
3. Connect to computer
4. Open chrome://inspect

### Remote Console Access

```javascript
// Add to app for remote debugging
window.onerror = (msg, url, line) => {
  fetch('/api/log', {
    method: 'POST',
    body: JSON.stringify({msg, url, line, ua: navigator.userAgent})
  });
};
```

---

**End of Validation Guide**
