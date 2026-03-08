/**
 * Footer Component - Site footer with links and info
 */

import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 mt-16" data-testid="footer">
      <div className="px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="font-display text-2xl font-bold text-zinc-900">RESELL</h2>
            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
              Your destination for trendy fashion at affordable prices. Resell and earn with us.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="ui-label text-zinc-900 mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/?category=clothing" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                  Clothing
                </Link>
              </li>
              <li>
                <Link to="/?category=footwear" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                  Footwear
                </Link>
              </li>
              <li>
                <Link to="/?category=accessories" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="ui-label text-zinc-900 mb-4">Help</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-zinc-600">Shipping Info</span>
              </li>
              <li>
                <span className="text-sm text-zinc-600">Returns</span>
              </li>
              <li>
                <span className="text-sm text-zinc-600">Track Order</span>
              </li>
              <li>
                <span className="text-sm text-zinc-600">FAQ</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="ui-label text-zinc-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-zinc-600">support@resell.com</span>
              </li>
              <li>
                <span className="text-sm text-zinc-600">+91 98765 43210</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">
            2024 RESELL. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-zinc-500">Privacy Policy</span>
            <span className="text-sm text-zinc-500">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
