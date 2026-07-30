import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
const Game=lazy(()=>import('./pages/Game'));
const Friends=lazy(()=>import('./pages/Friends'));
const Guide=lazy(()=>import('./pages/Guide'));
const Guild=lazy(()=>import('./pages/Guild'));
const Home=lazy(()=>import('./pages/Home'));
const Leaderboard=lazy(()=>import('./pages/Leaderboard'));
const Login=lazy(()=>import('./pages/Login'));
const MatchHistory=lazy(()=>import('./pages/MatchHistory'));
const Missions=lazy(()=>import('./pages/Missions'));
const Profile=lazy(()=>import('./pages/Profile'));
const Room=lazy(()=>import('./pages/Room'));
const Admin=lazy(()=>import('./pages/Admin'));

const protect=(node:React.ReactNode)=><ProtectedRoute>{node}</ProtectedRoute>;
const page=(node:React.ReactNode)=><Suspense fallback={<section className="center-page"><div className="auth-card"><span className="route-loader"/><h1>ĐANG TẢI...</h1></div></section>}>{node}</Suspense>;
const router=createBrowserRouter([{
 path:'/',
 element:<Layout/>,
 children:[
  {index:true,element:page(<Home/>)},
  {path:'login',element:page(<Login/>)},
  {path:'play',element:<Navigate to="/room" replace/>},
  {path:'game',element:protect(page(<Game/>))},
  {path:'room',element:protect(page(<Room/>))},
  {path:'profile',element:protect(page(<Profile/>))},
  {path:'profile/:name',element:protect(page(<Profile/>))},
  {path:'friends',element:protect(page(<Friends/>))},
  {path:'guild',element:protect(page(<Guild/>))},
  {path:'guild/:guildId',element:protect(page(<Guild/>))},
  {path:'missions',element:protect(page(<Missions/>))},
  {path:'history',element:protect(page(<MatchHistory/>))},
  {path:'leaderboard',element:page(<Leaderboard/>)},
  {path:'guide',element:page(<Guide/>)},
  {path:'admin',element:protect(page(<Admin/>))},
 ]
}]);

export default function App(){return <RouterProvider router={router}/>}
