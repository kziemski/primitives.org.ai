# ai-functions

Call AI like you'd talk to a colleague. No prompts. No configuration. Just say what you need.

```typescript
import { ai, list, is } from 'ai-functions'

// Ask for anything - it reads like English
const qualified = is`${lead} a good fit for our enterprise plan?`
const ideas = list`blog posts that would resonate with ${persona}`
const { summary, nextSteps } = ai`analyze this sales call: ${transcript}`
```

## Installation

```bash
pnpm add ai-functions
```

## The Magic: Promise Pipelining

Chain operations naturally—no `await` needed until you actually need the result:

```typescript
// Destructure to get exactly what you need
const { qualified, score, reason } = ai`qualify this lead: ${lead}`

// Chain functions together—dependencies resolve automatically
const followUp = ai`write follow-up email based on: ${reason}`
const subject = ai`subject line for: ${followUp}`

// Only await when you need the actual value
if (await qualified) {
  await sendEmail({ to: lead.email, subject: await subject, body: await followUp })
}
```

## Real-World Examples

### Lead Qualification

```typescript
const { score, qualified, reasoning } = ai`
  qualify ${lead} for our product
  considering: ${idealCustomerProfile}
`

if (await qualified) {
  await assignToSales(lead)
}
```

### Content Marketing

```typescript
// Generate topic ideas for your audience
const topics = list`content ideas for ${persona} in ${industry}`

// Evaluate each in parallel—single LLM call!
const evaluated = await topics.map(topic => ({
  topic,
  potential: is`${topic} would drive signups?`,
  difficulty: ai`content difficulty for: ${topic}`,
}))

// Pick the best
const winner = evaluated.find(t => t.potential && t.difficulty === 'easy')
```

### Sales Intelligence

```typescript
const { pros, cons, objections } = lists`
  competitive analysis: ${ourProduct} vs ${competitor}
`

const battleCard = ai`
  sales battlecard addressing: ${objections}
  highlighting: ${pros}
`
```

### Customer Success

```typescript
// Analyze customer health
const { healthy, churnRisk, opportunities } = ai`
  analyze customer health for ${customer}
  based on: ${usageData}
`

if (await churnRisk) {
  const outreach = ai`retention outreach for ${customer} addressing ${churnRisk}`
  await scheduleCall(customer, await outreach)
}
```

### Recruiting

```typescript
const candidates = list`source ${role} candidates from ${jobBoards}`

const evaluated = await candidates.map(candidate => ({
  candidate,
  fit: is`${candidate} matches ${requirements}?`,
  summary: ai`one-line summary of ${candidate}`,
}))

const shortlist = evaluated.filter(c => c.fit)
```

## API Reference

### Generation

```typescript
ai`anything you need`              // flexible object/text
write`blog post about ${topic}`    // long-form content
summarize`${document}`             // condense to key points
list`ideas for ${topic}`           // array of items
lists`pros and cons of ${topic}`   // named lists
extract`emails from ${text}`       // structured extraction
```

### Classification

```typescript
is`${email} spam?`                           // boolean
decide`which converts better?`(optionA, optionB)  // pick best
```

### Code & Visuals

```typescript
code`email validation function`    // generate code
diagram`user flow for ${feature}`  // mermaid diagrams
slides`pitch deck for ${startup}`  // presentations
image`hero image for ${brand}`     // image generation
```

### Research & Web

```typescript
research`${competitor} market position`  // web research
read`${url}`                              // url to markdown
browse`${url}`                            // browser automation
```

### Human-in-the-Loop

```typescript
ask`what's the priority for ${feature}?`   // free-form input
approve`deploy ${version} to production?`  // yes/no approval
review`${document}`                        // detailed feedback
```

## The `lists` Function

Get exactly what you ask for through destructuring:

```typescript
// Just name what you want—the schema is inferred!
const { pros, cons } = lists`pros and cons of ${decision}`
const { strengths, weaknesses, opportunities, threats } = lists`SWOT for ${company}`
const { mustHave, niceToHave, outOfScope } = lists`requirements for ${feature}`
```

## Batch Processing with `.map()`

Process arrays in a single LLM call:

```typescript
const leads = await list`leads from ${campaign}`

// Each field evaluated for each lead—all in ONE call
const qualified = await leads.map(lead => ({
  lead,
  score: ai`score 1-100: ${lead}`,
  qualified: is`${lead} matches ${icp}?`,
  nextStep: ai`recommended action for ${lead}`,
}))

// Filter and act
qualified
  .filter(l => l.qualified)
  .forEach(l => createTask(l.nextStep))
```

## Typed Schemas with `AI()`

For reusable, typed functions:

```typescript
const ai = AI({
  qualifyLead: {
    score: 'Lead score 1-100 (number)',
    qualified: 'Whether to pursue (boolean)',
    reasoning: 'Explanation of score',
    nextSteps: ['Recommended actions'],
  },

  analyzeCompetitor: {
    positioning: 'How they position themselves',
    strengths: ['Their advantages'],
    weaknesses: ['Their disadvantages'],
    battleCard: 'Key talking points for sales',
  },
})

// Fully typed!
const result = await ai.qualifyLead('Enterprise CTO interested in AI automation')
result.score      // number
result.qualified  // boolean
result.nextSteps  // string[]
```

## Schema Syntax

| Syntax | Type | Example |
|--------|------|---------|
| `'description'` | string | `name: 'Company name'` |
| `'desc (number)'` | number | `score: 'Score 1-100 (number)'` |
| `'desc (boolean)'` | boolean | `qualified: 'Pursue? (boolean)'` |
| `'opt1 \| opt2'` | enum | `priority: 'high \| medium \| low'` |
| `['description']` | array | `steps: ['Action items']` |
| `{ nested }` | object | `contact: { name, email }` |

## Philosophy

**Code should read like conversation.**

Compare:
```typescript
// Traditional AI code
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: `Analyze this lead: ${JSON.stringify(lead)}` }],
  response_format: { type: "json_object" },
})
const result = JSON.parse(response.choices[0].message.content)
```

```typescript
// ai-functions
const { qualified, score, nextStep } = ai`analyze lead: ${lead}`
```

The second version is what you'd say to a colleague. That's the goal.

## Related Packages

- [`ai-database`](../ai-database) — AI-powered database operations
- [`ai-providers`](../ai-providers) — Model provider abstraction
- [`language-models`](../language-models) — Model definitions
