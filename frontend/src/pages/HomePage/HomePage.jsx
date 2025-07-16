// frontend/src/pages/HomePage/HomePage.jsx - Actualizada para manejar navegación
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import ApplicationCard from '../../components/ApplicationCard/ApplicationCard';
import userService from '../../services/userService';
import applicationService from '../../services/applicationService';
import { LiveboardEmbed} from '@thoughtspot/visual-embed-sdk/react';
import { init } from '@thoughtspot/visual-embed-sdk';

init({
  thoughtSpotHost: 'https://gt-es.thoughtspot.cloud',
  authType: 'None' // o el tipo de auth que uses
});

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Cargar información del usuario actual
        const userResponse = await userService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setUser(userResponse.user);
          
          // Cargar aplicaciones para el usuario actual
          const appsResponse = await applicationService.getApplicationsForCurrentUser();
          if (appsResponse.success && appsResponse.applications) {
            setApplications(appsResponse.applications);
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Error al cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleApplicationClick = (application) => {
    console.log('Clicked application:', application);
    
    // Manejar navegación según la aplicación
    switch (application.id) {
      case 'importacion-libro-diario':
        navigate('/libro-diario');
        break;
      case 'analisis-jet':
        // Navegar a análisis JET cuando esté implementado
        alert(`Navegando a: ${application.name} (Próximamente)`);
        break;
      case 'analisis-riesgos':
        // Navegar a análisis de riesgos cuando esté implementado
        alert(`Navegando a: ${application.name} (Próximamente)`);
        break;
      case 'analisis-obsolescencia':
        // Navegar a análisis de obsolescencia cuando esté implementado
        alert(`Navegando a: ${application.name} (Próximamente)`);
        break;
      case 'thoughtspot':
        // Navegar en ThoughtSpot
        navigate('/thoughtspot');
        break;
      default:
        alert(`Navegando a: ${application.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando aplicaciones...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center border border-red-100">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error al cargar las aplicaciones</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome section */}
          {user && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                Bienvenido, {user.name}
              </h2>
              <p className="text-sm text-gray-500">
                {user.department} • {user.roleName}
              </p>
            </div>
          )}
          
          {/* Applications section */}
          <section className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Aplicaciones</h2>
            </div>
            
            {applications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {applications.map((application, index) => (
                  <div 
                    key={application.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ApplicationCard
                      application={application}
                      onClick={handleApplicationClick}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-sm p-12 max-w-md mx-auto border border-gray-100">
                  <div className="text-6xl mb-6 opacity-50">📱</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No hay aplicaciones disponibles
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    No tienes permisos para acceder a ninguna aplicación en este momento.
                    Contacta con tu administrador si crees que esto es un error.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2025 Grant Thornton • Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;