/**
 * URL иконок из `public/icons` — через publicAssetUrl (корень сайта + base для GitHub Pages).
 * Не импортировать из `public/` с `?url`: Vite отдаёт файлы из public с корня `/icons/…`.
 */
import { publicAssetUrl } from '../../../utils/publicAssetUrl'

export { MATCH3_FOOD_ICON_URLS } from './match3FoodIconUrls'
export { MATCH3_TECH_ICON_URLS } from './match3TechIconUrls'

export const MATCH3_COSMIC_ICON_URLS: readonly string[] =
  [
    publicAssetUrl('icons/cosmic1.png'),
    publicAssetUrl('icons/cosmic2.png'),
    publicAssetUrl('icons/cosmic3.png'),
    publicAssetUrl('icons/cosmic4.png'),
    publicAssetUrl('icons/cosmic5.png'),
    publicAssetUrl('icons/cosmic6.png'),
    publicAssetUrl('icons/cosmic7.png'),
    publicAssetUrl('icons/cosmic8.png'),
  ]
