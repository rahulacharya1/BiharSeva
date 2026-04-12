import { NavLink } from "react-router-dom";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-20 border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* Brand Identity Section */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
                                <i className="fas fa-leaf text-white text-lg"></i>
                            </div>
                            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
                                Bihar<span className="text-emerald-600">Seva</span>
                            </span>
                        </div>
                        <p className="max-w-md text-slate-500 text-sm leading-relaxed font-medium">
                            Citizen reporting aur volunteer coordination ka ek digital ecosystem. Hum Bihar ke har nagrik ko civic action se jodkar ek swachh aur shrestha prant banane mein madad karte hain.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <i className="fab fa-facebook-f text-sm"></i>
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <i className="fab fa-instagram text-sm"></i>
                            </a>
                            <a href="#" className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm">
                                <i className="fab fa-twitter text-sm"></i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links Group 1 */}
                    <div className="space-y-6">
                        <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Ecosystem</h4>
                        <nav className="flex flex-col space-y-4">
                            <NavLink to="/report-gallery" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Report Gallery</NavLink>
                            <NavLink to="/events" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Upcoming Events</NavLink>
                            <NavLink to="/volunteers" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Our Heroes</NavLink>
                            <NavLink to="/services" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">All Services</NavLink>
                        </nav>
                    </div>

                    {/* Quick Links Group 2 */}
                    <div className="space-y-6">
                        <h4 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Support</h4>
                        <nav className="flex flex-col space-y-4">
                            <NavLink to="/contact" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Get Support</NavLink>
                            <NavLink to="/privacy" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">Privacy Policy</NavLink>
                            <NavLink to="/about" className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">About Us</NavLink>
                            <a href="mailto:noreply.biharseva@gmail.com" className="text-sm font-bold text-emerald-600">noreply.biharseva@gmail.com</a>
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        © {currentYear} BiharSeva • Built for a better Bihar
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                        <span>Server Status: Online</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
