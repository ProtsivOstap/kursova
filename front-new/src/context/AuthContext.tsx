import { createContext, useEffect, useState, ReactNode, useContext } from "react";
import {jwtDecode} from "jwt-decode";

interface TokenData {
    email: string;
    role: string;
    userId:string;
}

interface Auth {
    email: string;
    role: string;
    accessToken: string;
    userId:string;
}

interface AuthContextType {
    auth: Auth | null;
    setAuth: (auth: Auth | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    auth: null,
    setAuth: () => {}
});

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [auth, setAuth] = useState<Auth | null>(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenData = jwtDecode<TokenData>(token);
                return {
                    email: tokenData.email,
                    role: tokenData.role,
                    accessToken: token,
                    userId:tokenData.userId
                };
            } catch (error) {
                console.error("Error decoding token:", error);
                return null;
            }
        } else {
            return null;
        }
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const tokenData = jwtDecode<TokenData>(token);
                setAuth({
                    email: tokenData.email,
                    role: tokenData.role,
                    accessToken: token,
                    userId:tokenData.userId
                });
            } catch (error) {
                console.error("Error decoding token:", error);
                setAuth(null);
            }
        } else {
            setAuth(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;
