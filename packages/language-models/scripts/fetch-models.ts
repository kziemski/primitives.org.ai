#!/usr/bin/env npx tsx
/**
 * Fetch models from OpenRouter API and save to data/models.json
 *
 * Fetches from both:
 * - /api/v1/models - Basic model info
 * - /api/frontend/models - Provider routing info (provider_model_id, endpoint)
 *
 * Usage: npx tsx scripts/fetch-models.ts
 */

import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'data', 'models.json')

interface FrontendModel {
  slug: string
  endpoint?: {
    provider_model_id?: string
    provider_slug?: string
    provider_info?: {
      baseUrl?: string
    }
  }
}

async function fetchModels() {
  console.log('Fetching models from OpenRouter API...')

  // Fetch basic model info
  const modelsResponse = await fetch('https://openrouter.ai/api/v1/models')
  if (!modelsResponse.ok) {
    throw new Error(`Failed to fetch models: ${modelsResponse.status} ${modelsResponse.statusText}`)
  }
  const modelsData = await modelsResponse.json()
  const models = modelsData.data || modelsData

  console.log(`Found ${models.length} models from v1 API`)

  // Fetch frontend models for provider routing info
  console.log('Fetching provider routing info from frontend API...')
  let frontendModels: FrontendModel[] = []
  try {
    const frontendResponse = await fetch('https://openrouter.ai/api/frontend/models')
    if (frontendResponse.ok) {
      const frontendData = await frontendResponse.json()
      frontendModels = Array.isArray(frontendData) ? frontendData : (frontendData.data || [])
      console.log(`Found ${frontendModels.length} models from frontend API`)
    }
  } catch (err) {
    console.warn('Could not fetch frontend models, continuing without provider routing info')
  }

  // Create a map of frontend models by slug for quick lookup
  const frontendMap = new Map<string, FrontendModel>()
  for (const fm of frontendModels) {
    if (fm.slug) {
      frontendMap.set(fm.slug, fm)
    }
  }

  // Merge frontend data into models
  let enrichedCount = 0
  for (const model of models) {
    const frontend = frontendMap.get(model.id)
    if (frontend?.endpoint) {
      // Add provider routing info from nested endpoint
      if (frontend.endpoint.provider_model_id) {
        model.provider_model_id = frontend.endpoint.provider_model_id
      }
      if (frontend.endpoint.provider_slug) {
        model.provider = frontend.endpoint.provider_slug
      }
      if (frontend.endpoint.provider_info?.baseUrl) {
        model.endpoint = {
          baseUrl: frontend.endpoint.provider_info.baseUrl,
          modelId: frontend.endpoint.provider_model_id || model.id.split('/')[1]
        }
      }
      enrichedCount++
    } else {
      // Extract provider from ID as fallback
      const slashIndex = model.id.indexOf('/')
      if (slashIndex > 0) {
        model.provider = model.id.substring(0, slashIndex)
      }
    }
  }

  console.log(`Enriched ${enrichedCount} models with provider routing info`)

  // Sort by created date (newest first)
  models.sort((a: any, b: any) => (b.created || 0) - (a.created || 0))

  writeFileSync(OUTPUT_PATH, JSON.stringify(models, null, 2))
  console.log(`Saved to ${OUTPUT_PATH}`)

  // Print some stats
  const providers = new Set(models.map((m: any) => m.id.split('/')[0]))
  console.log(`\nProviders: ${[...providers].join(', ')}`)

  // Show which direct providers have routing info
  const directProviders = ['openai', 'anthropic', 'google']
  for (const provider of directProviders) {
    const withRouting = models.filter((m: any) =>
      m.id.startsWith(`${provider}/`) && m.provider_model_id
    )
    console.log(`${provider}: ${withRouting.length} models with provider_model_id`)
  }
}

fetchModels().catch(console.error)
