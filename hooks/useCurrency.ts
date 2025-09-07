import { useState, useEffect, useCallback } from 'react';
import { Currency, type ExchangeRates } from '../types';

const CURRENCY_STORAGE_KEY = 'maintenanceLogCurrency';

const DEFAULT_RATES: ExchangeRates = {
    [Currency.PKR]: 1,
    [Currency.USD]: 278, // 1 USD = 278 PKR
    [Currency.EUR]: 300, // 1 EUR = 300 PKR
};

interface StoredCurrencyData {
    selectedCurrency: Currency;
    exchangeRates: ExchangeRates;
}

export const useCurrency = () => {
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.PKR);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(DEFAULT_RATES);

    useEffect(() => {
        try {
            const storedData = localStorage.getItem(CURRENCY_STORAGE_KEY);
            if (storedData) {
                const parsedData: StoredCurrencyData = JSON.parse(storedData);
                setSelectedCurrency(parsedData.selectedCurrency || Currency.PKR);
                // Merge stored rates with defaults to ensure all currencies are present
                setExchangeRates(prevRates => ({ ...prevRates, ...parsedData.exchangeRates }));
            }
        } catch (error) {
            console.error('Failed to load currency data from localStorage', error);
            // Fallback to defaults
            setSelectedCurrency(Currency.PKR);
            setExchangeRates(DEFAULT_RATES);
        }
    }, []);

    const saveData = useCallback((data: StoredCurrencyData) => {
        try {
            localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save currency data to localStorage', error);
        }
    }, []);

    const selectCurrency = useCallback((currency: Currency) => {
        const dataToSave = { selectedCurrency: currency, exchangeRates };
        setSelectedCurrency(currency);
        saveData(dataToSave);
    }, [exchangeRates, saveData]);

    const updateRates = useCallback((newRates: Partial<ExchangeRates>) => {
        const updatedRates = { ...exchangeRates, ...newRates };
        setExchangeRates(updatedRates);
        saveData({ selectedCurrency, exchangeRates: updatedRates });
    }, [selectedCurrency, exchangeRates, saveData]);

    const setCurrencyData = useCallback((data: StoredCurrencyData) => {
        setSelectedCurrency(data.selectedCurrency);
        setExchangeRates(data.exchangeRates);
        saveData(data);
    }, [saveData]);
    
    const clearCurrencyData = useCallback(() => {
        localStorage.removeItem(CURRENCY_STORAGE_KEY);
    }, []);

    return { selectedCurrency, exchangeRates, selectCurrency, updateRates, setCurrencyData, clearCurrencyData };
};