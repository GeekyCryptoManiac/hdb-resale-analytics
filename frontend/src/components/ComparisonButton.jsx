// src/components/ComparisonButton.jsx
import React, { useState } from 'react';
import { Button, Spinner, Toast } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

function ComparisonButton({ 
  transactionId, 
  propertyData, // Add this prop to receive full property data
  variant = 'outline-primary',
  size = 'sm',
  className = '',
  onSuccess,
  onError 
}) {
  const { 
    user, 
    updateUser, 
    comparisonProperties,
    addToComparisonProperties, 
    removeFromComparisonProperties 
  } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Check if property is in comparison list
  const isInComparison = comparisonProperties?.some(prop => prop.transactionId === transactionId);

  // Maximum comparison limit
  const MAX_COMPARISON = 3;

  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleClick = async () => {
    // If user data is still loading, wait
    if (user === undefined) {
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      if (isInComparison) {
        // Remove from comparison using context function
        removeFromComparisonProperties(transactionId);
        
        showNotification('Removed from comparison list', 'info');
        
        if (onSuccess) {
          onSuccess({ action: 'remove', transactionId });
        }
      } else {
        // Check limit before adding
        if (comparisonProperties && comparisonProperties.length >= MAX_COMPARISON) {
          showNotification(`Maximum ${MAX_COMPARISON} properties allowed. Remove one first.`, 'warning');
          setLoading(false);
          return;
        }

        // Add to comparison using context function
        if (propertyData) {
          addToComparisonProperties({
            ...propertyData,
            transactionId: transactionId // Ensure transactionId is set
          });
        }
        
        showNotification('Added to comparison list!', 'success');
        
        if (onSuccess) {
          onSuccess({ action: 'add', transactionId });
        }
      }
    } catch (error) {
      console.error('Error toggling comparison:', error);
      showNotification('Failed to update comparison list', 'danger');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={isInComparison ? 'success' : variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="me-2"
            />
            {isInComparison ? 'Removing...' : 'Adding...'}
          </>
        ) : (
          <>
            {isInComparison ? '✓ In comparison list' : '+ Add to Compare'}
          </>
        )}
      </Button>

      {/* Toast Notification */}
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999
        }}
      >
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)}
          bg={toastVariant.toLowerCase()}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </div>
    </>
  );
}

export default ComparisonButton;