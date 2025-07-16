// frontend/src/components/UserSelector/UserSelector.jsx
import React, { useState } from 'react';

const UserSelector = ({ currentUser, onUserChange, availableUsers }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleUserSelect = (userId) => {
    onUserChange(userId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
      >
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <span className="text-gray-700">Cambiar usuario</span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Dropdown Content */}
          <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`
                    w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200
                    ${currentUser?.id === user.id ? 'bg-purple-50 border border-purple-200' : ''}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium
                      ${currentUser?.id === user.id ? 'bg-purple-500' : 'bg-gray-400'}
                    `}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        {currentUser?.id === user.id && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.roleName}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {Object.entries(user.permissions || {}).filter(([key, value]) => value && key.startsWith('canAccess')).length > 0 && (
                          <span className="text-xs text-gray-400">
                            {Object.entries(user.permissions || {}).filter(([key, value]) => value && key.startsWith('canAccess')).length} apps
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserSelector;