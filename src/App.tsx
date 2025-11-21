import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Library } from './components/Library';
import { SceneManager } from './components/SceneManager';
import { useAudioEngine } from './hooks/useAudioEngine';
import { useStore } from './store/useStore';

function App() {
  const audioEngine = useAudioEngine();
  const loadAudioFiles = useStore((state) => state.loadAudioFiles);

  useEffect(() => {
    loadAudioFiles();
  }, [loadAudioFiles]);

  return (
    <Layout>
      <div className="flex gap-4 h-full overflow-hidden w-full">
        <div className="w-80 flex-shrink-0 overflow-hidden">
          <Library />
        </div>

        <div className="flex-1 overflow-hidden min-w-0">
          <SceneManager seekTo={audioEngine.seekTo} />
        </div>
      </div>
    </Layout>
  );
}

export default App;
