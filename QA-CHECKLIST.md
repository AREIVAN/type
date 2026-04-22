# TypeLearn - QA Checklist (FASE 3)

This checklist validates that all FASE 3 polish tasks are complete and the app is ready for beta/private deployment.

## ✅ Pre-flight Checks

- [ ] No build errors: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint errors: `npm run lint`
- [ ] App starts successfully: `npm run dev`

---

## 📱 Responsive Testing

### Desktop (1920x1080)
- [ ] Home page renders correctly with all 3 mode cards
- [ ] PDF upload area displays properly
- [ ] Typing area is centered and readable
- [ ] Side panels (vocabulary, history) work correctly

### Laptop (1366x768)
- [ ] All text remains readable
- [ ] No horizontal scroll on any page
- [ ] Buttons are accessible

### Tablet (768x1024)
- [ ] Navigation works with touch
- [ ] Typing area doesn't overflow
- [ ] Mode selection cards stack properly

### Mobile (375x667)
- [ ] Navigation collapses or works
- [ ] Typing test is usable
- [ ] No broken layouts

---

## 🎯 Empty States (UX)

- [ ] **Home** - Shows welcome message even without history
- [ ] **PDF** - Shows upload prompt when no file selected
- [ ] **PDF Sections** - Shows message when no sections found
- [ ] **AI** - Shows generation prompt before generating
- [ ] **AI Generated** - Shows content preview after generation
- [ ] **History** - Shows "no sessions" message when empty
- [ ] **Vocabulary** - Shows "click a word" prompt when empty
- [ ] **Settings** - All sections are accessible

---

## ⚠️ Error States (UX)

### PDF Module
- [ ] Upload invalid file type (not PDF) → clear error message
- [ ] Upload corrupted PDF → graceful error handling
- [ ] Upload PDF with no extractable text → helpful message
- [ ] Error during parsing → retry option available

### AI Module
- [ ] Generation failure → error banner with retry
- [ ] Timeout → appropriate feedback

### General
- [ ] localStorage unavailable → warning shown
- [ ] Unexpected errors → logged, not shown to user

---

## ⏳ Loading States (UX)

- [ ] PDF upload shows spinner/progress
- [ ] PDF processing shows loading indicator
- [ ] AI generation shows loading state
- [ ] History page loads without layout shift
- [ ] Vocabulary lookup shows spinner

---

## ⌨️ Keyboard Shortcuts

### Practice Page
- [ ] `R` restarts test (when active)
- [ ] `H` goes to home
- [ ] `V` toggles vocabulary panel
- [ ] `/` focuses typing area
- [ ] `Esc` closes modals

### Help Panel
- [ ] Keyboard icon visible in practice page
- [ ] Clicking opens shortcuts modal
- [ ] Modal closes on `Esc`
- [ ] All shortcuts listed

### Global
- [ ] Shortcuts don't interfere with input fields
- [ ] Reduced motion respected when shortcuts active

---

## 🎨 Animations & Micro-interactions

- [ ] Page transitions are smooth
- [ ] Button hover states work
- [ ] Focus rings visible on keyboard navigation
- [ ] Card hover effects (lift)
- [ ] Typing character feedback (correct/incorrect colors)
- [ ] Completion modal appears smoothly
- [ ] Skeleton shimmer on loading
- [ ] Reduced motion users get instant transitions

---

## 📊 Functional Tests

### PDF Flow
- [ ] Upload valid PDF → text extracted
- [ ] Select section → navigates to practice
- [ ] Multiple sections → all accessible

### AI Flow
- [ ] Select level/category/length → options persist
- [ ] Generate → content appears
- [ ] Select content → navigates to practice

### Typing Engine
- [ ] Correct characters → green
- [ ] Incorrect characters → red + highlight
- [ ] WPM updates in real-time
- [ ] Accuracy calculates correctly
- [ ] Timer starts on first keystroke
- [ ] Completion modal shows on finish
- [ ] Restart works correctly

### History
- [ ] Sessions saved after completion
- [ ] History persists on refresh
- [ ] Clear all works
- [ ] Metrics display correctly

### Vocabulary
- [ ] Click word → panel opens
- [ ] Translation displays
- [ ] Recent words saved
- [ ] Panel toggle works

### Settings
- [ ] Text size slider works
- [ ] Vocabulary toggle works
- [ ] Settings persist

---

## 🔍 Visual Polish

- [ ] Consistent dark theme throughout
- [ ] Typography hierarchy clear
- [ ] Spacing is consistent
- [ ] Icons are aligned
- [ ] No visual glitches on any page
- [ ] Focus states visible
- [ ] Scrollbars styled consistently

---

## ♿ Accessibility

- [ ] Tab navigation works throughout
- [ ] Screen reader announces page changes
- [ ] ARIA labels on interactive elements
- [ ] Color contrast meets WCAG AA
- [ ] Focus not trapped unexpectedly

---

## 🧪 Edge Cases

- [ ] Very long PDFs (>50 pages) → handled gracefully
- [ ] Very short text → still works
- [ ] Special characters in text → handled
- [ ] Accented characters → work correctly
- [ ] Multiple rapid restarts → no bugs
- [ ] Browser back/forward → works correctly

---

## 📦 Final Deliverables Checklist

- [ ] README.md is complete and professional
- [ ] INTEGRATIONS.md documents future services
- [ ] QA-CHECKLIST.md exists for reference
- [ ] SPEC.md is accurate
- [ ] All components properly typed
- [ ] No console errors in production

---

## 🚀 Deployment Readiness

- [ ] `npm run build` succeeds
- [ ] No environment variables required
- [ ] Works on localhost
- [ ] Works when built for production (`npm run start`)

---

## How to Use This Checklist

1. Run through each section systematically
2. Mark items as ✅ complete or ❌ failed
3. Fix any failures before deployment
4. Re-test after fixes

### Quick Test Sequence (5 min)

1. Open app → Home page loads
2. Click PDF → Upload file → Select section → Practice → Complete → Check history
3. Click AI → Generate → Practice → Complete
4. Use keyboard shortcuts in practice
5. Check settings persist

---

<p align="center">
  <strong>TypeLearn</strong> — QA Complete ✓
</p>
