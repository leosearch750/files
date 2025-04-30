if (typeof window === "undefined") {
    if (!globalThis.stocks && !globalThis.recipes) {
        const { stocks, recipes } = require("./data");

        globalThis.stocks = stocks;
        globalThis.recipes = recipes;
    }
}

function delivering(recipeName) {
    setTimeout(() => {
        console.log(`Delivering ${recipeName}`);
    }, 2000);
}

function end_of_order(recipeName) {
    console.log("All ingredients have been prepared");
    setTimeout(() => {
        console.log(`Cooking ${recipeName}`);
    }, 2000);
    setTimeout(() => {
        delivering(recipeName);
    }, 5000);
}

function check_and_update_ingredient(recipeName, ingredient, quantity) {
    if (globalThis.stocks[ingredient] < quantity) {
        console.log(
            `Not enough ingredients for ${recipeName} because there is no more ${ingredient}`,
        );
        return false;
    }

    globalThis.stocks[ingredient] -= quantity;
    return true;
}

function check_and_update_ingredients(recipeName, ingredients) {
    for (const ingredient in ingredients) {
        const quantity = ingredients[ingredient];

        if (!check_and_update_ingredient(recipeName, ingredient, quantity)) {
            return false;
        }
    }

    return true;
}

function prepare_pizza(recipeName) {
    let i = 0;
    const pizza = globalThis.recipes.pizza[recipeName];
    const timeouts = [];

    timeouts.push(
        setTimeout(() => {
            console.log(`Preparing ${pizza.sauce}`);
            if (!check_and_update_ingredient(recipeName, pizza.sauce, 1)) {
                for (const t of timeouts) {
                    clearTimeout(t);
                }

                return;
            }
        }, i),
    );

    timeouts.push(
        setTimeout(() => {
            i = 1000;
            console.log(`Preparing ${Object.keys(pizza.toppings).join(", ")}`);
            if (!check_and_update_ingredients(recipeName, pizza.toppings)) {
                for (const t of timeouts) {
                    clearTimeout(t);
                }

                return;
            }

            setTimeout(() => {
                console.log(
                    `Preparing ${Object.keys(pizza.cheese).join(", ")}`,
                );
                if (!check_and_update_ingredients(recipeName, pizza.cheese)) {
                    for (const t of timeouts) {
                        clearTimeout(t);
                    }

                    return;
                }
            }, i);
        }, i + 1000),
    );
    i += 3000;
    timeouts.push(
        setTimeout(() => {
            end_of_order(recipeName);
        }, i),
    );
}

function prepare_burger(recipeName) {
    const burger = globalThis.recipes.burger[recipeName];
    let i = 0;
    const timeouts = [];

    for (const ingredient in burger) {
        const timeout = setTimeout(() => {
            console.log(`Preparing ${ingredient}`);
            if (
                !check_and_update_ingredient(
                    recipeName,
                    ingredient,
                    burger[ingredient],
                )
            ) {
                for (const t of timeouts) {
                    clearTimeout(t);
                }

                return;
            }
        }, i * 1000);

        timeouts.push(timeout);
        i++;
    }

    const lastTimeout = setTimeout(() => {
        end_of_order(recipeName);
    }, i * 1000);

    timeouts.push(lastTimeout);
}

function order(recipeName) {
    let i = 0;

    console.log(`Ordering ${recipeName}`);

    if (
        !(recipeName in globalThis.recipes.pizza) &&
        !(recipeName in globalThis.recipes.burger)
    ) {
        console.log(`Recipe ${recipeName} does not exist`);
        return;
    }

    setTimeout(() => {
        i = 1000;
        setTimeout(() => {
            console.log(`Production has started for ${recipeName}`);
        }, i);
    }, i + 1000);
    i += 3000;
    setTimeout(() => {
        if (recipeName in globalThis.recipes.pizza) {
            prepare_pizza(recipeName);
        }
    }, i);
    setTimeout(() => {
        if (recipeName in globalThis.recipes.burger) {
            prepare_burger(recipeName);
        }
    }, i);
}

if (typeof window === "undefined") {
    module.exports = {
        order,
    };
}
