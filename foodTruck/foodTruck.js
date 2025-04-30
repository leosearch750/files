if (typeof window === "undefined") {
    if (!globalThis.stocks && !globalThis.recipes && !globalThis.sleep) {
        const { stocks, recipes } = require("./data");
        const { sleep } = require("./sleep");

        globalThis.stocks = stocks;
        globalThis.recipes = recipes;
        globalThis.sleep = sleep;
    }
}

async function checkAndUpdateIngredient(recipeName, ingredient, quantity) {
    if (globalThis.stocks[ingredient] < quantity) {
        console.log(
            `Not enough ingredients for ${recipeName} because there is no more ${ingredient}`
        );
        throw new Error(`Insufficient ${ingredient}`);
    }
    globalThis.stocks[ingredient] -= quantity;
    return true;
}

async function preparePizza(recipeName) {
    const pizza = globalThis.recipes.pizza[recipeName];
    
    await sleep(1);
    console.log(`Preparing ${pizza.sauce}`);
    await checkAndUpdateIngredient(recipeName, pizza.sauce, 1);
    
    await sleep(1);
    const toppings = Object.keys(pizza.toppings).join(", ");
    console.log(`Preparing ${toppings}`);
    for (const [ingredient, quantity] of Object.entries(pizza.toppings)) {
        await checkAndUpdateIngredient(recipeName, ingredient, quantity);
    }
    
    await sleep(1);
    const cheeses = Object.keys(pizza.cheese).join(", ");
    console.log(`Preparing ${cheeses}`);
    for (const [ingredient, quantity] of Object.entries(pizza.cheese)) {
        await checkAndUpdateIngredient(recipeName, ingredient, quantity);
    }
    
    await sleep(3);
    console.log("All ingredients have been prepared");
    await sleep(2);
    console.log(`Cooking ${recipeName}`);
    await sleep(3);
    console.log(`Delivering ${recipeName}`);
}

async function prepareBurger(recipeName) {
    const burger = globalThis.recipes.burger[recipeName];
    
    for (const [ingredient, quantity] of Object.entries(burger)) {
        await sleep(1);
        console.log(`Preparing ${ingredient}`);
        await checkAndUpdateIngredient(recipeName, ingredient, quantity);
    }
    
    console.log("All ingredients have been prepared");
    await sleep(2);
    console.log(`Cooking ${recipeName}`);
    await sleep(3);
    console.log(`Delivering ${recipeName}`);
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
            await preparePizza(recipeName);
        } else {
            await prepareBurger(recipeName);
        }
        
    } catch (error) {
        console.log(`Failed to prepare ${recipeName}: ${error.message}`);
    }
}

if (typeof window === "undefined") {
    module.exports = {
        order,
    };
}
