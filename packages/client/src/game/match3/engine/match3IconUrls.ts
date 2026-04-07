/**
 * URL иконок через Vite `?url` — попадают в `dist` с хешами и корректным base
 * (в т.ч. GitHub Pages).
 */
import cosmic1 from '@match3-public/icons/cosmic1.png?url'
import cosmic2 from '@match3-public/icons/cosmic2.png?url'
import cosmic3 from '@match3-public/icons/cosmic3.png?url'
import cosmic4 from '@match3-public/icons/cosmic4.png?url'
import cosmic5 from '@match3-public/icons/cosmic5.png?url'
import cosmic6 from '@match3-public/icons/cosmic6.png?url'
import cosmic7 from '@match3-public/icons/cosmic7.png?url'
import cosmic8 from '@match3-public/icons/cosmic8.png?url'

import foodBurger from '@match3-icons/food/burger.svg?url'
import foodPizza from '@match3-icons/food/pizza.svg?url'
import foodDonut from '@match3-icons/food/donut.svg?url'
import foodCupcake from '@match3-icons/food/cupcake.svg?url'
import foodIcecream from '@match3-icons/food/icecream.svg?url'
import foodSushi from '@match3-icons/food/sushi.svg?url'
import foodFries from '@match3-icons/food/fries.svg?url'
import foodCake from '@match3-icons/food/cake.svg?url'

export const MATCH3_COSMIC_ICON_URLS: readonly string[] =
  [
    cosmic1,
    cosmic2,
    cosmic3,
    cosmic4,
    cosmic5,
    cosmic6,
    cosmic7,
    cosmic8,
  ]

export const MATCH3_FOOD_ICON_URLS: readonly string[] =
  [
    foodBurger,
    foodPizza,
    foodDonut,
    foodCupcake,
    foodIcecream,
    foodSushi,
    foodFries,
    foodCake,
  ]
