# Animation & Motion Design Guide

This guide defines the animation and motion design system for ODAVL Studio, ensuring smooth, purposeful, and accessible interactions across all products.

---

## 🎯 Motion Design Principles

### 1. **Purposeful Motion**
Every animation should have a clear purpose:
- **Feedback**: Confirm user actions
- **Orientation**: Help users understand spatial relationships
- **Focus**: Direct attention to important elements
- **Personality**: Add delight without distraction

### 2. **Performance First**
- **GPU Acceleration**: Use `transform` and `opacity` for smooth 60fps
- **Avoid Layout Thrashing**: Don't animate `width`, `height`, `top`, `left`
- **Will-Change**: Use sparingly for critical animations
- **Reduce Motion**: Respect `prefers-reduced-motion` user preference

### 3. **Consistency**
- **Standard Durations**: Use predefined timing values
- **Standard Easings**: Use predefined easing functions
- **Predictable Patterns**: Similar elements animate similarly

### 4. **Accessibility**
- **Reduced Motion**: Always provide non-animated alternatives
- **No Seizure Risk**: Avoid rapid flashing (>3 flashes per second)
- **User Control**: Allow animations to be disabled
- **Keyboard Support**: Animations don't block keyboard navigation

---

## ⏱️ Animation Tokens

### Duration Tokens

```json
{
  "duration": {
    "instant": "0ms",
    "fast": "150ms",
    "base": "250ms",
    "moderate": "350ms",
    "slow": "500ms",
    "slower": "700ms",
    "slowest": "1000ms"
  }
}
```

**Usage Guidelines:**

| Duration | Use Case | Examples |
|----------|----------|----------|
| **instant** (0ms) | No animation, immediate | Reduced motion mode, instant state changes |
| **fast** (150ms) | Quick feedback | Button hover, tooltip show, toggle switch |
| **base** (250ms) | Standard transitions | Card hover, dropdown open, tab switch |
| **moderate** (350ms) | Noticeable changes | Modal open, drawer slide, page transitions |
| **slow** (500ms) | Emphasized motion | Panel expand, accordion open, hero entrance |
| **slower** (700ms) | Complex animations | Multi-step animations, staggered lists |
| **slowest** (1000ms) | Special effects | Loading sequences, celebration effects |

### Easing Functions

```json
{
  "easing": {
    "linear": "linear",
    "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
    "easeOut": "cubic-bezier(0, 0, 0.2, 1)",
    "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
    "easeInBack": "cubic-bezier(0.36, 0, 0.66, -0.56)",
    "easeOutBack": "cubic-bezier(0.34, 1.56, 0.64, 1)",
    "easeInOutBack": "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    "spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  }
}
```

**Easing Visualization:**

```
Linear:        ————————————————————————
Ease In:       ___________————————————
Ease Out:      ————————————___________
Ease In Out:   _______————————_______
Ease In Back:  __↓↓↓_______————————————
Ease Out Back: ————————————_______↑↑↑__
Spring:        ____————↑↑——↓——————————
```

**Usage Guidelines:**

| Easing | Use Case | Examples |
|--------|----------|----------|
| **linear** | Mechanical motion | Loading spinners, progress bars, color changes |
| **easeIn** | Elements leaving | Modal close, panel collapse, items disappearing |
| **easeOut** | Elements entering | Modal open, dropdown appear, items appearing |
| **easeInOut** | Element moving | Position changes, size changes, transformations |
| **easeInBack** | Anticipation | Button press (scale down before up) |
| **easeOutBack** | Overshoot | Button release, playful bounce effects |
| **spring** | Natural motion | Draggable elements, elastic interactions |

### Delay Tokens

```json
{
  "delay": {
    "none": "0ms",
    "short": "50ms",
    "base": "100ms",
    "long": "200ms",
    "longer": "300ms"
  }
}
```

**Usage:**
- **Staggered Lists**: Add incremental delays (base * index)
- **Sequential Animations**: Chain animations with delays
- **Micro-interactions**: Brief delay before hover effects

---

## 🎨 Animation Patterns

### 1. Fade Animations

#### Fade In
```css
.fade-in {
  animation: fadeIn 250ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Usage**: Toast notifications, tooltips, alerts

#### Fade Out
```css
.fade-out {
  animation: fadeOut 250ms ease-in;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
```

**Usage**: Dismissing elements, hiding overlays

---

### 2. Slide Animations

#### Slide Up
```css
.slide-up {
  animation: slideUp 350ms ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Usage**: Modal entrance, drawer from bottom

#### Slide Down
```css
.slide-down {
  animation: slideDown 350ms ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Usage**: Dropdown menus, notifications from top

#### Slide In (Left/Right)
```css
.slide-in-left {
  animation: slideInLeft 350ms ease-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in-right {
  animation: slideInRight 350ms ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
```

**Usage**: Sidebar navigation, panel drawers

---

### 3. Scale Animations

#### Scale Up
```css
.scale-up {
  animation: scaleUp 250ms ease-out;
}

@keyframes scaleUp {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Usage**: Modal entrance, dialog appearance

#### Scale Down
```css
.scale-down {
  animation: scaleDown 250ms ease-in;
}

@keyframes scaleDown {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.95);
    opacity: 0;
  }
}
```

**Usage**: Modal exit, dismissing elements

#### Pulse
```css
.pulse {
  animation: pulse 500ms ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

**Usage**: Attention-grabbing, call-to-action emphasis

---

### 4. Rotation Animations

#### Spin
```css
.spin {
  animation: spin 1000ms linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

**Usage**: Loading spinners, refresh icons

#### Rotate In
```css
.rotate-in {
  animation: rotateIn 350ms ease-out;
}

@keyframes rotateIn {
  from {
    transform: rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: rotate(0deg);
    opacity: 1;
  }
}
```

**Usage**: Icon transitions, playful entrances

---

### 5. Bounce Animations

#### Bounce
```css
.bounce {
  animation: bounce 500ms ease-in-out;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
```

**Usage**: Success confirmations, playful interactions

#### Bounce In
```css
.bounce-in {
  animation: bounceIn 500ms cubic-bezier(0.68, -0.6, 0.32, 1.6);
}

@keyframes bounceIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Usage**: Achievement badges, celebration effects

---

### 6. Shake Animations

#### Shake
```css
.shake {
  animation: shake 350ms ease-in-out;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}
```

**Usage**: Form validation errors, denied actions

---

### 7. Stagger Animations

#### Staggered List
```css
.stagger-item {
  animation: fadeInUp 350ms ease-out backwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
.stagger-item:nth-child(5) { animation-delay: 200ms; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Usage**: List items appearing sequentially

---

## 🎬 Component-Specific Animations

### Button Animations

#### Hover State
```css
.button {
  transition: all 150ms ease-out;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

#### Loading State
```css
.button--loading .button__icon {
  animation: spin 1000ms linear infinite;
}
```

---

### Modal Animations

#### Modal Open
```css
.modal-backdrop {
  animation: fadeIn 250ms ease-out;
}

.modal-content {
  animation: scaleUp 350ms ease-out;
}
```

#### Modal Close
```css
.modal-backdrop--closing {
  animation: fadeOut 250ms ease-in;
}

.modal-content--closing {
  animation: scaleDown 250ms ease-in;
}
```

---

### Dropdown Animations

```css
.dropdown-menu {
  animation: slideDown 250ms ease-out;
  transform-origin: top;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: scaleY(0.8) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}
```

---

### Toast Notifications

```css
.toast {
  animation: slideInRight 350ms ease-out;
}

.toast--exiting {
  animation: slideOutRight 250ms ease-in;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

---

### Tooltip Animations

```css
.tooltip {
  animation: fadeIn 150ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

---

## ♿ Accessibility: Reduced Motion

### Respecting User Preferences

```css
/* Default: animations enabled */
.animated-element {
  animation: slideUp 350ms ease-out;
}

/* Reduced motion: instant or simplified */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    /* Instant state change */
    opacity: 1;
    transform: none;
  }
  
  /* Or simplified animation */
  .animated-element--simple {
    animation: fadeIn 150ms ease-out; /* Shorter, simpler */
  }
}
```

### JavaScript Detection

```typescript
// Detect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply appropriate animation
if (prefersReducedMotion) {
  element.classList.add('no-animation');
} else {
  element.classList.add('animated');
}
```

### React Component Example

```tsx
import { useEffect, useState } from 'react';

function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);
  
  return prefersReducedMotion;
}

// Usage
function AnimatedButton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <button className={prefersReducedMotion ? 'button--no-animation' : 'button--animated'}>
      Click Me
    </button>
  );
}
```

---

## 🚀 Performance Optimization

### GPU Acceleration

```css
/* Force GPU acceleration for smooth animations */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Hardware acceleration trick */
}

/* Remove will-change after animation */
.animated-element.animation-complete {
  will-change: auto;
}
```

### Avoid Layout Thrashing

❌ **Bad** (causes layout recalculation):
```css
.element {
  animation: badAnimation 350ms;
}

@keyframes badAnimation {
  from {
    width: 100px;
    height: 100px;
  }
  to {
    width: 200px;
    height: 200px;
  }
}
```

✅ **Good** (GPU-accelerated):
```css
.element {
  animation: goodAnimation 350ms;
}

@keyframes goodAnimation {
  from {
    transform: scale(0.5);
  }
  to {
    transform: scale(1);
  }
}
```

### Composite Layers

Properties that create composite layers (GPU-accelerated):
- `transform` (translate, scale, rotate)
- `opacity`
- `filter`

Properties that DON'T (cause repaints):
- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border`

---

## 📚 Animation Utilities (CSS Classes)

### Fade Utilities
```css
.fade-in { animation: fadeIn 250ms ease-out; }
.fade-out { animation: fadeOut 250ms ease-in; }
.fade-in-fast { animation: fadeIn 150ms ease-out; }
.fade-in-slow { animation: fadeIn 500ms ease-out; }
```

### Slide Utilities
```css
.slide-up { animation: slideUp 350ms ease-out; }
.slide-down { animation: slideDown 350ms ease-out; }
.slide-left { animation: slideLeft 350ms ease-out; }
.slide-right { animation: slideRight 350ms ease-out; }
```

### Scale Utilities
```css
.scale-up { animation: scaleUp 250ms ease-out; }
.scale-down { animation: scaleDown 250ms ease-in; }
.pulse { animation: pulse 500ms ease-in-out; }
```

### Rotation Utilities
```css
.spin { animation: spin 1000ms linear infinite; }
.rotate-in { animation: rotateIn 350ms ease-out; }
```

### Interactive Utilities
```css
.hover-lift:hover { transform: translateY(-4px); }
.hover-scale:hover { transform: scale(1.05); }
.hover-shadow:hover { box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); }
```

---

## 🎓 Best Practices

### 1. Duration Guidelines
- **Micro-interactions** (hover, focus): 150ms
- **Small elements** (tooltips, badges): 250ms
- **Medium elements** (cards, dropdowns): 350ms
- **Large elements** (modals, panels): 500ms
- **Full-page transitions**: 700ms

### 2. Easing Selection
- **Entrances**: Use `ease-out` (fast start, slow end)
- **Exits**: Use `ease-in` (slow start, fast end)
- **Movements**: Use `ease-in-out` (smooth both ends)
- **Mechanical**: Use `linear` (constant speed)

### 3. Performance Rules
- ✅ Animate `transform` and `opacity` only
- ✅ Use `will-change` sparingly (remove after animation)
- ✅ Debounce scroll/resize-triggered animations
- ✅ Use CSS animations over JavaScript when possible
- ❌ Don't animate layout properties (`width`, `height`, `top`, `left`)
- ❌ Don't nest multiple animated elements deeply
- ❌ Don't trigger animations on every frame

### 4. Accessibility Rules
- ✅ Always provide `@media (prefers-reduced-motion: reduce)`
- ✅ Keep animations under 500ms for most interactions
- ✅ Avoid flashing more than 3 times per second
- ✅ Don't rely solely on animation to convey information
- ✅ Allow users to skip or cancel long animations

### 5. User Experience Rules
- ✅ Animation should enhance, not distract
- ✅ Keep it subtle for repeated interactions
- ✅ Use dramatic animations sparingly (celebrations, achievements)
- ✅ Provide instant feedback for user actions
- ✅ Ensure animations don't block user input

---

## 🔧 Implementation Examples

### React Component with Framer Motion

```tsx
import { motion } from 'framer-motion';

function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="card"
    >
      <h2>Animated Card</h2>
      <p>Content here</p>
    </motion.div>
  );
}
```

### Tailwind CSS with Custom Animations

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'slide-up': 'slideUp 350ms ease-out',
        'spin': 'spin 1000ms linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
};
```

### Vue Component with Transitions

```vue
<template>
  <transition
    name="fade"
    enter-active-class="animate-fade-in"
    leave-active-class="animate-fade-out"
  >
    <div v-if="isVisible" class="card">
      Content here
    </div>
  </transition>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 250ms ease-out;
}

.animate-fade-out {
  animation: fadeOut 250ms ease-in;
}
</style>
```

---

## 📊 Animation Checklist

### Design Phase
- [ ] Define animation purpose (feedback, orientation, focus, personality)
- [ ] Choose appropriate duration (fast, base, moderate, slow)
- [ ] Select easing function (linear, ease-in, ease-out, ease-in-out)
- [ ] Consider reduced motion alternative
- [ ] Ensure animation doesn't block user input

### Development Phase
- [ ] Use GPU-accelerated properties (`transform`, `opacity`)
- [ ] Add `will-change` for critical animations (remove after)
- [ ] Implement `@media (prefers-reduced-motion: reduce)`
- [ ] Test on low-end devices
- [ ] Verify 60fps performance

### Testing Phase
- [ ] Test with animations enabled
- [ ] Test with reduced motion preference
- [ ] Test on multiple devices/browsers
- [ ] Verify accessibility (keyboard, screen readers)
- [ ] Check for seizure risk (no rapid flashing)

---

## 🎯 Success Metrics

- **Performance**: 60fps for all animations
- **Accessibility**: 100% components respect reduced motion
- **Consistency**: 90%+ animations use standard durations/easings
- **User Satisfaction**: Animations enhance, not distract

---

**Last Updated**: January 2025  
**Status**: Production-Ready  
**Version**: 2.0.0
