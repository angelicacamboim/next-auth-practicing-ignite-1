import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies } from 'nookies';
import Router from 'next/router';

import { api } from "../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials : SignInCredentials) : Promise<void>;
  user : User | undefined;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}


export const AuthContext = createContext({} as AuthContextData);


export function AuthProvider({ children } : AuthProviderProps){
  const [user, setUser] = useState<User>();

  const isAuthenticated = !!user;

  useEffect(()=> {
    const { 'nextAuth.token': token } = parseCookies();

    if(token){
      api.get('/me').then( (response)  => {

        const { email, permissions, roles } = response.data;

        // AxiosResponseMe

        setUser({
          email, 
          permissions, 
          roles
        });

      });
    }
  },[]);

  async function signIn({email,password } : SignInCredentials){
    try{
      const response = await api.post('sessions', {
        email,
        password,
      });
  
      const { token, refreshToken ,permissions, roles } = response.data;

      setCookie(undefined, 'nextAuth.token', token, {
        maxAge: 60 * 60 * 25 * 30, // 30 days
        path: '/'
      });
      setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 25 * 30, // 30 days
        path: '/'
      });

      setUser({
        email,
        permissions,
        roles,
      });

      // api.defaults.headers['Authorization']  = `Bearer ${token}`;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // api.defaults.headers = {
      //   Authorization: `Bearer ${token}`
      // } as CommonHeaderProperties;

  

      Router.push('/dashboard');

    }catch(err){
      console.log(err);
    }

  }

  return(
    <AuthContext.Provider value={{
      signIn,
      user,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  )
}