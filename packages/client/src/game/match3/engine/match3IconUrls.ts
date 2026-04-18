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

export { MATCH3_FOOD_ICON_URLS } from './match3FoodIconUrls'

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
