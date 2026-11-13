export function normalizeSampleProductPrice(product) {
    const id = Number(product.id);
    const price = Number(product.price);
    const isNumericSampleId = Number.isInteger(id) && id >= 1 && id <= 60;
    const isLegacyDatabaseProduct = /^[a-f\d]{24}$/i.test(String(product.id));
    const isLegacySample = isNumericSampleId || isLegacyDatabaseProduct;

    if (isLegacySample && price > 0 && price < 10000) {
        return { ...product, price: price * 1000 };
    }

    return product;
}

export function normalizeLegacyCatalog(products) {
    return products.map(normalizeSampleProductPrice);
}
