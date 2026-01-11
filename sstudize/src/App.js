import 'bootstrap/dist/css/bootstrap.css'

import Login from './components/Login';

import {BrowserRouter as Router,Routes,Route} from 'react-router-dom'

import Register from './components/Register';
import VerifyOtp from './components/VerifyOtp';
import Enable2FA from './components/Enable2FA';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div>
        <Router>
              <Routes>
                    <Route path='/login' element={<Login/>} />
                    <Route path='/' element={<Register/>} />
                    <Route path='/verify-otp' element={<VerifyOtp/>} />
                    <Route path='/enable-2fa' element={<Enable2FA/>} />
                    <Route path='/forgot-password' element={<ForgotPassword/>} />
                    <Route path='/reset-password' element={<ResetPassword/>} />
                    <Route path='/dashboard' element={<Dashboard/>} />


              </Routes>

        </Router>
    </div>
  );
}
export default App;