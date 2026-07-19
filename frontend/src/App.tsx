import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ShowsHomeScreen } from './screens/ShowsHomeScreen'
import { ShowOverviewScreen } from './screens/ShowOverviewScreen'
import { CreateShowBasicsScreen } from './screens/CreateShowBasicsScreen'
import { CreateShowStyleScreen } from './screens/CreateShowStyleScreen'
import { CreateShowCharactersScreen } from './screens/CreateShowCharactersScreen'
import { NewEpisodeScreen } from './screens/NewEpisodeScreen'
import { PreflightScreen } from './screens/PreflightScreen'
import { BriefScreen } from './screens/BriefScreen'
import { PlanScreen } from './screens/PlanScreen'
import { ReferencesScreen } from './screens/ReferencesScreen'
import { StoryboardsScreen } from './screens/StoryboardsScreen'
import { KeyframesReviewScreen } from './screens/KeyframesReviewScreen'
import { KeyframesScreen } from './screens/KeyframesScreen'
import { AnimationScreen } from './screens/AnimationScreen'
import { AudioScreen } from './screens/AudioScreen'
import { AssemblyScreen } from './screens/AssemblyScreen'
import { FinalReviewScreen } from './screens/FinalReviewScreen'
import { ProductionsScreen } from './screens/ProductionsScreen'
import { AssetsScreen } from './screens/AssetsScreen'
import { UsageScreen } from './screens/UsageScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { NotificationsScreen } from './screens/NotificationsScreen'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/shows" replace />} />

        {/* Workspace */}
        <Route path="/shows" element={<ShowsHomeScreen />} />
        <Route path="/productions" element={<ProductionsScreen />} />
        <Route path="/assets" element={<AssetsScreen />} />
        <Route path="/usage" element={<UsageScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/show/:id" element={<ShowOverviewScreen />} />

        {/* Create show wizard */}
        <Route path="/create-show" element={<CreateShowBasicsScreen />} />
        <Route path="/create-show/style" element={<CreateShowStyleScreen />} />
        <Route path="/create-show/characters" element={<CreateShowCharactersScreen />} />

        {/* Episode flow */}
        <Route path="/new-episode" element={<NewEpisodeScreen />} />
        <Route path="/preflight" element={<PreflightScreen />} />

        {/* Production workspace */}
        <Route path="/brief" element={<BriefScreen />} />
        <Route path="/plan" element={<PlanScreen />} />
        <Route path="/references" element={<ReferencesScreen />} />
        <Route path="/storyboards" element={<StoryboardsScreen />} />
        <Route path="/keyframes" element={<KeyframesReviewScreen />} />
        <Route path="/keyframes-retry" element={<KeyframesScreen />} />
        <Route path="/animation" element={<AnimationScreen />} />
        <Route path="/audio" element={<AudioScreen />} />
        <Route path="/assembly" element={<AssemblyScreen />} />
        <Route path="/final-review" element={<FinalReviewScreen />} />

        <Route path="*" element={<Navigate to="/shows" replace />} />
      </Routes>
    </HashRouter>
  )
}

