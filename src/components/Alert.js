import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

let showAlertFunction = null;

export const showAlert = (message, type = 'info') => {
  if (showAlertFunction) {
    showAlertFunction(message, type);
  }
};

const Alert = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    showAlertFunction = (message, type) => {
      const id = Date.now();
      const newAlert = { id, message, type };
      setAlerts(prev => [...prev, newAlert]);
      
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
      }, 5000);
    };

    return () => {
      showAlertFunction = null;
    };
  }, []);

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const getAlertStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 shadow-lg max-w-sm animate-slide-in ${getAlertStyles(alert.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getIcon(alert.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alert;