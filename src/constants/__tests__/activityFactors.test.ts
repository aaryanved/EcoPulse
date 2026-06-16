import { SUBCATEGORIES, getSubcategory, estimateLocalCarbon } from '../activityFactors';

describe('SUBCATEGORIES', () => {
  const ALL_CATEGORIES = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'] as const;

  it('defines subcategories for every activity category', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(SUBCATEGORIES[cat]).toBeDefined();
      expect(SUBCATEGORIES[cat].length).toBeGreaterThan(0);
    }
  });

  it('every subcategory has id, label, unit, and kgPerUnit', () => {
    for (const cat of ALL_CATEGORIES) {
      for (const sub of SUBCATEGORIES[cat]) {
        expect(typeof sub.id).toBe('string');
        expect(typeof sub.label).toBe('string');
        expect(typeof sub.unit).toBe('string');
        expect(typeof sub.kgPerUnit).toBe('number');
      }
    }
  });

  it('all subcategory ids are unique across categories', () => {
    const all = Object.values(SUBCATEGORIES).flat();
    const ids = all.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('car petrol emission factor matches known reference value', () => {
    const petrol = SUBCATEGORIES.transport.find(s => s.id === 'car_petrol');
    expect(petrol?.kgPerUnit).toBe(0.192);
    expect(petrol?.unit).toBe('km');
  });

  it('recycling and composting have negative factors (emissions saved)', () => {
    const recycling = SUBCATEGORIES.waste.find(s => s.id === 'recycling');
    const compost = SUBCATEGORIES.waste.find(s => s.id === 'compost');
    expect(recycling?.kgPerUnit).toBeLessThan(0);
    expect(compost?.kgPerUnit).toBeLessThan(0);
  });
});

describe('getSubcategory', () => {
  it('finds a subcategory by id', () => {
    const result = getSubcategory('car_petrol');
    expect(result).toBeDefined();
    expect(result?.label).toBe('Car (Petrol)');
  });

  it('returns undefined for an unknown id', () => {
    expect(getSubcategory('nonexistent_id')).toBeUndefined();
  });

  it('finds subcategories across all categories', () => {
    expect(getSubcategory('beef')).toBeDefined();
    expect(getSubcategory('home_electricity')).toBeDefined();
    expect(getSubcategory('clothing')).toBeDefined();
    expect(getSubcategory('general_waste')).toBeDefined();
    expect(getSubcategory('custom')).toBeDefined();
  });
});

describe('estimateLocalCarbon', () => {
  it('returns 0 for an unknown subcategory', () => {
    expect(estimateLocalCarbon('unknown', 10)).toBe(0);
  });

  it('returns 0 for zero quantity', () => {
    expect(estimateLocalCarbon('car_petrol', 0)).toBe(0);
  });

  it('multiplies quantity by the emission factor', () => {
    // car_petrol: 0.192 kg/km
    expect(estimateLocalCarbon('car_petrol', 100)).toBeCloseTo(19.2);
    expect(estimateLocalCarbon('car_petrol', 1)).toBeCloseTo(0.192);
  });

  it('returns negative values for emission-saving activities', () => {
    expect(estimateLocalCarbon('recycling', 10)).toBeLessThan(0);
    expect(estimateLocalCarbon('compost', 5)).toBeLessThan(0);
  });

  it('calculates beef emissions correctly', () => {
    // beef: 27 kg CO2 per kg
    expect(estimateLocalCarbon('beef', 2)).toBeCloseTo(54);
  });
});
