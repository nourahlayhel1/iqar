"use client";

import { useEffect, useState } from "react";
import { COMMON_AMENITIES, PROPERTY_PURPOSES, PROPERTY_TYPES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { filterAndSortProperties } from "@/lib/property-query";
import type { Property, PropertyFilters } from "@/lib/types";

type Theme = "dark" | "light";
type Language = "en" | "ar";

interface PropertyCatalogProps {
  properties: Property[];
  countries: string[];
  cities: string[];
  areas: string[];
}

const copy = {
  en: {
    brandKicker: "IQAR Collection",
    brandTitle: "Signature Properties",
    brandSubtitle: "A curated one-page market view for premium listings, fast filtering, and sharper search.",
    filtersNav: "Filters",
    listingsNav: "Listings",
    heroEyebrow: "Curated property board",
    heroTitle: "Find the right property through one refined search surface.",
    heroText:
      "Search by location, narrow by price and type, and scan rich listing cards without leaving the page. The entire catalog is tuned for fast daily brokerage work with a more polished presentation layer.",
    refineSearch: "Refine Search",
    exploreListings: "Explore Listings",
    liveInventory: "Live inventory",
    averageTicket: "Average ticket",
    searchSpread: "Search spread",
    flexible: "Flexible",
    featuredSelection: "Featured selection",
    insightCoverage: "Coverage",
    insightDefaults: "Search defaults",
    insightSort: "Sort order",
    customQuery: "Custom query active",
    fullPortfolio: "Browsing full portfolio",
    searchFilters: "Search and filters",
    shapeView: "Shape the market view",
    filterSubtitle: "Refine the portfolio with a cleaner, faster control panel.",
    keywordSearch: "Keyword search",
    keywordPlaceholder: "Title, city, area, address, owner",
    country: "Country",
    city: "City",
    area: "Area",
    purpose: "Purpose",
    minPrice: "Min price",
    maxPrice: "Max price",
    minBedrooms: "Min bedrooms",
    sortBy: "Sort by",
    anyCountry: "Any country",
    anyCity: "Any city",
    anyArea: "Any area",
    saleOrRent: "Sale or rent",
    noMinimum: "No minimum",
    noMaximum: "No maximum",
    any: "Any",
    propertyType: "Property type",
    amenities: "Amenities",
    applyFilters: "Apply filters",
    reset: "Reset",
    listingBoard: "Listing board",
    matchingBrief: "Properties that match the current brief",
    listingSubtitle: "A cleaner scan of the live portfolio with room summaries, pricing, and amenity highlights.",
    results: "results",
    noResults:
      "No properties match the current filter set. Broaden the area, price range, or amenity selection and try again.",
    bedrooms: "bedrooms",
    bathrooms: "bathrooms",
    parking: "Parking",
    furnished: "Furnished",
    propertyPreview: "Property Preview",
    signatureListing: "Signature Listing",
    sortNewest: "Newest first",
    sortOldest: "Oldest first",
    sortPriceAsc: "Price low to high",
    sortPriceDesc: "Price high to low",
    switchTheme: "Switch theme",
    switchLanguage: "Switch language",
    beds: "beds",
    sqm: "sqm",
    countries: "countries",
    cities: "cities",
    areas: "areas"
  },
  ar: {
    brandKicker: "مجموعة IQAR",
    brandTitle: "العقارات المختارة",
    brandSubtitle: "واجهة واحدة منسقة للعقارات المميزة مع بحث أسرع وفلاتر أوضح.",
    filtersNav: "الفلاتر",
    listingsNav: "العقارات",
    heroEyebrow: "لوحة عقارية منسقة",
    heroTitle: "اعثر على العقار المناسب من خلال واجهة بحث واحدة متقنة.",
    heroText:
      "ابحث حسب الموقع، وضيّق النتائج بالسعر والنوع، واستعرض البطاقات الغنية دون مغادرة الصفحة. التجربة كلها مصممة لعمل الوساطة اليومي لكن بمظهر أرقى.",
    refineSearch: "تعديل البحث",
    exploreListings: "استعراض العقارات",
    liveInventory: "العروض المتاحة",
    averageTicket: "متوسط السعر",
    searchSpread: "نطاق الأسعار",
    flexible: "مرن",
    featuredSelection: "العقار المميز",
    insightCoverage: "التغطية",
    insightDefaults: "حالة البحث",
    insightSort: "الترتيب",
    customQuery: "يوجد بحث مخصص",
    fullPortfolio: "استعراض كامل المحفظة",
    searchFilters: "البحث والفلاتر",
    shapeView: "شكّل عرض السوق",
    filterSubtitle: "نقّح المحفظة من خلال لوحة تحكم أنظف وأسرع.",
    keywordSearch: "بحث بالكلمات",
    keywordPlaceholder: "عنوان، مدينة، منطقة، عنوان، مالك",
    country: "الدولة",
    city: "المدينة",
    area: "المنطقة",
    purpose: "الغرض",
    minPrice: "أقل سعر",
    maxPrice: "أعلى سعر",
    minBedrooms: "أقل عدد غرف",
    sortBy: "الترتيب",
    anyCountry: "أي دولة",
    anyCity: "أي مدينة",
    anyArea: "أي منطقة",
    saleOrRent: "بيع أو إيجار",
    noMinimum: "بدون حد أدنى",
    noMaximum: "بدون حد أقصى",
    any: "الكل",
    propertyType: "نوع العقار",
    amenities: "المزايا",
    applyFilters: "تطبيق الفلاتر",
    reset: "إعادة ضبط",
    listingBoard: "لوحة العقارات",
    matchingBrief: "عقارات تطابق الطلب الحالي",
    listingSubtitle: "استعراض أوضح للمحفظة الحية مع ملخصات المساحات والأسعار والمزايا.",
    results: "نتيجة",
    noResults:
      "لا توجد عقارات تطابق الفلاتر الحالية. وسّع المنطقة أو نطاق السعر أو المزايا ثم أعد المحاولة.",
    bedrooms: "غرف نوم",
    bathrooms: "حمامات",
    parking: "موقف",
    furnished: "مفروش",
    propertyPreview: "معاينة العقار",
    signatureListing: "عقار مميز",
    sortNewest: "الأحدث أولاً",
    sortOldest: "الأقدم أولاً",
    sortPriceAsc: "السعر من الأقل للأعلى",
    sortPriceDesc: "السعر من الأعلى للأقل",
    switchTheme: "تبديل المظهر",
    switchLanguage: "تبديل اللغة",
    beds: "غرف",
    sqm: "م²",
    countries: "دول",
    cities: "مدن",
    areas: "مناطق"
  }
} as const;

function titleCase(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function arabicLabel(value: string): string {
  const labels: Record<string, string> = {
    apartment: "شقة",
    villa: "فيلا",
    land: "أرض",
    shop: "محل",
    office: "مكتب",
    other: "أخرى",
    sale: "بيع",
    rent: "إيجار",
    sea_view: "إطلالة بحرية",
    elevator: "مصعد",
    generator: "مولد",
    parking: "موقف",
    storage: "مستودع",
    balcony: "شرفة",
    garden: "حديقة",
    security: "حراسة",
    pool: "مسبح",
    furnished: "مفروش",
    newest: "الأحدث",
    oldest: "الأقدم",
    priceAsc: "السعر تصاعدياً",
    priceDesc: "السعر تنازلياً"
  };

  return labels[value] ?? value;
}

function labelForValue(language: Language, value: string): string {
  return language === "ar" ? arabicLabel(value) : titleCase(value);
}

function defaultFilters(): PropertyFilters {
  return {
    q: "",
    country: "",
    city: "",
    area: "",
    types: [],
    purpose: "",
    minPrice: undefined,
    maxPrice: undefined,
    minBedrooms: undefined,
    amenities: [],
    sort: "newest"
  };
}

export function PropertyCatalog({ properties, countries, cities, areas }: PropertyCatalogProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [language, setLanguage] = useState<Language>("en");
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters());

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("iqar-theme");
    const storedLanguage = window.localStorage.getItem("iqar-language");
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
    if (storedLanguage === "en" || storedLanguage === "ar") setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("iqar-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", language === "ar" ? "rtl" : "ltr");
    window.localStorage.setItem("iqar-language", language);
  }, [language]);

  const t = copy[language];
  const filteredProperties = filterAndSortProperties(properties, filters);
  const featuredProperty = filteredProperties[0] ?? properties[0];
  const featuredImage = featuredProperty?.coverImage ?? featuredProperty?.images[0];
  const minPrice = filteredProperties.length ? Math.min(...filteredProperties.map((property) => property.price)) : 0;
  const maxPrice = filteredProperties.length ? Math.max(...filteredProperties.map((property) => property.price)) : 0;
  const averagePrice = filteredProperties.length
    ? Math.round(filteredProperties.reduce((total, property) => total + property.price, 0) / filteredProperties.length)
    : 0;

  function updateFilter<K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayFilter(key: "types" | "amenities", value: string) {
    setFilters((current) => {
      const currentValues = current[key] ?? [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value];

      return { ...current, [key]: nextValues };
    });
  }

  function resetFilters() {
    setFilters(defaultFilters());
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-kicker">{t.brandKicker}</span>
          <span className="brand-title">{t.brandTitle}</span>
          <span className="brand-subtitle">{t.brandSubtitle}</span>
        </div>
        <div className="topbar-actions">
          <nav className="mini-nav" aria-label="Page sections">
            <a href="#filters">{t.filtersNav}</a>
            <a href="#listings">{t.listingsNav}</a>
          </nav>
          <div className="preference-group">
            <button type="button" className="preference-toggle" aria-label={t.switchTheme} onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? "☾" : "☀"}
            </button>
            <button type="button" className="preference-toggle lang-pill" aria-label={t.switchLanguage} onClick={() => setLanguage((current) => (current === "en" ? "ar" : "en"))}>
              {language === "en" ? "AR" : "EN"}
            </button>
          </div>
        </div>
      </header>

      <main className="home-flow">
        <section className="hero-grid">
          <div className="hero-copy panel glass-panel">
            <p className="eyebrow">{t.heroEyebrow}</p>
            <h1 className="hero-title">{t.heroTitle}</h1>
            <p className="hero-text">{t.heroText}</p>
            <div className="hero-actions">
              <a href="#filters" className="btn">{t.refineSearch}</a>
              <a href="#listings" className="btn-secondary">{t.exploreListings}</a>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <span className="metric-label">{t.liveInventory}</span>
                <strong>{filteredProperties.length}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">{t.averageTicket}</span>
                <strong>{averagePrice ? formatCurrency(averagePrice, featuredProperty?.currency ?? "USD") : "N/A"}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">{t.searchSpread}</span>
                <strong>
                  {minPrice && maxPrice
                    ? `${formatCurrency(minPrice, featuredProperty?.currency ?? "USD")} - ${formatCurrency(maxPrice, featuredProperty?.currency ?? "USD")}`
                    : t.flexible}
                </strong>
              </div>
            </div>
          </div>

          <div className="hero-spotlight panel">
            <div className="spotlight-media">
              {featuredImage ? <img src={featuredImage} alt={featuredProperty?.title ?? t.signatureListing} /> : <div className="image-fallback">{t.signatureListing}</div>}
            </div>
            {featuredProperty ? (
              <div className="spotlight-copy">
                <p className="eyebrow">{t.featuredSelection}</p>
                <h2>{featuredProperty.title}</h2>
                <p className="muted">{featuredProperty.location.city}, {featuredProperty.location.area}</p>
                <div className="price">{formatCurrency(featuredProperty.price, featuredProperty.currency)}</div>
                <div className="stats">
                  <span className="stat-pill">{labelForValue(language, featuredProperty.type)}</span>
                  <span className="stat-pill">{labelForValue(language, featuredProperty.purpose)}</span>
                  {featuredProperty.bedrooms ? <span className="stat-pill">{featuredProperty.bedrooms} {t.beds}</span> : null}
                  {featuredProperty.areaSqm ? <span className="stat-pill">{featuredProperty.areaSqm} {t.sqm}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="insight-ribbon panel">
          <div>
            <span className="label">{t.insightCoverage}</span>
            <strong>{countries.length} {t.countries} / {cities.length} {t.cities} / {areas.length} {t.areas}</strong>
          </div>
          <div>
            <span className="label">{t.insightDefaults}</span>
            <strong>{filters.q || filters.city || filters.area ? t.customQuery : t.fullPortfolio}</strong>
          </div>
          <div>
            <span className="label">{t.insightSort}</span>
            <strong>{labelForValue(language, filters.sort ?? "newest")}</strong>
          </div>
        </section>

        <section className="catalog-layout">
          <aside id="filters" className="filter-panel panel glass-panel">
            <div className="section-heading">
              <p className="eyebrow">{t.searchFilters}</p>
              <h2>{t.shapeView}</h2>
              <p className="muted">{t.filterSubtitle}</p>
            </div>

            <div className="filter-form">
              <div className="search-shell">
                <label htmlFor="q" className="label">{t.keywordSearch}</label>
                <input id="q" value={filters.q ?? ""} onChange={(event) => updateFilter("q", event.target.value)} placeholder={t.keywordPlaceholder} />
              </div>

              <div className="form-grid">
                <div>
                  <label htmlFor="country" className="label">{t.country}</label>
                  <select id="country" value={filters.country ?? ""} onChange={(event) => updateFilter("country", event.target.value)}>
                    <option value="">{t.anyCountry}</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="label">{t.city}</label>
                  <select id="city" value={filters.city ?? ""} onChange={(event) => updateFilter("city", event.target.value)}>
                    <option value="">{t.anyCity}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="area" className="label">{t.area}</label>
                  <select id="area" value={filters.area ?? ""} onChange={(event) => updateFilter("area", event.target.value)}>
                    <option value="">{t.anyArea}</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="purpose" className="label">{t.purpose}</label>
                  <select id="purpose" value={filters.purpose ?? ""} onChange={(event) => updateFilter("purpose", event.target.value)}>
                    <option value="">{t.saleOrRent}</option>
                    {PROPERTY_PURPOSES.map((purpose) => (
                      <option key={purpose} value={purpose}>{labelForValue(language, purpose)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="minPrice" className="label">{t.minPrice}</label>
                  <input id="minPrice" type="number" min="0" value={filters.minPrice ?? ""} onChange={(event) => updateFilter("minPrice", event.target.value ? Number(event.target.value) : undefined)} placeholder={t.noMinimum} />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="label">{t.maxPrice}</label>
                  <input id="maxPrice" type="number" min="0" value={filters.maxPrice ?? ""} onChange={(event) => updateFilter("maxPrice", event.target.value ? Number(event.target.value) : undefined)} placeholder={t.noMaximum} />
                </div>
                <div>
                  <label htmlFor="minBedrooms" className="label">{t.minBedrooms}</label>
                  <input id="minBedrooms" type="number" min="0" value={filters.minBedrooms ?? ""} onChange={(event) => updateFilter("minBedrooms", event.target.value ? Number(event.target.value) : undefined)} placeholder={t.any} />
                </div>
                <div>
                  <label htmlFor="sort" className="label">{t.sortBy}</label>
                  <select id="sort" value={filters.sort ?? "newest"} onChange={(event) => updateFilter("sort", event.target.value as PropertyFilters["sort"])}>
                    <option value="newest">{t.sortNewest}</option>
                    <option value="oldest">{t.sortOldest}</option>
                    <option value="priceAsc">{t.sortPriceAsc}</option>
                    <option value="priceDesc">{t.sortPriceDesc}</option>
                  </select>
                </div>
              </div>

              <div>
                <span className="label">{t.propertyType}</span>
                <div className="chip-grid">
                  {PROPERTY_TYPES.map((type) => (
                    <label key={type} className="chip-option">
                      <input type="checkbox" checked={filters.types?.includes(type) ?? false} onChange={() => toggleArrayFilter("types", type)} />
                      <span>{labelForValue(language, type)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="label">{t.amenities}</span>
                <div className="chip-grid">
                  {COMMON_AMENITIES.map((amenity) => (
                    <label key={amenity} className="chip-option">
                      <input type="checkbox" checked={filters.amenities?.includes(amenity) ?? false} onChange={() => toggleArrayFilter("amenities", amenity)} />
                      <span>{labelForValue(language, amenity)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="actions">
                <button type="button" className="btn" onClick={() => undefined}>{t.applyFilters}</button>
                <button type="button" className="btn-ghost" onClick={resetFilters}>{t.reset}</button>
              </div>
            </div>
          </aside>

          <section id="listings" className="listing-column">
            <div className="listing-intro panel">
              <div className="toolbar">
                <div>
                  <p className="eyebrow">{t.listingBoard}</p>
                  <h2>{t.matchingBrief}</h2>
                  <p className="muted">{t.listingSubtitle}</p>
                </div>
                <div className="results-badge">
                  <span>{filteredProperties.length}</span>
                  <small>{t.results}</small>
                </div>
              </div>
            </div>

            {filteredProperties.length ? (
              <div className="property-grid">
                {filteredProperties.map((property) => {
                  const image = property.coverImage ?? property.images[0];

                  return (
                    <article key={property.id} className="listing-card panel">
                      <div className="listing-media">
                        {image ? <img src={image} alt={property.title} /> : <div className="image-fallback">{t.propertyPreview}</div>}
                        <div className="media-badges">
                          <span className="badge">{labelForValue(language, property.purpose)}</span>
                          <span className="badge muted-badge">{labelForValue(language, property.type)}</span>
                        </div>
                      </div>
                      <div className="listing-body">
                        <div className="card-head">
                          <div>
                            <p className="eyebrow">{property.location.city}, {property.location.area}</p>
                            <h3>{property.title}</h3>
                          </div>
                          <div className="price">{formatCurrency(property.price, property.currency)}</div>
                        </div>
                        <p className="listing-description">
                          {property.description || "Well-positioned listing with strong visibility and a clean, broker-friendly summary."}
                        </p>
                        <div className="stats">
                          {property.bedrooms ? <span className="stat-pill">{property.bedrooms} {t.bedrooms}</span> : null}
                          {property.bathrooms ? <span className="stat-pill">{property.bathrooms} {t.bathrooms}</span> : null}
                          {property.areaSqm ? <span className="stat-pill">{property.areaSqm} {t.sqm}</span> : null}
                          {property.parking ? <span className="stat-pill">{t.parking}</span> : null}
                          {property.furnished ? <span className="stat-pill">{t.furnished}</span> : null}
                        </div>
                        <div className="amenity-row">
                          {property.amenities.slice(0, 4).map((amenity) => (
                            <span key={amenity} className="amenity-pill">{labelForValue(language, amenity)}</span>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state panel">{t.noResults}</div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
