# Legal AI Document Review App - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from legal tech platforms like LegalZoom and Notion for clean, professional interfaces that build trust while remaining accessible.

## Core Design Elements

### Color Palette
**Primary Colors (Dark Mode)**:
- Background: 217 19% 12% (dark slate)
- Surface: 217 19% 18% (elevated dark slate)
- Primary: 217 91% 60% (professional blue)
- Text Primary: 0 0% 95% (near white)

**Primary Colors (Light Mode)**:
- Background: 0 0% 98% (off white)
- Surface: 0 0% 100% (white)
- Primary: 217 91% 45% (professional blue)
- Text Primary: 217 19% 15% (dark slate)

**Accent Colors**:
- Success: 142 76% 36% (green for low risk)
- Warning: 38 92% 50% (amber for medium risk)
- Danger: 0 84% 60% (red for high risk)
- Info: 199 89% 48% (cyan for neutral information)

### Typography
- **Primary Font**: Inter (Google Fonts) - clean, professional, excellent readability
- **Headings**: Inter 600-700 weight
- **Body Text**: Inter 400-500 weight
- **Legal Text**: Inter 400 weight with increased line spacing (1.6) for document readability

### Layout System
**Spacing Units**: Consistent use of Tailwind units 2, 4, 6, 8, 12, 16
- Tight spacing: p-2, m-2 for compact elements
- Standard spacing: p-4, m-4 for most components
- Generous spacing: p-8, m-8 for section breaks
- Large spacing: p-16 for major layout divisions

### Component Library

**Navigation**:
- Fixed top navigation with subtle shadow
- Logo/brand on left, user profile/actions on right
- Clean, minimal design with primary color highlights

**Document Upload Zone**:
- Large, prominent drag-and-drop area with dashed border
- Upload icon and clear instructions
- File type indicators (PDF, DOC, TXT)
- Progress indicators during processing

**Analysis Dashboard**:
- Split-pane layout: document viewer (60%) + analysis panel (40%)
- Collapsible sidebar for mobile responsiveness
- Risk level cards with color-coded severity indicators

**Interactive Q&A Section**:
- Chat-like interface with AI questions and user responses
- Conversation bubbles with clear visual distinction
- Input field with smart suggestions

**Risk Assessment Cards**:
- Color-coded borders matching risk levels
- Clear headings with severity indicators
- Expandable sections for detailed explanations
- Action buttons for addressing issues

**Document Viewer**:
- Clean PDF/text rendering with zoom controls
- Highlight overlays for flagged sections
- Annotation system for AI-identified risks
- Side-by-side comparison view for suggestions

### Professional Trust Elements
- Subtle security badges and encryption indicators
- Clean, lawyer-office inspired aesthetics
- Consistent use of legal iconography (scales, documents, shields)
- Professional color scheme avoiding overly bright or playful colors

### Animations
**Minimal and Purposeful**:
- Subtle fade-ins for content loading
- Smooth transitions between analysis states
- Progress indicators for document processing
- No distracting or excessive animations

### Responsive Design
- Mobile-first approach with collapsible panels
- Touch-friendly interface elements
- Optimized document viewing on smaller screens
- Accessible form inputs and navigation

This design prioritizes trust, professionalism, and clarity - essential qualities for a legal application where users need confidence in the AI's analysis and recommendations.