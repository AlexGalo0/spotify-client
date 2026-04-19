import { Routes, Route, useLocation } from 'react-router-dom';
import Landing from './features/landing/Landing';
import Dashboard from './features/dashboard/Dashboard';
import PlaylistDetail from './features/playlists/PlaylistDetail';
import PlaylistRoast from './features/roast/PlaylistRoast';
import ProfilePage from './features/profile/ProfilePage';
import NotFound from './features/not-found/NotFound';
import GlobalSearch from './features/tools/GlobalSearch';
import PlaylistMerger from './features/tools/PlaylistMerger';
import MusicChat from './features/chat/MusicChat';

function App() {
  const location = useLocation();
  // Don't show chat on the landing page
  const showChatWidget = location.pathname !== '/';

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playlist/:id" element={<PlaylistDetail />} />
        <Route path="/roast/:id" element={<PlaylistRoast />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<GlobalSearch />} />
        <Route path="/merger" element={<PlaylistMerger />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showChatWidget && <MusicChat />}
    </>
  );
}

export default App;
