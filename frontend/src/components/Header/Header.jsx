// frontend/src/components/Header/Header.jsx
import React from 'react';
import logo from '../../assets/images/logo-positivo.png';

const Header = ({ user }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="Grant Thornton Logo" 
              className="h-14 w-auto" 
            />
            <div className="hidden sm:block h-5 w-px bg-gray-300"></div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gradient">SmartAudit</h1>
            </div>
          </div>

          {/* Usuario */}
          {user && (
            <div className="flex items-center">
              <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.roleName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Título móvil */}
      <div className="sm:hidden px-4 pb-2">
        <h1 className="text-base font-bold text-gradient">SmartAudit</h1>
      </div>
    </header>
  );
};

export default Header;
