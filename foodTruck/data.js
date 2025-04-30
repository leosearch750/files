"use strict";

const stocks = {
    mozzarella: 4,
    parmesan: 5,
    cheddar: 6,
    "goat cheese": 7,
    meat: 3,
    chicken: 4,
    salmon: 7,
    tuna: 8,
    bacon: 4,
    mushrooms: 4,
    tomato: 5,
    "tomato sauce": 5,
    "sour cream": 5,
    fries: 20,
    eggs: 10,
    buns: 20,
    lettuce: 5,
    oregano: 8,
};

const recipes = {
    pizza: {
        Margarita: {
            cheese: {
                mozzarella: 4,
            },
            sauce: "tomato sauce",
            toppings: { oregano: 2 },
        },
        "4 cheese": {
            cheese: {
                mozzarella: 2,
                parmesan: 2,
                cheddar: 2,
                "goat cheese": 2,
            },
            toppings: { oregano: 2 },
            sauce: "tomato sauce",
        },
        "Creamy 4 cheese": {
            cheese: {
                mozzarella: 2,
                parmesan: 2,
                cheddar: 2,
                "goat cheese": 2,
            },
            toppings: { oregano: 2 },
            sauce: "sour cream",
        },
    },
    burger: {
        Whoopty: { cheddar: 2, meat: 2, lettuce: 2, tomato: 2, buns: 2 },
        McChicken: { cheddar: 2, chicken: 1, lettuce: 2, buns: 2 },
    },
};

if (typeof window === "undefined") {
    module.exports = {
        stocks,
        recipes,
    };
} else {
    if (!globalThis.stocks && !globalThis.recipes) {
        globalThis.stocks = stocks;
        globalThis.recipes = recipes;
    }
}
