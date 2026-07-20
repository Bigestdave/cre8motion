// Show artwork bundled with the app, mapped by show title.
// Fallback: screens keep using the gradient <Thumb> when a show has no artwork here.
import posterFruitfulSecrets from '../assets/poster-fruitful-secrets.png'
import posterLuckyWallet from '../assets/poster-lucky-wallet.png'
import bannerFruitfulSecrets from '../assets/banner-fruitful-secrets.png'

const POSTERS: Record<string, string> = {
  'fruitful secrets': posterFruitfulSecrets,
  'the lucky wallet': posterLuckyWallet,
}

const BANNERS: Record<string, string> = {
  'fruitful secrets': bannerFruitfulSecrets,
  'the lucky wallet': posterLuckyWallet,
}

export function showPoster(title?: string | null): string | undefined {
  return title ? POSTERS[title.trim().toLowerCase()] : undefined
}

export function showBanner(title?: string | null): string | undefined {
  return title ? BANNERS[title.trim().toLowerCase()] : undefined
}
