import { permanentRedirect } from 'next/navigation'

/** Favorites moved into My page, which also works without an account. */
export default function FavoritesPage() {
  permanentRedirect('/mypage')
}
