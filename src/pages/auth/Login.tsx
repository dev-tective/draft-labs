import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/match');
            }
        };
        checkUser();
    }, [navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('¡Registro exitoso! Por favor verifica tu correo.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/match');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${import.meta.env.VITE_REDIRECT_URL}/auth/callback?popup=true`,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                // Abrir popup
                const width = 500;
                const height = 600;
                const left = window.screen.width / 2 - width / 2;
                const top = window.screen.height / 2 - height / 2;

                window.open(
                    data.url,
                    'google-auth',
                    `width=${width},height=${height},left=${left},top=${top}`
                );

                // Escuchar mensaje de éxito
                const handleMessage = (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return;

                    if (event.data === "google-auth-success") {
                        window.removeEventListener("message", handleMessage);
                        // Verificar la sesión y navegar
                        supabase.auth.getSession().then(({ data: { session } }) => {
                            if (session) navigate('/match');
                        });
                    }
                };

                window.addEventListener("message", handleMessage);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="
                max-w-md w-full p-8
                bg-slate-900
                rounded-tl-3xl rounded-br-3xl beveled-br-tl
                border border-slate-700
            ">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Draft Labs</h1>
                    <p className="text-slate-200">
                        {isSignUp ? 'Create an account to get started' : 'Sign in to your account'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full py-3 px-4 
                            bg-cyan-500 hover:bg-fuchsia-500 
                            text-white font-semibold 
                            rounded-lg 
                            shadow-lg hover:shadow-fuchsia-500/30 
                            transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {loading
                            ? (isSignUp ? 'Creating account...' : 'Logging in...')
                            : (isSignUp ? 'Register' : 'Login')
                        }
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-slate-700"></div>
                    <span className="px-4 text-sm text-slate-400">Or continue with</span>
                    <div className="flex-1 border-t border-slate-700"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="
                        w-full py-3 px-4 
                        bg-slate-700 hover:bg-slate-500 
                        text-white font-medium 
                        rounded-lg transition-colors 
                        flex items-center justify-center gap-2 
                        border border-slate-600
                    "
                >
                    <Icon icon="flat-color-icons:google" className="text-2xl" />
                    Google
                </button>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-cyan-400 hover:text-fuchsia-500 font-medium transition-colors"
                        >
                            {isSignUp ? 'Login' : 'Register'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};