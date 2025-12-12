/**
 * Manifest builder utility
 */

export class ManifestBuilder {
  private manifest: Record<string, unknown> = {};

  setName(name: string): this {
    this.manifest.name = name;
    return this;
  }

  setVersion(version: string): this {
    this.manifest.version = version;
    return this;
  }

  setType(type: 'detector' | 'recipe' | 'rule' | 'model'): this {
    this.manifest.type = type;
    return this;
  }

  setEntry(entry: string): this {
    this.manifest.entry = entry;
    return this;
  }

  setAuthor(author: string): this {
    this.manifest.author = author;
    return this;
  }

  setDescription(description: string): this {
    this.manifest.description = description;
    return this;
  }

  addDependency(name: string, version: string): this {
    if (!this.manifest.dependencies) {
      this.manifest.dependencies = {};
    }
    (this.manifest.dependencies as Record<string, string>)[name] = version;
    return this;
  }

  build(): Record<string, unknown> {
    return { ...this.manifest };
  }
}
