/**
 * Только еда — отдельный модуль, чтобы UI-превью не тянул космические PNG в Jest.
 */
import foodBurger from '@match3-icons/food/burger.svg?url'
import foodPizza from '@match3-icons/food/pizza.svg?url'
import foodDonut from '@match3-icons/food/donut.svg?url'
import foodCupcake from '@match3-icons/food/cupcake.svg?url'
import foodIcecream from '@match3-icons/food/icecream.svg?url'
import foodSushi from '@match3-icons/food/sushi.svg?url'
import foodFries from '@match3-icons/food/fries.svg?url'
import foodCake from '@match3-icons/food/cake.svg?url'

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
