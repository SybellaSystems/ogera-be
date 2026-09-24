import axios from 'axios';

const FX_API_BASE_URL = process.env.FX_API_BASE_URL || 'https://fxapi.app/api';

export interface FxQuote {
    base: string;
    target: string;
    rate: number;
    timestamp?: string;
}

export interface ConversionResult {
    base: string;
    target: string;
    rate: number;
    timestamp?: string;
    inputAmount: number;
    convertedAmount: number;
}

const normalizeCurrency = (currency: string): string =>
    String(currency || '')
        .trim()
        .toUpperCase();

export const getFxQuote = async (
    baseCurrency: string,
    targetCurrency: string,
): Promise<FxQuote> => {
    const base = normalizeCurrency(baseCurrency);
    const target = normalizeCurrency(targetCurrency);

    if (!base || !target) {
        throw new Error('Both base and target currencies are required');
    }
    if (base === target) {
        return { base, target, rate: 1 };
    }

    const { data } = await axios.get(
        `${FX_API_BASE_URL}/${base}/${target}.json`,
    );
    const rate = Number(data?.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`Invalid FX rate returned for ${base}/${target}`);
    }

    return {
        base,
        target,
        rate,
        timestamp: data?.timestamp,
    };
};

export const convertCurrency = async (
    amount: number,
    baseCurrency: string,
    targetCurrency: string,
): Promise<ConversionResult> => {
    const inputAmount = Number(amount) || 0;
    const quote = await getFxQuote(baseCurrency, targetCurrency);

    // Keep precision for accounting; round to 6dp then format in UI as needed.
    const convertedAmount =
        Math.round(inputAmount * quote.rate * 1_000_000) / 1_000_000;

    return {
        ...quote,
        inputAmount,
        convertedAmount,
    };
};
