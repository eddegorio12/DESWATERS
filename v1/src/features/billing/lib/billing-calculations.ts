type TariffTierInput = {
  minVolume: number;
  maxVolume: number | null;
  ratePerCuM: number;
};

type ActiveTariffInput = {
  minimumCharge: number;
  minimumUsage: number;
  tiers: TariffTierInput[];
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatBillingPeriod(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function calculateBillDueDate(readingDate: Date) {
  const dueDate = new Date(readingDate);
  dueDate.setDate(dueDate.getDate() + 15);
  return dueDate;
}

function roundToCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateProgressiveCharge(
  consumption: number,
  tariff: ActiveTariffInput
) {
  if (consumption <= tariff.minimumUsage) {
    return roundToCurrency(tariff.minimumCharge);
  }

  let total = tariff.minimumCharge;
  let chargedConsumption = 0;

  for (const tier of tariff.tiers) {
    const tierLowerBound = Math.max(tariff.minimumUsage, tier.minVolume - 1);
    const tierUpperBound = tier.maxVolume ?? Number.POSITIVE_INFINITY;
    const billableUnits = Math.max(0, Math.min(consumption, tierUpperBound) - tierLowerBound);

    if (billableUnits === 0) {
      continue;
    }

    chargedConsumption += billableUnits;
    total += billableUnits * tier.ratePerCuM;
  }

  const requiredBillableConsumption = consumption - tariff.minimumUsage;

  if (chargedConsumption + 0.000001 < requiredBillableConsumption) {
    throw new Error(
      "The active tariff does not cover the full billable consumption range. Review the tariff tiers before generating bills."
    );
  }

  return roundToCurrency(total);
}
