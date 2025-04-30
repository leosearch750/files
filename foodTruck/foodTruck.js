if (typeof window === "undefined") {
    if (!globalThis.stocks && !globalThis.recipes && !globalThis.sleep) {
        const { stocks, recipes } = require("./data");
        const { sleep } = require("./sleep");

        globalThis.stocks = stocks;
        globalThis.recipes = recipes;
        globalThis.sleep = sleep;
    }
}

async function delivering(recipeName) {
    await sleep(2);
    console.log(`Delivering ${recipeName}`);
}

async function end_of_order(recipeName) {
    console.log("All ingredients have been prepared");
    await sleep(2);
    console.log(`Cooking ${recipeName}`);
    await delivering(recipeName);
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

async function prepare_pizza(recipeName) {
    try {
        const pizza = globalThis.recipes.pizza[recipeName];
        
        await sleep(1);
        console.log(`Preparing ${pizza.sauce}`);
        if (!check_and_update_ingredient(recipeName, pizza.sauce, 1)) {
            return;
        }

        await sleep(1);
        console.log(`Preparing ${Object.keys(pizza.toppings).join(", ")}`);
        if (!check_and_update_ingredients(recipeName, pizza.toppings)) {
            return;
        }

        await sleep(1);
        console.log(`Preparing ${Object.keys(pizza.cheese).join(", ")}`);
        if (!check_and_update_ingredients(recipeName, pizza.cheese)) {
            return;
        }

        await end_of_order(recipeName);
    } catch (error) {
        console.error(`Error preparing pizza: ${error}`);
    }
}

async function prepare_burger(recipeName) {
    try {
        const burger = globalThis.recipes.burger[recipeName];
        
        for (const ingredient in burger) {
            await sleep(1);
            console.log(`Preparing ${ingredient}`);
            if (!check_and_update_ingredient(recipeName, ingredient, burger[ingredient])) {
                return;
            }
        }

        await end_of_order(recipeName);
    } catch (error) {
        console.error(`Error preparing burger: ${error}`);
    }
}

async function order(recipeName) {
    try {
        console.log(`Ordering ${recipeName}`);

        if (!(recipeName in globalThis.recipes.pizza) && 
            !(recipeName in globalThis.recipes.burger)) {
            console.log(`Recipe ${recipeName} does not exist`);
            return;
        }

        await sleep(1);
        console.log(`Production has started for ${recipeName}`);

        if (recipeName in globalThis.recipes.pizza) {
            await prepare_pizza(recipeName);
        } else {
            await prepare_burger(recipeName);
        }
    } catch (error) {
        console.error(`Error processing order: ${error}`);
    }
}

if (typeof window === "undefined") {
    module.exports = {
        order,
    };
}