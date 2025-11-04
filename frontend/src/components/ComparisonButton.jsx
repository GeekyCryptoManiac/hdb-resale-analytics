// src/components/ComparisonButton.jsx
import React, { useState, useContext } from 'react';
import { Button, Spinner, Toast } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { addToComparison, removeFromComparison } from '../services/userService';

function ComparisonButton({ 
  property,
  variant = 'outline-primary',
  size = 'sm',
  className = '',
  onSuccess,
  onError 
}) {
  const { user, updateComparisonList } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Check if property is in comparison list
  const isInComparison = user?.comparisonList?.some(
    item => item.transaction_id === property.transaction_id
  );

  // Maximum comparison limit
  const MAX_COMPARISON = 3;

  const showNotification = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Get user ID with multiple fallbacks
  const getUserId = () => {
    const userId = user?._id || user?.id || user?.userId;
    console.log('🔍 Getting user ID:', { 
      _id: user?._id, 
      id: user?.id, 
      userId: user?.userId,
      selected: userId 
    });
    return userId;
  };

  const handleClick = async () => {
  // Check if user is logged in
  if (!user) {
    console.log('⚠️ No user found, redirecting to login');
    navigate('/login');
    return;
  }

  const userId = getUserId();
  
  if (!userId) {
    console.error('❌ User ID is undefined!', user);
    showNotification('Error: User ID not found. Please log in again.', 'danger');
    navigate('/login');
    return;
  }

  console.log('👤 Using user ID:', userId);
  console.log('🏠 Property transaction_id:', property.transaction_id, 'Type:', typeof property.transaction_id);
  setLoading(true);

  try {
    if (isInComparison) {
      // Remove from comparison
      console.log('➖ Removing from comparison:', property.transaction_id);
      await removeFromComparison(userId, property.transaction_id.toString()); // Ensure string for URL param
      
      // Update user context
      const updatedComparisonList = user.comparisonList.filter(
        item => item.transaction_id !== property.transaction_id
      );
      updateComparisonList(updatedComparisonList);
      
      showNotification('Removed from comparison list', 'info');
      
      if (onSuccess) {
        onSuccess({ action: 'remove', property });
      }
    } else {
      // Check limit before adding
      if (user.comparisonList && user.comparisonList.length >= MAX_COMPARISON) {
        showNotification(`Maximum ${MAX_COMPARISON} properties allowed. Remove one first.`, 'warning');
        setLoading(false);
        return;
      }

      // Add to comparison - pass the full property object
      console.log('➕ Adding to comparison:', property.transaction_id);
      await addToComparison(userId, property);
      
      // Update user context - store full property data for comparison
      const updatedComparisonList = [...(user.comparisonList || []), property];
      updateComparisonList(updatedComparisonList);
      
      showNotification('Added to comparison list!', 'success');
      
      if (onSuccess) {
        onSuccess({ action: 'add', property });
      }
    }
  } catch (error) {
    console.error('❌ Error toggling comparison:', error);
    showNotification(error.message || 'Failed to update comparison list', 'danger');
    
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
            {isInComparison ? '✓ In Comparison' : '+ Compare'}
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