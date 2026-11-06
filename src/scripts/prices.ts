/**
 * Bao Plus prices in the visitor's currency, picked from their time zone: euros in the eurozone, pounds in the UK
 * (and anywhere we can't tell), US dollars in the Americas. UK and EU prices include VAT; US prices don't include
 * sales tax. The app uses the same table (shared/.../Prices.kt).
 */
export interface Prices { monthly: string; yearly: string; perMonth: string; founding: string; zero: string }

const GBP: Prices = { monthly: "£5.99", yearly: "£39.99", perMonth: "£3.33", founding: "£29.99", zero: "£0" };
const EUR: Prices = { monthly: "€6.99", yearly: "€44.99", perMonth: "€3.75", founding: "€34.99", zero: "€0" };
const USD: Prices = { monthly: "$6.99", yearly: "$44.99", perMonth: "$3.75", founding: "$34.99", zero: "$0" };

const EURO_ZONES = ["Amsterdam", "Athens", "Berlin", "Bratislava", "Brussels", "Dublin", "Helsinki", "Lisbon",
  "Ljubljana", "Luxembourg", "Madrid", "Malta", "Monaco", "Paris", "Riga", "Rome", "Tallinn", "Vienna", "Vilnius",
  "Zagreb", "Andorra", "San_Marino", "Vatican", "Busingen", "Podgorica", "Nicosia", "Famagusta"];

export function localPrices(zone: string | undefined): Prices {
  if (!zone) return GBP;
  if (zone.startsWith("America/") || zone.startsWith("US/") || zone.startsWith("Canada/") || zone === "Pacific/Honolulu") return USD;
  if (zone.startsWith("Europe/") && EURO_ZONES.includes(zone.slice(7))) return EUR;
  if (zone === "Atlantic/Canary" || zone === "Atlantic/Madeira" || zone === "Atlantic/Azores") return EUR;
  return GBP;
}

/** Swaps every [data-price] on the page to the visitor's currency. The page ships with pounds. */
export function showLocalPrices() {
  const p = localPrices(Intl.DateTimeFormat().resolvedOptions().timeZone);
  document.querySelectorAll<HTMLElement>("[data-price]").forEach((el) => {
    const key = el.dataset.price as keyof Prices;
    if (p[key]) el.textContent = p[key];
  });
}
