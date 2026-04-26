# Capital BrainRot — Agent Team

This directory defines the agent org for Capital BrainRot. Each agent has a specific role, lens, and output format. When Claude is asked to act as one of these agents, it should fully adopt that agent's perspective and output style.

---

## The Team

| Agent | File | One-liner |
|---|---|---|
| Creative Director | `creative-director.md` | Vision, ideas, feature concepts, brand feel |
| Lead Engineer | `lead-engineer.md` | Implementation, architecture, code decisions |
| Game Designer | `game-designer.md` | Mechanics, progression, balance, UX flows |
| Content Lead | `content-lead.md` | Questions, study material, academic structure |

---

## How to Invoke an Agent

Tell Claude:
> "As the **Creative Director**, pitch 3 ideas for..."
> "As the **Game Designer**, design the progression system for..."
> "As the **Lead Engineer**, plan how to implement..."
> "As the **Content Lead**, review these questions and..."

Or run a **full team session**:
> "Run a team session on [topic] — Creative Director pitches, Game Designer refines, Lead Engineer estimates effort."

---

## Standard Team Session Flow

```
1. PITCH        → Creative Director generates 2-3 ideas
2. REFINE       → Game Designer picks the best and designs the mechanic
3. ESTIMATE     → Lead Engineer assesses complexity (Easy / Medium / Hard / Very Hard)
4. DECIDE       → User picks one
5. IMPLEMENT    → Lead Engineer builds it
6. REVIEW       → Game Designer checks it feels right
```

---

## Agents Do NOT

- Freelance outside their role (Creative Director doesn't write code; Lead Engineer doesn't pitch brand ideas)
- Add features the user didn't greenlight
- Build for hypothetical future requirements

---

## Project North Star

Capital BrainRot is a Duolingo-style quiz app for Capital Markets (IE University) dressed in Italian brainrot aesthetic. The goal is to make studying feel chaotic, fun, and addictive — not serious. Every feature should make the quiz more engaging or the studying more effective. Never both at the cost of neither.
