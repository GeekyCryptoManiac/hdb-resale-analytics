// src/components/ComparisonButton.jsx
import React, { useState } from 'react';
import { Button, Spinner, Toast } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { addToComparison, removeFromComparison } from '../services/userService';

function ComparisonButton({ 
  transactionId, 
  variant = 'outline-primary',
  size = 'sm',
  className = '',
  onSuccess,
  onError 
}) {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Check if property is in comparison list
  const isInComparison = user?.comparisonList?.includes(transactionId);

  // Maximum comparison limit
  const MAX_COMPARISON = 3;

  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleClick = async () => {
    // Check if user is logged in
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      if (isInComparison) {
        // Remove from comparison
        const response = await removeFromComparison(user._id || user.userId, transactionId);
        
        // Update user context
        const updatedComparisonList = user.comparisonList.filter(id => id !== transactionId);
        updateUser({ comparisonList: updatedComparisonList });
        
        showNotification('Removed from comparison list', 'info');
        
        if (onSuccess) {
          onSuccess({ action: 'remove', transactionId });
        }
      } else {
        // Check limit before adding
        if (user.comparisonList && user.comparisonList.length >= MAX_COMPARISON) {
          showNotification(`Maximum ${MAX_COMPARISON} properties allowed. Remove one first.`, 'warning');
          setLoading(false);
          return;
        }

        // Add to comparison
        const response = await addToComparison(user._id || user.userId, transactionId);
        
        // Update user context
        const updatedComparisonList = [...(user.comparisonList || []), transactionId];
        updateUser({ comparisonList: updatedComparisonList });
        
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
            {isInComparison ? '✓ In Comparison' : '+ Add to Compare'}
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
          bg={toastVariant}
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