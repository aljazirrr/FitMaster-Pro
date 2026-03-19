import {
  calculateOneRM,
  calculateBMI,
  calculateTDEE,
  calculateMacros,
  calculatePlates,
  kgToLbs,
  lbsToKg,
} from '../../utils/calculations';

describe('calculateOneRM', () => {
  it('returns 0 for invalid inputs', () => {
    expect(calculateOneRM(0, 10)).toBe(0);
    expect(calculateOneRM(100, 0)).toBe(0);
    expect(calculateOneRM(-10, 5)).toBe(0);
  });

  it('returns weight directly for 1 rep', () => {
    expect(calculateOneRM(100, 1)).toBe(100);
    expect(calculateOneRM(150, 1)).toBe(150);
  });

  it('calculates 1RM using Epley formula by default', () => {
    // weight * (1 + reps / 30)
    expect(calculateOneRM(100, 10)).toBe(Math.round(100 * (1 + 10 / 30)));
    expect(calculateOneRM(80, 5)).toBe(Math.round(80 * (1 + 5 / 30)));
  });

  it('calculates 1RM using Brzycki formula', () => {
    // weight * (36 / (37 - reps))
    expect(calculateOneRM(100, 10, 'brzycki')).toBe(
      Math.round(100 * (36 / (37 - 10)))
    );
    expect(calculateOneRM(80, 5, 'brzycki')).toBe(
      Math.round(80 * (36 / (37 - 5)))
    );
  });

  it('Epley and Brzycki produce different estimates for same input', () => {
    const epley = calculateOneRM(100, 8, 'epley');
    const brzycki = calculateOneRM(100, 8, 'brzycki');
    expect(epley).not.toBe(brzycki);
  });
});

describe('calculateBMI', () => {
  it('returns 0 for invalid inputs', () => {
    expect(calculateBMI(0, 178)).toBe(0);
    expect(calculateBMI(80, 0)).toBe(0);
    expect(calculateBMI(-80, 178)).toBe(0);
  });

  it('calculates BMI correctly', () => {
    // 80kg / (1.78m)^2 = 25.2
    expect(calculateBMI(80, 178)).toBe(25.2);
    // 60kg / (1.70m)^2 = 20.8
    expect(calculateBMI(60, 170)).toBe(20.8);
  });

  it('rounds to 1 decimal place', () => {
    const result = calculateBMI(75, 175);
    expect(result.toString()).toMatch(/^\d+\.\d$/);
  });
});

describe('calculateTDEE', () => {
  it('calculates TDEE for male with moderate activity', () => {
    // BMR (male) = 10*80 + 6.25*178 - 5*28 + 5 = 800 + 1112.5 - 140 + 5 = 1777.5
    // TDEE = 1777.5 * 1.55 = 2755.1 => 2755
    expect(calculateTDEE(80, 178, 28, 'male', 'moderate')).toBe(2755);
  });

  it('calculates TDEE for female with light activity', () => {
    // BMR (female) = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    // TDEE = 1345.25 * 1.375 = 1849.7 => 1850
    expect(calculateTDEE(60, 165, 25, 'female', 'light')).toBe(1850);
  });

  it('treats "other" gender same as male', () => {
    const male = calculateTDEE(75, 175, 30, 'male', 'sedentary');
    const other = calculateTDEE(75, 175, 30, 'other', 'sedentary');
    expect(male).toBe(other);
  });

  it('applies all activity multipliers correctly', () => {
    const params: [number, number, number, 'male', any] = [80, 178, 28, 'male', 'sedentary'];
    const sedentary = calculateTDEE(...params);
    const veryActive = calculateTDEE(80, 178, 28, 'male', 'very_active');
    expect(veryActive).toBeGreaterThan(sedentary);
  });
});

describe('calculateMacros', () => {
  const tdee = 2500;

  it('adjusts calories down for lose_weight', () => {
    const macros = calculateMacros(tdee, 'lose_weight');
    // 2500 - 500 = 2000 adjusted
    // protein: 2000 * 0.35 / 4 = 175
    expect(macros.protein).toBe(175);
    expect(macros.carbs).toBe(175);
    expect(macros.fat).toBe(Math.round((2000 * 0.3) / 9));
  });

  it('adjusts calories up for build_muscle', () => {
    const macros = calculateMacros(tdee, 'build_muscle');
    // 2500 + 300 = 2800 adjusted
    expect(macros.protein).toBe(Math.round((2800 * 0.3) / 4));
    expect(macros.carbs).toBe(Math.round((2800 * 0.45) / 4));
    expect(macros.fat).toBe(Math.round((2800 * 0.25) / 9));
  });

  it('uses default split for maintain', () => {
    const macros = calculateMacros(tdee, 'maintain');
    expect(macros.protein).toBe(Math.round((tdee * 0.25) / 4));
    expect(macros.carbs).toBe(Math.round((tdee * 0.45) / 4));
    expect(macros.fat).toBe(Math.round((tdee * 0.3) / 9));
  });

  it('high carbs for improve_endurance', () => {
    const endurance = calculateMacros(tdee, 'improve_endurance');
    const maintain = calculateMacros(tdee, 'maintain');
    expect(endurance.carbs).toBeGreaterThan(maintain.carbs);
  });

  it('returns positive macros for all goals', () => {
    const goals = ['lose_weight', 'build_muscle', 'maintain', 'improve_endurance', 'flexibility'] as const;
    goals.forEach((goal) => {
      const m = calculateMacros(2000, goal);
      expect(m.protein).toBeGreaterThan(0);
      expect(m.carbs).toBeGreaterThan(0);
      expect(m.fat).toBeGreaterThan(0);
    });
  });
});

describe('calculatePlates', () => {
  it('returns empty array when target equals bar weight', () => {
    expect(calculatePlates(20, 20)).toEqual([]);
  });

  it('returns empty array when target is less than bar weight', () => {
    expect(calculatePlates(15, 20)).toEqual([]);
  });

  it('calculates plates for 100kg with 20kg bar', () => {
    // 80kg total load / 2 = 40kg per side => [25, 15]
    expect(calculatePlates(100, 20)).toEqual([25, 15]);
  });

  it('calculates plates for 60kg with 20kg bar', () => {
    // 40kg total / 2 = 20kg per side => [20]
    expect(calculatePlates(60, 20)).toEqual([20]);
  });

  it('uses 20kg as default bar weight', () => {
    expect(calculatePlates(100)).toEqual(calculatePlates(100, 20));
  });

  it('handles fractional weights', () => {
    // 25kg total / 2 = 2.5kg per side => [2.5]
    expect(calculatePlates(25, 20)).toEqual([2.5]);
  });
});

describe('kgToLbs', () => {
  it('converts kg to lbs', () => {
    expect(kgToLbs(1)).toBe(2.2);
    expect(kgToLbs(80)).toBe(Math.round(80 * 2.20462 * 10) / 10);
    expect(kgToLbs(100)).toBe(220.5);
  });

  it('returns 0 for 0 kg', () => {
    expect(kgToLbs(0)).toBe(0);
  });
});

describe('lbsToKg', () => {
  it('converts lbs to kg', () => {
    expect(lbsToKg(220.5)).toBeCloseTo(100, 0);
    expect(lbsToKg(0)).toBe(0);
  });

  it('is approximately inverse of kgToLbs', () => {
    const kg = 80;
    const lbs = kgToLbs(kg);
    expect(lbsToKg(lbs)).toBeCloseTo(kg, 0);
  });
});
