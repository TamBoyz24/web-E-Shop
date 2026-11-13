import { normalizeLegacyCatalog, normalizeSampleProductPrice } from "./catalog";

test("converts legacy sample prices from thousand-dong units to VND", () => {
    expect(normalizeSampleProductPrice({ id: 1, price: 599 })).toEqual({
        id: 1,
        price: 599000,
    });
});

test("does not convert migrated or non-sample product prices again", () => {
    expect(normalizeSampleProductPrice({ id: 1, price: 599000 }).price).toBe(599000);
    expect(normalizeSampleProductPrice({ id: "product-id", price: 599 }).price).toBe(599);
    expect(normalizeSampleProductPrice({ id: "6ae952a442137bb8ae95f835", price: 1199 }).price).toBe(1199000);
});

test("normalizes old browser catalogs without changing current price values", () => {
    expect(normalizeLegacyCatalog([
        { id: 2, price: 1199 },
        { id: 2, price: 1199000 },
    ]).map((product) => product.price)).toEqual([1199000, 1199000]);
});
