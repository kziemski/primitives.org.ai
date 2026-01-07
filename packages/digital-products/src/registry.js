/**
 * Product registry implementation
 */
/**
 * In-memory product registry
 */
class InMemoryProductRegistry {
    products = new Map();
    register(product) {
        this.products.set(product.id, product);
    }
    get(id) {
        return this.products.get(id);
    }
    list() {
        return Array.from(this.products.values());
    }
    listByType(type) {
        return this.list().filter((p) => p.type === type);
    }
    remove(id) {
        return this.products.delete(id);
    }
    clear() {
        this.products.clear();
    }
}
/**
 * Global product registry instance
 */
export const registry = new InMemoryProductRegistry();
