import React, { useState } from "react";
import { X, Lock, Key } from "lucide-react";
import { login } from "../services/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(password);
      localStorage.setItem("admin_token", res.access_token);
      onSuccess(res.access_token);
      setPassword("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al iniciar sesión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[#030611]/95 border border-[rgba(55,58,85,0.45)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all flex flex-col gap-5 text-white animate-[fadeInUp_0.25s_ease-out]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-[0_0_15px_rgba(83,131,232,0.15)]">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">Acceso Administrador</h3>
              <p className="text-xs text-muted-text">Ingresa tu contraseña para editar registros</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-text hover:text-white hover:bg-zinc-800/40 p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-loss-text/10 border border-loss-text/20 text-loss-text rounded-xl text-xs font-mono">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="admin-password" className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Contraseña</label>
            <div className="relative flex items-center bg-zinc-950/85 border border-[rgba(55,58,85,0.3)] rounded-xl px-3.5 py-3 focus-within:border-accent-blue/70 transition-colors shadow-inner">
              <Key size={16} className="text-muted-text mr-2.5" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-transparent text-sm w-full focus:outline-none placeholder-muted-text text-white font-mono"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-950/45 border border-[rgba(55,58,85,0.3)] text-xs font-bold rounded-xl text-muted-text hover:text-white hover:bg-zinc-900/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-accent-blue to-accent-blue-hover text-white text-xs font-black rounded-xl hover:shadow-[0_0_15px_rgba(83,131,232,0.35)] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Verificando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
