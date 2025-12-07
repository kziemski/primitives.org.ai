# ai-workflows

Event-driven workflows with the `$` context. Handle events, schedule tasks, and orchestrate processes.

```typescript
import { Workflow } from 'ai-workflows'

const workflow = Workflow($ => {
  $.on.Customer.created(async (customer, $) => {
    $.log('New customer:', customer.name)
    await $.send('Email.welcome', { to: customer.email })
  })

  $.every.Monday.at9am(async ($) => {
    $.log('Weekly standup reminder')
  })
})

await workflow.start()
await workflow.send('Customer.created', { name: 'John', email: 'john@example.com' })
```

## Installation

```bash
pnpm add ai-workflows
```

## The `$` Context

Everything flows through `$`. It's your workflow's connection to events, schedules, state, and the outside world.

```typescript
Workflow($ => {
  // Event handlers
  $.on.Order.completed(async (order, $) => {
    await $.send('Invoice.generate', { orderId: order.id })
    $.log('Order completed', order)
  })

  // Scheduled tasks
  $.every.hour(async ($) => {
    $.log('Hourly health check')
  })
})
```

## Event Handling

Events follow the `Noun.verb` pattern:

```typescript
$.on.Customer.created(handler)   // Customer created
$.on.Order.shipped(handler)      // Order shipped
$.on.Payment.failed(handler)     // Payment failed
$.on.Ticket.resolved(handler)    // Ticket resolved
```

### Sending Events

```typescript
// Fire and forget
await $.send('Email.welcome', { to: 'user@example.com' })

// Execute and wait for result (durable)
const result = await $.do('Order.process', orderData)

// Execute without durability
const result = await $.try('Order.validate', orderData)
```

## Scheduling

Natural language scheduling with `$.every`:

```typescript
// Simple intervals
$.every.second(handler)
$.every.minute(handler)
$.every.hour(handler)
$.every.day(handler)
$.every.week(handler)

// Days of the week
$.every.Monday(handler)
$.every.Friday(handler)
$.every.weekday(handler)
$.every.weekend(handler)

// Day + time combinations
$.every.Monday.at9am(handler)
$.every.Friday.at5pm(handler)
$.every.weekday.at8am(handler)

// Intervals with values
$.every.minutes(30)(handler)
$.every.hours(4)(handler)

// Natural language (requires AI converter)
$.every('first Monday of the month at 9am', handler)
$.every('every 15 minutes during business hours', handler)
```

### Available Times

```typescript
.at6am   .at7am   .at8am   .at9am   .at10am  .at11am
.at12pm  .atnoon  .at1pm   .at2pm   .at3pm   .at4pm
.at5pm   .at6pm   .at7pm   .at8pm   .at9pm   .atmidnight
```

## Standalone API

Use `on`, `every`, and `send` for global registration:

```typescript
import { on, every, send } from 'ai-workflows'

on.Customer.created(async (customer, $) => {
  await $.send('Email.welcome', { to: customer.email })
})

every.hour(async ($) => {
  $.log('Hourly task')
})

await send('Customer.created', { name: 'John' })
```

## Real-World Examples

### Order Processing

```typescript
const workflow = Workflow($ => {
  $.on.Order.placed(async (order, $) => {
    $.log('Processing order', order.id)

    // Validate inventory
    const valid = await $.do('Inventory.check', order.items)
    if (!valid) {
      await $.send('Order.cancelled', { orderId: order.id, reason: 'Out of stock' })
      return
    }

    // Process payment
    const payment = await $.do('Payment.charge', {
      amount: order.total,
      customer: order.customerId,
    })

    // Fulfill order
    await $.send('Fulfillment.ship', { orderId: order.id })
  })

  $.on.Order.shipped(async (data, $) => {
    await $.send('Email.tracking', { orderId: data.orderId })
  })
})
```

### Customer Lifecycle

```typescript
Workflow($ => {
  $.on.Customer.signedUp(async (customer, $) => {
    await $.send('Email.welcome', { to: customer.email })
    await $.send('Slack.notify', { message: `New signup: ${customer.name}` })
  })

  $.on.Customer.upgraded(async (customer, $) => {
    await $.send('Email.upgradeConfirmation', { to: customer.email })
    await $.send('Analytics.track', { event: 'upgrade', plan: customer.plan })
  })

  // Check for inactive users daily
  $.every.day.at9am(async ($) => {
    const inactive = await $.do('Customer.findInactive', { days: 30 })
    for (const customer of inactive) {
      await $.send('Email.reengagement', { to: customer.email })
    }
  })
})
```

### Scheduled Reports

```typescript
Workflow($ => {
  $.every.Monday.at9am(async ($) => {
    const report = await $.do('Analytics.weeklyReport', {})
    await $.send('Email.report', {
      to: 'team@company.com',
      report,
    })
  })

  $.every.month(async ($) => {
    const metrics = await $.do('Metrics.monthly', {})
    await $.send('Dashboard.update', { metrics })
  })
})
```

## Workflow Instance

The `Workflow()` function returns an instance with:

```typescript
const workflow = Workflow($ => { /* ... */ })

// Access the workflow
workflow.definition  // Event and schedule registrations
workflow.state       // Current state and history
workflow.$           // The $ context

// Control the workflow
await workflow.start()  // Begin processing schedules
await workflow.stop()   // Stop all schedules

// Send events
await workflow.send('Customer.created', { name: 'John' })
```

## Testing

Create isolated test contexts:

```typescript
import { createTestContext } from 'ai-workflows'

const $ = createTestContext()

// Call your handler
await yourHandler({ name: 'test' }, $)

// Check what was emitted
expect($.emittedEvents).toContainEqual({
  event: 'Email.welcome',
  data: { to: 'test@example.com' },
})
```

## API Reference

### Workflow Functions

| Export | Description |
|--------|-------------|
| `Workflow($)` | Create a workflow with $ context |
| `on` | Standalone event registration |
| `every` | Standalone schedule registration |
| `send` | Emit events globally |
| `createTestContext()` | Create isolated $ for testing |

### Context Methods

| Method | Description |
|--------|-------------|
| `$.on.Noun.verb(handler)` | Register event handler |
| `$.every.*` | Register scheduled handler |
| `$.send(event, data)` | Emit event (fire and forget) |
| `$.do(event, data)` | Execute handler (durable) |
| `$.try(event, data)` | Execute handler (non-durable) |
| `$.log(message, data?)` | Log with history |
| `$.state` | Access workflow state |

### Schedule Helpers

| Export | Description |
|--------|-------------|
| `toCron(description)` | Convert to cron expression |
| `setCronConverter(fn)` | Set AI cron converter |
| `intervalToMs(interval)` | Get interval in milliseconds |
| `formatInterval(interval)` | Format for display |

## Types

```typescript
interface WorkflowContext {
  on: OnProxy
  every: EveryProxy
  send<T>(event: string, data: T): Promise<void>
  do<T, R>(event: string, data: T): Promise<R>
  try<T, R>(event: string, data: T): Promise<R>
  log(message: string, data?: unknown): void
  state: Record<string, unknown>
  db?: DatabaseContext
}

interface WorkflowInstance {
  definition: WorkflowDefinition
  state: WorkflowState
  $: WorkflowContext
  send<T>(event: string, data: T): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
}
```

## Related Packages

- [`ai-functions`](../ai-functions) — AI-powered functions
- [`ai-database`](../ai-database) — Durable event storage
- [`human-in-the-loop`](../human-in-the-loop) — Human workflow steps
- [`digital-tasks`](../digital-tasks) — Task management
