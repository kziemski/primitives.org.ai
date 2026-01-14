/**
 * PlaceholderValueGenerator Implementation
 *
 * Provides deterministic, context-aware placeholder values for testing.
 * This generator uses keyword matching on context and hints to produce
 * appropriate values for common field names.
 *
 * **PURPOSE**: This is a test fixture generator that provides:
 * - Deterministic, predictable outputs for testing
 * - Expected behavior and API contract demonstration
 * - Specific assertions about generated content
 *
 * In production, the AIValueGenerator would be used instead.
 *
 * @packageDocumentation
 */

import type { ValueGenerator, GenerationRequest, GenerationResult } from './types.js'

/**
 * PlaceholderValueGenerator
 *
 * Generates deterministic values based on field name and context keywords.
 * Used for testing and development when AI generation is not needed.
 */
export class PlaceholderValueGenerator implements ValueGenerator {
  /**
   * Generate a context-aware placeholder value
   *
   * Uses keyword matching on the context and hint to produce contextually
   * relevant values for common field names.
   *
   * @param request - The generation request
   * @returns Promise resolving to the generated value with metadata
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const value = this.generateValue(request)
    return {
      value,
      metadata: { source: 'placeholder' },
    }
  }

  /**
   * Synchronous value generation
   *
   * This is the core generation logic, exposed for callers that need
   * synchronous operation (e.g., backward-compatible cascade.ts).
   *
   * @param request - The generation request
   * @returns The generated value string
   */
  generateSync(request: GenerationRequest): string {
    return this.generateValue(request)
  }

  /**
   * Core value generation logic
   *
   * Moved from cascade.ts generateContextAwareValue function.
   */
  private generateValue(request: GenerationRequest): string {
    const { fieldName, type, fullContext, hint, parentData = {} } = request

    // If parent has the same field, copy its value (for self-referential types like Company.competitor)
    const parentValue = parentData[fieldName]
    if (typeof parentValue === 'string' && parentValue) {
      return parentValue
    }

    const contextLower = (fullContext || '').toLowerCase()
    const hintLower = (hint || '').toLowerCase()

    // For 'name' field, use hint-based generation with keyword matching
    // Note: hint takes priority, check hint first before context
    if (fieldName === 'name') {
      if (hintLower.includes('philosopher') || contextLower.includes('philosopher'))
        return 'Aristotle'
      if (hintLower.includes('tech entrepreneur') || hintLower.includes('startup'))
        return 'Alex Chen'
      if (hint && hint.trim()) return `${type}: ${hint}`
      // Fall back to static placeholder if no context or hint
      if (!fullContext || fullContext.trim() === '') {
        return `Generated ${fieldName} for ${type}`
      }
      return `Generated ${fieldName} for ${type}`
    }

    // For 'style' field
    if (fieldName === 'style') {
      if (hintLower.includes('energetic') || contextLower.includes('energetic'))
        return 'Energetic and engaging presentation style'
      if (contextLower.includes('horror') || contextLower.includes('dark'))
        return 'Dark and atmospheric horror style'
      if (contextLower.includes('sci-fi') || contextLower.includes('futuristic'))
        return 'Atmospheric sci-fi suspense style'
      return `${fieldName}: ${fullContext}`
    }

    // For 'background' field
    if (fieldName === 'background') {
      if (hintLower.includes('tech entrepreneur') || hintLower.includes('startup'))
        return 'Tech startup founder with 10 years experience'
      if (hintLower.includes('aristocrat') || hintLower.includes('noble'))
        return 'English aristocrat from old noble family'
      if (contextLower.includes('renewable') || contextLower.includes('energy'))
        return 'Background in renewable energy sector'
      if (!fullContext || fullContext.trim() === '') {
        return `Generated ${fieldName} for ${type}`
      }
      return `${fieldName}: ${fullContext}`
    }

    // For 'specialty' field - hint takes priority over context
    if (fieldName === 'specialty') {
      // Check hint first for priority
      if (hintLower.includes('security')) return 'Security and authentication systems'
      if (hintLower.includes('history') || hintLower.includes('medieval'))
        return 'Medieval history specialist'
      // Then check context
      if (contextLower.includes('french') || contextLower.includes('restaurant'))
        return 'French classical cuisine'
      if (contextLower.includes('security')) return 'Security and authentication systems'
      if (!fullContext || fullContext.trim() === '') {
        return `Generated ${fieldName} for ${type}`
      }
      return `${fieldName}: ${fullContext}`
    }

    // For 'training' field
    if (fieldName === 'training') {
      if (contextLower.includes('french') || contextLower.includes('restaurant'))
        return 'Trained in classical French culinary techniques'
      return `${fieldName}: ${fullContext}`
    }

    // For 'backstory' field
    if (fieldName === 'backstory') {
      if (contextLower.includes('medieval') || contextLower.includes('fantasy'))
        return 'A noble knight who served the King in the great castle, completing many quests across the kingdom'
      if (contextLower.includes('sci-fi') || contextLower.includes('space'))
        return 'A starship captain with years of deep space exploration'
      return `${fieldName}: ${fullContext}`
    }

    // For 'headline' field
    if (fieldName === 'headline') {
      // Check for name mentions in context for personalized headlines
      if (contextLower.includes('codehelper')) return 'CodeHelper: Dev Tools'
      if (contextLower.includes('techcorp')) return 'TechCorp Solutions'
      if (contextLower.includes('software engineer')) return 'For Dev Teams'
      if (contextLower.includes('tech') || contextLower.includes('startup'))
        return 'Tech Startup Solutions'
      return `Headline for ${type}`.slice(0, 30)
    }

    // For 'copy' field
    if (fieldName === 'copy') {
      if (contextLower.includes('tech') || contextLower.includes('startup'))
        return 'Innovative tech solutions for startups and growing companies'
      if (contextLower.includes('marketing') || contextLower.includes('campaign'))
        return 'Effective marketing campaign for tech launch'
      return `${fieldName}: ${fullContext}`
    }

    // For 'tagline' field
    if (fieldName === 'tagline') {
      if (contextLower.includes('luxury') || contextLower.includes('premium'))
        return 'Luxury craftsmanship meets elegant design'
      if (contextLower.includes('quality') || contextLower.includes('craftsmanship'))
        return 'Premium quality with expert craftsmanship'
      if (contextLower.includes('tech')) return 'Technology for the future'
      return `${fieldName}: ${fullContext}`
    }

    // For 'description' field
    if (fieldName === 'description') {
      if (
        contextLower.includes('cyberpunk') ||
        contextLower.includes('neon') ||
        contextLower.includes('futuristic')
      )
        return 'Cyberpunk character with neural augmentations'
      if (
        contextLower.includes('luxury') ||
        contextLower.includes('high-end') ||
        contextLower.includes('premium')
      )
        return 'A luxury premium product with elegant craftsmanship'
      if (contextLower.includes('enterprise') || contextLower.includes('b2b'))
        return 'Enterprise solution for business customers'
      if (contextLower.includes('nurse') || contextLower.includes('healthcare'))
        return 'Healthcare documentation solution for nurses and medical staff'
      return `${fieldName}: ${fullContext}`
    }

    // For 'abilities' field
    if (fieldName === 'abilities') {
      if (contextLower.includes('cyberpunk') || contextLower.includes('futuristic'))
        return 'Neural hacking and digital infiltration'
      return `${fieldName}: ${fullContext}`
    }

    // For 'method' field
    if (fieldName === 'method') {
      if (hintLower.includes('wit') || hintLower.includes('sharp'))
        return 'Brilliant deduction and clever observation'
      return `${fieldName}: ${fullContext}`
    }

    // For 'expertise' field - check hint first, then context
    if (fieldName === 'expertise') {
      // Check hint first for priority
      if (
        hintLower.includes('machine learning') ||
        hintLower.includes('medical') ||
        hintLower.includes('ai')
      )
        return 'Machine learning for medical applications'
      if (hintLower.includes('physics') || hintLower.includes('professor'))
        return 'Physics professor specializing in quantum mechanics'
      if (hintLower.includes('journalist') || hintLower.includes('science'))
        return 'Science journalist covering physics research'
      // Then check context
      if (
        contextLower.includes('machine learning') ||
        contextLower.includes('medical') ||
        contextLower.includes('ai')
      )
        return 'Machine learning for medical applications'
      if (!fullContext || fullContext.trim() === '') {
        return `Generated ${fieldName} for ${type}`
      }
      return `${fieldName}: ${fullContext}`
    }

    // For 'focus' field
    if (fieldName === 'focus') {
      if (
        contextLower.includes('renewable') ||
        contextLower.includes('energy') ||
        contextLower.includes('green')
      )
        return 'Focus on sustainable energy transformation'
      if (contextLower.includes('tech') || contextLower.includes('programming'))
        return 'Focus on technical programming topics'
      return `${fieldName}: ${fullContext}`
    }

    // For 'qualifications' field
    if (fieldName === 'qualifications') {
      if (
        contextLower.includes('astrophysics') ||
        contextLower.includes('astronomy') ||
        contextLower.includes('space')
      )
        return 'PhD in Astrophysics from MIT'
      return `${fieldName}: ${fullContext}`
    }

    // For 'teachingStyle' field
    if (fieldName === 'teachingStyle') {
      if (contextLower.includes('beginner') || contextLower.includes('introduct'))
        return 'Patient and accessible approach for beginners'
      return `${fieldName}: ${fullContext}`
    }

    // For 'experience' field
    if (fieldName === 'experience') {
      if (contextLower.includes('horror') || contextLower.includes('film'))
        return 'Experience in horror film production'
      return `${fieldName}: ${fullContext}`
    }

    // For 'role' field
    if (fieldName === 'role') {
      if (
        hintLower.includes('research') ||
        hintLower.includes('machine learning') ||
        hintLower.includes('phd')
      )
        return 'Machine learning researcher'
      return `${fieldName}: ${fullContext}`
    }

    // For 'portfolio' field
    if (fieldName === 'portfolio') {
      if (
        hintLower.includes('award') ||
        hintLower.includes('beaux-arts') ||
        hintLower.includes('ecole')
      )
        return 'Award-winning design portfolio from Beaux-Arts'
      return `${fieldName}: ${fullContext}`
    }

    // For 'challenges' field
    if (fieldName === 'challenges') {
      if (contextLower.includes('enterprise') || contextLower.includes('software'))
        return 'Budget constraints and decision-making complexity in enterprise software procurement'
      if (contextLower.includes('startup') || contextLower.includes('tech'))
        return 'Scaling challenges and market competition in tech startup growth'
      return `${fieldName}: ${fullContext}`
    }

    // For 'severity' field - return one of the enum options
    if (fieldName === 'severity') {
      // Check hint for enum options like 'low/medium/high'
      if (hintLower.includes('low') || hintLower.includes('medium') || hintLower.includes('high')) {
        // Return a contextually appropriate severity
        if (contextLower.includes('critical') || contextLower.includes('urgent')) return 'high'
        if (contextLower.includes('minor') || contextLower.includes('small')) return 'low'
        return 'medium' // default to medium
      }
      return 'medium'
    }

    // For 'effort' field - return one of the enum options
    if (fieldName === 'effort') {
      if (
        hintLower.includes('easy') ||
        hintLower.includes('medium') ||
        hintLower.includes('hard')
      ) {
        if (contextLower.includes('simple') || contextLower.includes('quick')) return 'easy'
        if (contextLower.includes('complex') || contextLower.includes('difficult')) return 'hard'
        return 'medium'
      }
      return 'medium'
    }

    // For 'level' field - return one of the enum options
    if (fieldName === 'level') {
      if (
        hintLower.includes('beginner') ||
        hintLower.includes('intermediate') ||
        hintLower.includes('expert')
      ) {
        if (contextLower.includes('beginner') || contextLower.includes('basic')) return 'beginner'
        if (contextLower.includes('expert') || contextLower.includes('advanced')) return 'expert'
        return 'intermediate'
      }
      return 'intermediate'
    }

    // For 'persona' field
    if (fieldName === 'persona') {
      if (contextLower.includes('enterprise') || contextLower.includes('software'))
        return 'Enterprise software buyer persona'
      if (contextLower.includes('tech') || contextLower.includes('startup'))
        return 'Tech-savvy startup founder persona'
      return `${fieldName}: ${fullContext}`
    }

    // For 'jobTitle' field
    if (fieldName === 'jobTitle') {
      if (contextLower.includes('enterprise') || contextLower.includes('software'))
        return 'VP of Engineering'
      if (contextLower.includes('tech') || contextLower.includes('startup')) return 'CTO'
      return `${fieldName}: ${fullContext}`
    }

    // Default: include context in the generated value
    return `${fieldName}: ${fullContext}`
  }
}
