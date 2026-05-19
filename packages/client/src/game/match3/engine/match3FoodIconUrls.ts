/**
 * Только еда — отдельный модуль, чтобы UI-превью не тянул космические PNG в Jest.
 */
import { publicAssetUrl } from '../../../utils/publicAssetUrl'

export const MATCH3_FOOD_ICON_URLS: readonly string[] =
  [
    publicAssetUrl('iconset/food/burger.svg'),
    publicAssetUrl('iconset/food/pizza.svg'),
    publicAssetUrl('iconset/food/donut.svg'),
    publicAssetUrl('iconset/food/cupcake.svg'),
    publicAssetUrl('iconset/food/icecream.svg'),
    publicAssetUrl('iconset/food/sushi.svg'),
    publicAssetUrl('iconset/food/fries.svg'),
    publicAssetUrl('iconset/food/cake.svg'),
  ]
