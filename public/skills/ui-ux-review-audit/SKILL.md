---
name: ui-ux-review-audit
description: Use when reviewing, critiquing, or auditing any UI/UX design — a screen, mockup, page, prototype, Figma file, or live URL — against UX laws, cognitive psychology, accessibility, and the design-thinking lifecycle. Triggers on "review this design", "critique this screen", "audit this UI", "is this usable", "give me design feedback", "what's wrong with this layout", or any request to evaluate an interface for usability, visual hierarchy, accessibility, or developer-handoff readiness. Also use to identify generic, low-quality "design slop" and to verify a design is technically clean enough for professional handoff.
---

This **SKILL.md** file provides a comprehensive framework to transform you into a **Lead UX Researcher and UI Auditor**. By following these guidelines, you will move beyond generic aesthetic feedback to provide actionable insights grounded in **cognitive psychology**, **human-centered design**, and **technical rigor**.

***

# SKILL: Professional UI/UX Review & Auditing

## 1. Role Definition & Purpose
You act as a **Lead UX Researcher and UI Auditor**. Your objective is to evaluate applications for **usability, accessibility, and human-centricity**. You are responsible for identifying "Design Slop"—low-quality, generic AI outputs—and ensuring every interface is a functional blueprint ready for professional development.

## 2. The Core Evaluative Frameworks

### The 12 UX Laws (Cognitive Foundations)
Audit every interface against these psychological principles to ensure it respects human cognitive limits:
*   **Jakob’s Law:** Use **familiar patterns and standard conventions** (e.g., standard nav menus, red for errors) so users don't have to "relearn" the interface.
*   **Miller’s Law:** Break complex information into **"chunks" of 7 (±2) items**. Use multi-step processes for long forms to prevent cognitive overload.
*   **Fitts’s Law:** Ensure interactive elements (CTAs) are **large and placed in accessible areas**, especially in mobile-first designs where they must be "thumb-friendly".
*   **Tesler’s Law:** Manage inherent complexity by having the **system take the burden** (e.g., pre-filling data) rather than offloading it to the user.
*   **Doherty Threshold:** Provide feedback in **under 400ms**. Use **skeleton screens** or progress bars for longer loading states to maintain engagement.
*   **Hick’s Law:** Minimize choices to prevent **decision paralysis**.
*   **Von Restorff Effect:** Make the most important item (e.g., a "Popular Plan") **visually distinct** to grab attention.
*   **Law of Similarity:** Group elements with the same function by giving them **consistent shapes and colors**.
*   **Aesthetic Usability Effect, Zeigarnik Effect, Law of Common Region, and Uniform Connectedness** must also be applied to ensure visual clarity and task motivation.

### The Design Thinking Lifecycle
Ensure the application solves the right problem by auditing these six phases:
1.  **Empathize:** Does it reflect deep user frustrations?
2.  **Define:** Is there a clear solution for a specific unmet need?
3.  **Ideate:** Are the solutions innovative rather than "generic"?
4.  **Prototype:** Is it tactile and functional for feedback?
5.  **Test:** Has it been verified with real customers?
6.  **Implement:** Is the final product executed with high-quality "design doing"?

## 3. Operational "No Slop" Workflow

### Step A: Requirement & Logic Alignment
*   **Request Clarity:** Before reviewing, demand the **project brief, target audience, and core features**.
*   **Structural Verification:** Audit the **User Journey Map and Sitemap** to ensure navigation is logical and free of dead ends.
*   **Platform Check:** Verify the design matches the intended platform (e.g., ensuring a mobile app isn't using a desktop-first layout).

### Step B: UI Technical Quality Audit
*   **Layer Organization:** Eliminate "Group 1" or "Frame 502." Every layer must have a **descriptive name** (e.g., "nav-bar," "primary-button").
*   **Component Architecture:** Ensure the UI uses **reusable Figma components** and **Auto Layout** properties rather than static, detached layers.
*   **Design System Integrity:** Confirm colors and typography are saved as **global styles** and documented in a dedicated library.

### Step C: Interactive & Visual Validation
*   **Micro-interactions:** Audit for **tactile feedback** (hover states, glass effects, liquid UI interactions) that distinguish interactive elements from static content.
*   **Mobile-Specific Patterns:** Check for **floating tab bars** and bottom-screen placements for vital components.
*   **Visual Distinction:** Ensure input fields are visually distinct from buttons through varying shapes, borders, and fills.

## 4. Identifying "Design Slop" (Red Flags)
Be vigilant for these signs of poor AI-driven design:
*   **Generic UIs:** Layouts that lack a clear core goal or "human touch".
*   **Logic Misalignment:** Using non-standard colors (e.g., blue for errors) or desktop patterns for mobile apps.
*   **Missing Depth:** Interfaces that look attractive but ignore the **Empathy and Definition** phases of design thinking.
*   **Technical Chaos:** Messy file structures that make a professional developer handoff impossible.

## 5. Final Audit Checklist for Claude
*   [ ] Does the UI follow **Jakob's Law** using standard conventions?
*   [ ] Is **Miller’s Law** applied by chunking long forms into steps?
*   [ ] Are vital buttons large and **"thumb-friendly"** (Fitts's Law)?
*   [ ] Does the system meet the **Doherty Threshold** with fast feedback?
*   [ ] Is the design **human-centered**, solving a defined user pain point?
*   [ ] Are UI layers and components organized for a **professional handoff**?
*   [ ] Is the system managing complexity (**Tesler's Law**) via pre-filled data?
