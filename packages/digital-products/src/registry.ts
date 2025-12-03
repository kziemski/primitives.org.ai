/**
 * Product registry implementation
 */

import type { ProductDefinition, ProductRegistry } from './types.js'

/**
 * In-memory product registry
 */
class InMemoryProductRegistry implements ProductRegistry {
  private products = new Map<string, ProductDefinition>()

  register(product: ProductDefinition): void {
    this.products.set(product.id, product)
  }

  get(id: string): ProductDefinition | undefined {
    return this.products.get(id)
  }

  list(): ProductDefinition[] {
    return Array.from(this.products.values())
  }

  listByType<T extends ProductDefinition['type']>(type: T): Extract<ProductDefinition, { type: T }>[] {
    return this.list().filter((p) => p.type === type) as Extract<ProductDefinition, { type: T }>[]
  }

  remove(id: string): boolean {
    return this.products.delete(id)
  }

  clear(): void {
    this.products.clear()
  }
}

/**
 * Global product registry instance
 */
export const registry: ProductRegistry = new InMemoryProductRegistry()
