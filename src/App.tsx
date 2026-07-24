import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Game from './pages/Game';
import Friends from './pages/Friends';
import Guide from './pages/Guide';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import MatchHistory from './pages/MatchHistory';
import Missions from './pages/Missions';
import Profile from './pages/Profile';
import Room from './pages/Room';
import Shop from './pages/Shop';

const protect=(node:React.ReactNode)=><ProtectedRoute>{node}</ProtectedRoute>;
const router=createBrowserRouter([{
 path:'/',
 element:<Layout/>,
 children:[
  {index:true,element:<Home/>},
  {path:'login',element:<Login/>},
  {path:'play',element:<Navigate to="/room" replace/>},
  {path:'game',element:protect(<Game/>)},
  {path:'room',element:protect(<Room/>)},
  {path:'profile',element:protect(<Profile/>)},
  {path:'profile/:uid',element:protect(<Profile/>)},
  {path:'friends',element:protect(<Friends/>)},
  {path:'shop',element:protect(<Shop/>)},
  {path:'missions',element:protect(<Missions/>)},
  {path:'history',element:protect(<MatchHistory/>)},
  {path:'leaderboard',element:<Leaderboard/>},
  {path:'guide',element:<Guide/>},
 ]
}]);

export default function App(){return <RouterProvider router={router}/>}
