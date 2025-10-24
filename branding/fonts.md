# Recally Typography

Recally uses system fonts to maintain a fast, clean, and consistent design across all platforms.
The below is really not strict. Experiment away and see what works, but try to document or standardize experiments here or somewhere else

## Primary Font
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

This stack automatically adapts to each operating system's native UI font.

## Font Weights
- **400 (Normal):** Body text
- **500 (Medium):** Buttons, UI elements
- **600–700 (Semibold/Bold):** Headings and key highlights

## Font Sizes (Recommended)
| Element | Size | Example |
|----------|------|----------|
| Heading | 18–20px | `h1 { font-size: 20px; font-weight: 600; }` |
| Body | 14–16px | `p { font-size: 14px; line-height: 1.5; }` |
| Small Text | 12–13px | For secondary info |