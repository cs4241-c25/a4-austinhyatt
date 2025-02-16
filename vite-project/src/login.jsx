import { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import axios from 'axios';

const { useNavigate } = ReactRouterDOM;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password,
      });

      if (response.data.success) {
        setMessage('Login successful!');
        setTimeout(() => navigate('dashboard'), 1000); // Redirect after 1 sec
      } else {
        setMessage('Login failed');
      }
    } catch (error) {
      setMessage('Invalid credentials');
    }
  };

  return (
    <div>
      <h2>Login to Austin's Scoreboard</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      <br />
      <a href="/auth/github"><button id="githubButton">Login with GitHub</button></a>
    </div>
  );
};

export default Login;
