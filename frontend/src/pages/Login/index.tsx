import React from 'react';
import { DoorOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useLogin } from './UseLogin';

const LoginPage: React.FC = () => {
	const {
		email,
		setEmail,
		password,
		setPassword,
		loading,
		showPassword,
		handleLogin,
		handleShowPasswordToggle,
	} = useLogin();

	return (
		<div className="login-bg font-sans min-h-screen flex items-center justify-center p-4">
			<div className="w-sm max-w-md">
				<div className="flex items-center justify-center">
					<h1 className="text-3xl font-extrabold text-emerald-900 mb-8">STOKKU  </h1>
				</div>
				<div className="bg-linear-230 from-white to-emerald-100 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/50">
					<div className='text-center mb-8'>
						<h1 className="text-1xl font-extrabold text-emerald-950 tracking-tight">Login</h1>
					</div>
					<form className="space-y-6" onSubmit={handleLogin}>
						<div>
							<label className="block text-sm font-semibold text-emerald-950 mb-1.5 ml-1">Email</label>
							<div className="relative">
								<Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-500 ml-1" size={18} />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="w-full pl-9 pb-2 pt-3 border-b-2 border-emerald-100 bg-transparent focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-900/40"
									placeholder="ex: admin@example.com"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-semibold text-emerald-950 mb-1.5 ml-1">Password</label>
							<div className="relative">
								<Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-500 ml-1" size={18} />
								<input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="w-full pl-9 pr-10 pb-2 pt-3 border-b-2 border-emerald-100 bg-transparent focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-900/40"
									placeholder="••••••••"
									required
								/>
								<button
									type="button"
									onClick={handleShowPasswordToggle}
									className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-500 p-2"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-teal-800 text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] shadow-xl shadow-emerald-200/50 mt-2 flex items-center justify-center gap-2"
						>
							{!loading && <DoorOpen size={24} />}
							{loading ? (
								<div className="flex items-center gap-1 bg-emerald-500/20 px-3 py-1 rounded-full">
									<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
									<div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
								</div>
							) : (
								'Login'
							)}
						</button>
					</form>
				</div>
				<p className="text-center text-emerald-800/40 text-xs mt-8 font-bold">&copy; 2026 STOKKU   - All rights reserved.</p>
			</div>
		</div>
	);
};

export default LoginPage;
