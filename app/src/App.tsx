import { useStore } from './store';
import { Header, DemoBanner, MenuDrawer, BottomNav } from './components/Shell';
import { Onboarding } from './screens/Onboarding';
import type { ScreenId } from './types';

import { Home } from './screens/Home';
import { Regions } from './screens/Regions';
import { RegionFiche } from './screens/RegionFiche';
import { Carte } from './screens/Carte';
import { Scanner } from './screens/Scanner';
import { Cave } from './screens/Cave';
import { Degustation } from './screens/Degustation';
import { Accords } from './screens/Accords';
import { Savoir } from './screens/Savoir';
import { Search } from './screens/Search';
import { Millesimes } from './screens/Millesimes';
import { Collection } from './screens/Collection';
import { Vendanges } from './screens/Vendanges';
import { Actus } from './screens/Actus';
import { Glossaire } from './screens/Glossaire';
import { Routes } from './screens/Routes';
import { Cotes } from './screens/Cotes';
import { Histoire } from './screens/Histoire';
import { Aromes } from './screens/Aromes';
import { Bouteilles } from './screens/Bouteilles';
import { Import } from './screens/Import';
import { Parametres } from './screens/Parametres';

const SCREENS: Record<ScreenId, () => React.JSX.Element> = {
  home: Home,
  regions: Regions,
  region: RegionFiche,
  carte: Carte,
  scanner: Scanner,
  cave: Cave,
  savoir: Savoir,
  degustation: Degustation,
  accords: Accords,
  search: Search,
  millesimes: Millesimes,
  collection: Collection,
  vendanges: Vendanges,
  actus: Actus,
  glossaire: Glossaire,
  routes: Routes,
  cotes: Cotes,
  histoire: Histoire,
  aromes: Aromes,
  bouteilles: Bouteilles,
  import: Import,
  parametres: Parametres,
};

// Le scanner gère lui-même sa mise en page plein écran (caméra).
const FULLBLEED: ScreenId[] = ['scanner'];

export function App() {
  const screen = useStore((s) => s.screen);
  const Screen = SCREENS[screen];
  const fullBleed = FULLBLEED.includes(screen);

  return (
    <div className="vc-app">
      <Header />
      <DemoBanner />
      <main className="vc-content vc-scroll" style={fullBleed ? { display: 'flex', flexDirection: 'column' } : undefined}>
        <Screen />
      </main>
      <MenuDrawer />
      <BottomNav />
      <Onboarding />
    </div>
  );
}
