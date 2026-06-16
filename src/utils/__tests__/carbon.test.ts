import {
  formatCarbonKg,
  carbonToTrees,
  carbonToFlights,
  carbonToDrivingKm,
  getCarbonLevel,
  getVsGlobalAverage,
  calculateReductionScore,
  buildCarbonBreakdown,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getGridIntensityLevel,
} from '../carbon';

describe('formatCarbonKg', () => {
  it('formats values under 1 kg as grams', () => {
    expect(formatCarbonKg(0.5)).toBe('500g');
    expect(formatCarbonKg(0.123)).toBe('123g');
    expect(formatCarbonKg(0)).toBe('0g');
  });

  it('formats values between 1 and 999 kg with one decimal', () => {
    expect(formatCarbonKg(1)).toBe('1.0kg');
    expect(formatCarbonKg(150.6)).toBe('150.6kg');
    expect(formatCarbonKg(999.9)).toBe('999.9kg');
  });

  it('formats values 1000 kg or more as tonnes', () => {
    expect(formatCarbonKg(1000)).toBe('1.0t');
    expect(formatCarbonKg(2500)).toBe('2.5t');
    expect(formatCarbonKg(10000)).toBe('10.0t');
  });
});

describe('carbonToTrees', () => {
  it('returns 0 trees for zero emissions', () => {
    expect(carbonToTrees(0)).toBe(0);
  });

  it('calculates trees needed to offset monthly emissions', () => {
    // 21 kg/year per tree = 1.75 kg/month per tree
    // 21 kg/month → ceil((21/21)*12) = 12 trees
    expect(carbonToTrees(21)).toBe(12);
  });

  it('always rounds up to a whole tree', () => {
    // Small value: should ceil to at least 1
    expect(carbonToTrees(0.1)).toBeGreaterThanOrEqual(1);
  });
});

describe('carbonToFlights', () => {
  it('returns 0 flights for zero emissions', () => {
    expect(carbonToFlights(0)).toBe(0);
  });

  it('calculates equivalent short-haul flights', () => {
    // 255 kg/hr * 2.5 hr = 637.5 kg per flight
    const kgPerFlight = 255 * 2.5;
    expect(carbonToFlights(kgPerFlight)).toBe(1);
    expect(carbonToFlights(kgPerFlight * 2)).toBe(2);
  });

  it('returns one decimal place precision', () => {
    const result = carbonToFlights(300);
    expect(result).toBe(Math.round((300 / (255 * 2.5)) * 10) / 10);
  });
});

describe('carbonToDrivingKm', () => {
  it('returns 0 km for zero emissions', () => {
    expect(carbonToDrivingKm(0)).toBe(0);
  });

  it('converts kg CO2 to equivalent driving kilometres', () => {
    // 0.192 kg/km → 192g per km
    expect(carbonToDrivingKm(0.192)).toBe(1);
    expect(carbonToDrivingKm(19.2)).toBe(100);
  });

  it('rounds to whole kilometres', () => {
    const result = carbonToDrivingKm(1);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('getCarbonLevel', () => {
  it('returns low for 0–300 kg', () => {
    expect(getCarbonLevel(0)).toBe('low');
    expect(getCarbonLevel(150)).toBe('low');
    expect(getCarbonLevel(300)).toBe('low');
  });

  it('returns medium for 301–600 kg', () => {
    expect(getCarbonLevel(301)).toBe('medium');
    expect(getCarbonLevel(450)).toBe('medium');
    expect(getCarbonLevel(600)).toBe('medium');
  });

  it('returns high for 601–1000 kg', () => {
    expect(getCarbonLevel(601)).toBe('high');
    expect(getCarbonLevel(800)).toBe('high');
    expect(getCarbonLevel(1000)).toBe('high');
  });

  it('returns critical above 1000 kg', () => {
    expect(getCarbonLevel(1001)).toBe('critical');
    expect(getCarbonLevel(5000)).toBe('critical');
  });
});

describe('getVsGlobalAverage', () => {
  const GLOBAL_AVERAGE = 833;

  it('returns 0 when equal to global average', () => {
    expect(getVsGlobalAverage(GLOBAL_AVERAGE)).toBe(0);
  });

  it('returns negative percentage when below average', () => {
    expect(getVsGlobalAverage(0)).toBe(-100);
    expect(getVsGlobalAverage(GLOBAL_AVERAGE / 2)).toBe(-50);
  });

  it('returns positive percentage when above average', () => {
    expect(getVsGlobalAverage(GLOBAL_AVERAGE * 2)).toBe(100);
  });
});

describe('calculateReductionScore', () => {
  it('returns 0 when previous is 0 (no baseline)', () => {
    expect(calculateReductionScore(100, 0)).toBe(0);
  });

  it('returns 100 for full reduction', () => {
    expect(calculateReductionScore(0, 100)).toBe(100);
  });

  it('returns 50 for a 50% reduction', () => {
    expect(calculateReductionScore(50, 100)).toBe(50);
  });

  it('clamps at 0 when emissions increased', () => {
    expect(calculateReductionScore(200, 100)).toBe(0);
  });

  it('returns a whole number', () => {
    const result = calculateReductionScore(75, 100);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('buildCarbonBreakdown', () => {
  it('returns zero breakdown for empty entries', () => {
    const result = buildCarbonBreakdown([]);
    expect(result.total).toBe(0);
    expect(result.transport).toBe(0);
    expect(result.food).toBe(0);
  });

  it('sums entries correctly by category', () => {
    const entries = [
      { category: 'transport' as const, carbon_kg: 10 },
      { category: 'transport' as const, carbon_kg: 5 },
      { category: 'food' as const, carbon_kg: 20 },
    ];
    const result = buildCarbonBreakdown(entries);
    expect(result.transport).toBe(15);
    expect(result.food).toBe(20);
    expect(result.total).toBe(35);
  });

  it('accumulates total across all categories', () => {
    const entries = [
      { category: 'transport' as const, carbon_kg: 100 },
      { category: 'food' as const, carbon_kg: 50 },
      { category: 'electricity' as const, carbon_kg: 30 },
    ];
    const result = buildCarbonBreakdown(entries);
    expect(result.total).toBe(180);
  });

  it('places unknown categories into other', () => {
    const entries = [
      { category: 'other' as const, carbon_kg: 7 },
    ];
    const result = buildCarbonBreakdown(entries);
    expect(result.other).toBe(7);
    expect(result.total).toBe(7);
  });
});

describe('getCategoryColor', () => {
  it('returns a hex color string for each known category', () => {
    const categories = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'] as const;
    for (const cat of categories) {
      const color = getCategoryColor(cat);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('getCategoryIcon', () => {
  it('returns a non-empty string icon for each known category', () => {
    const categories = ['transport', 'food', 'electricity', 'purchases', 'waste', 'other'] as const;
    for (const cat of categories) {
      expect(getCategoryIcon(cat)).toBeTruthy();
    }
  });
});

describe('getGridIntensityLevel', () => {
  it('returns Very Clean below 100 g CO2/kWh', () => {
    expect(getGridIntensityLevel(0).label).toBe('Very Clean');
    expect(getGridIntensityLevel(99).label).toBe('Very Clean');
  });

  it('returns Clean between 100 and 199', () => {
    expect(getGridIntensityLevel(100).label).toBe('Clean');
    expect(getGridIntensityLevel(199).label).toBe('Clean');
  });

  it('returns Moderate between 200 and 399', () => {
    expect(getGridIntensityLevel(200).label).toBe('Moderate');
    expect(getGridIntensityLevel(399).label).toBe('Moderate');
  });

  it('returns High between 400 and 599', () => {
    expect(getGridIntensityLevel(400).label).toBe('High');
    expect(getGridIntensityLevel(599).label).toBe('High');
  });

  it('returns Very High at 600 and above', () => {
    expect(getGridIntensityLevel(600).label).toBe('Very High');
    expect(getGridIntensityLevel(1200).label).toBe('Very High');
  });

  it('always returns a non-empty color, icon, and advice', () => {
    for (const intensity of [50, 150, 300, 500, 800]) {
      const level = getGridIntensityLevel(intensity);
      expect(level.color).toBeTruthy();
      expect(level.icon).toBeTruthy();
      expect(level.advice).toBeTruthy();
    }
  });
});

describe('getCategoryLabel', () => {
  it('returns a human-readable label for each known category', () => {
    expect(getCategoryLabel('transport')).toBe('Transport');
    expect(getCategoryLabel('food')).toBe('Food');
    expect(getCategoryLabel('electricity')).toBe('Electricity');
    expect(getCategoryLabel('purchases')).toBe('Purchases');
    expect(getCategoryLabel('waste')).toBe('Waste');
    expect(getCategoryLabel('other')).toBe('Other');
  });
});
