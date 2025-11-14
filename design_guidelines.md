# Mock OPIC LMS - Design Guidelines

## Design Approach
**System:** Material Design principles adapted for educational testing
**Rationale:** Utility-focused application requiring clarity, accessibility, and minimal cognitive load during test-taking. Inspired by platforms like Google Classroom and Duolingo for their clean, distraction-free interfaces.

## Core Design Principles
1. **Focused Simplicity** - Remove all non-essential elements during test-taking
2. **Clear Hierarchy** - Distinguish admin and student modes through layout structure
3. **Accessibility-First** - Large touch targets, clear labels in Korean and English
4. **Progressive Disclosure** - Show only what's needed at each step

## Typography
**Font Family:** Noto Sans KR (primary for Korean) + Inter (secondary for UI elements)
- Headers: 600 weight, text-2xl to text-4xl
- Body: 400 weight, text-base to text-lg
- Labels: 500 weight, text-sm
- Button text: 500 weight, text-base

Korean text requires slightly larger sizing (+2-4px) for readability

## Layout System
**Spacing Units:** Tailwind 4, 6, 8, 12, 16 (p-4, m-6, gap-8, py-12, py-16)
**Container:** max-w-4xl for student interface, max-w-6xl for admin
**Grid System:** Single column for test-taking, 2-column for admin (file list + upload)

## Component Library

### Admin Interface
**Test Set Manager**
- Card-based layout (rounded-lg, shadow-sm) for each test set
- File upload zone: Dashed border, min-h-48, drag-and-drop area
- Question list: Table format with play button, file name, duration, delete action
- CTAs: Primary "새 세트 만들기" (Create New Set) button, prominent placement

**Upload Component**
- Large dropzone with icon (h-32)
- File type indicator (MP3 only)
- Progress bars for multi-file uploads
- Question numbering preview (1/15, 2/15...)

### Student Test Interface
**Test Header** (sticky top-0)
- Progress indicator: "문제 3/15" in text-xl
- Timer (optional): top-right corner
- No navigation elements (back button explicitly removed)

**Question Card** (centered, max-w-2xl)
- Audio player: Custom styled, large play button (w-16 h-16), waveform visualization
- Listen counter: "남은 청취 횟수: 1/2" below player
- Recording indicator: Prominent red dot when active, timer showing recording duration
- Waveform during recording: Visual feedback of voice input

**Controls**
- "질문 듣기" (Listen to Question): Large button, px-8 py-4
- "녹음 시작/중지" (Start/Stop Recording): Toggle state with clear visual change
- "다음 문제" (Next Question): Only enabled after recording, px-8 py-4
- "제출하기" (Submit Test): Final question only, different visual treatment

**Recording State Indicators**
- Idle: Microphone icon, text prompt
- Recording: Red pulse animation, elapsed time
- Recorded: Checkmark, playback option for review

### Completion Screen
- Success message with icon (checkmark, h-24)
- Confirmation text: "녹음이 이메일로 전송되었습니다"
- Return to dashboard button

## Animations
**Minimal Use Only:**
- Recording pulse: Subtle red glow (2s ease-in-out)
- Progress transitions: Slide left (300ms) when advancing questions
- Audio waveform: Real-time visualization during recording
- Button loading states: Spinner on email submission

No animations elsewhere - maintain focus during test-taking

## Responsive Behavior
**Desktop (lg:):** 
- Admin: 2-column layout (sidebar + main)
- Student: Centered card, py-16

**Tablet/Mobile (base to md:):**
- Stack all layouts to single column
- Increase touch target sizes (min-h-12)
- Fixed bottom controls for "다음 문제" button
- Reduced padding (py-8 instead of py-16)

## Accessibility Requirements
- ARIA labels for all audio controls in Korean
- Keyboard navigation (Tab, Enter, Space for recording)
- Focus indicators on all interactive elements
- Screen reader announcements for state changes ("녹음 시작됨", "다음 문제로 이동")
- High contrast ratios throughout
- Minimum 44px touch targets on mobile

## Images
**Admin Dashboard:** Small decorative illustration in empty state ("아직 세트가 없습니다"), centered, max-w-xs
**Student Interface:** No images - completely focused on audio interaction
**Completion Screen:** Success illustration, max-w-sm, centered

## Critical UX Flows
1. Student starts test → Auto-play first question
2. After 2nd listen → Auto-enable recording button
3. Recording complete → Auto-enable next button
4. Question 15 complete → Show submit screen immediately
5. Email sending → Show loading state, then confirmation

**Forbidden Elements:** Back buttons, skip buttons, progress bar seeking, any navigation that breaks linear flow