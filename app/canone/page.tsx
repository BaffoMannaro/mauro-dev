import { redirect } from 'next/navigation';

// Vecchio indirizzo della pagina ore (link nelle mail già inviate): ora è la tab Ore dell'area cliente.
export default function CanonePage() {
  redirect('/portale?tab=ore');
}
