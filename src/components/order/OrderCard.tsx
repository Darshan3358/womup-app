import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { OrderCard as NewOrderCard } from '../OrderCard';

export interface OrderCardProps {
  order: Order;
  onViewDetails?: () => void;
  onReorder?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onReorder,
}) => {
  const { setCurrentOrder, setActiveScreen } = useApp();

  const handleViewDetails = () => {
    setCurrentOrder(order);
    if (onViewDetails) {
      onViewDetails();
    } else {
      setActiveScreen('C24_OrderTracking');
    }
  };

  return (
    <NewOrderCard
      order={order}
      onPressDetails={handleViewDetails}
      onPressReorder={onReorder}
    />
  );
};

export default OrderCard;
