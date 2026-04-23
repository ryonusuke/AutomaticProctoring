import { ShieldCheck } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-950 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid md:grid-cols-3 gap-12 mb-12">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block leading-none">Automatic Proctoring</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">System</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Enterprise-grade academic integrity enforcement for modern institutions.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500 mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
            <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-bold text-sm uppercase tracking-widest text-gray-500 mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Data Security</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Automatic Proctoring System. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">All systems operational</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
