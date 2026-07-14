import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../shared/Button';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login() {
  const { state, dispatch } = useApp();
  const [email, setEmail] = useState('admin@novacrm.co');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [welcomeUser, setWelcomeUser] = useState<string | null>(null);

  const handleQuickLogin = (quickEmail: string, quickName: string) => {
    setEmail(quickEmail);
    setPassword('password123');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setIsLoading(true);
    // Simular tiempo de carga
    await new Promise(resolve => setTimeout(resolve, 1200));

    const user = state.users.find(u => u.email === email);
    // En un app real validaríamos contraseña. Aquí aceptamos cualquiera por facilidad de demo si el email existe.
    if (user) {
      setWelcomeUser(user.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      dispatch({ type: 'SET_USER', payload: user });
    } else {
      setError('Credenciales inválidas. Intenta con ana@novacrm.co');
      setIsLoading(false);
    }
  };

  if (welcomeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-bold">{welcomeUser[0]}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 italic">¡Bienvenido de nuevo!</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xl font-medium">{welcomeUser}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-800",
          error && "animate-shake"
        )}
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg">
            <span className="text-white text-3xl font-black">N</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">NovaCRM</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Tu CRM inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 text-slate-400 transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all dark:text-white"
                placeholder="ej: ana@novacrm.co"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-blue-600 text-slate-400 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                <span>Iniciar sesión</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center mb-4">
            Perfiles Rápidos de Demo
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@novacrm.co', 'Admin Sistema')}
              className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer ${
                email === 'admin@novacrm.co'
                  ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold'
                  : 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xs font-black tracking-tight">Admin</span>
              <span className="text-[9px] font-medium opacity-70">Superadmin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('ana@novacrm.co', 'Ana García')}
              className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer ${
                email === 'ana@novacrm.co'
                  ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold'
                  : 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xs font-black tracking-tight">Ana G.</span>
              <span className="text-[9px] font-medium opacity-70">Supervisor</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('pedro@novacrm.co', 'Pedro Ruiz')}
              className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center cursor-pointer ${
                email === 'pedro@novacrm.co'
                  ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold'
                  : 'bg-slate-50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xs font-black tracking-tight">Pedro R.</span>
              <span className="text-[9px] font-medium opacity-70">Agente</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs font-medium">
          <span className="text-slate-400">¿Problemas para acceder? </span>
          <button className="text-blue-600 hover:underline dark:text-blue-400 font-bold">
            Contactar soporte
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Utility class for shake animation
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
