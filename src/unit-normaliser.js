class UnitNormaliser {
  constructor() {
    this.namesVarients = {};
  }

  addAlias(unitName, alias) {
    if (!unitName) throw new Error('absent name!');
    if (!alias) throw new Error('absent alias!');

    if (!this.namesVarients[unitName]) {
      this.namesVarients[unitName] = unitName;
    }
    this.namesVarients[alias.toLowerCase()] = unitName;
  }

  normalise(alias) {
    if (!alias) return;
    return this.namesVarients[alias.toLowerCase()];
  }
}

export default UnitNormaliser;
