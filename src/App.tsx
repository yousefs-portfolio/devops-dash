import {useState} from 'react';
import { Dashboard } from './components/Dashboard';
import {EnhancedDashboard} from './components/EnhancedDashboard';
import './App.css';

function App() {
    const [useEnhanced, setUseEnhanced] = useState(true);

    // Toggle between dashboards with keyboard shortcut
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', (e) => {
            if (e.metaKey && e.shiftKey && e.key === 'D') {
                setUseEnhanced(prev => !prev);
            }
        });
    }

    return useEnhanced ? <EnhancedDashboard/> : <Dashboard/>;
}

export default App;