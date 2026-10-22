import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import './calm.css';
import './learning.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(e:Error){return {error:e.message}}render(){return this.state.error?<main className="boot"><h1>This view needs attention.</h1><p role="alert">{this.state.error}</p><p>Your browser data are retained. Reload to return to your saved workspace.</p><button onClick={()=>location.reload()}>Reload workspace</button></main>:this.props.children}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
