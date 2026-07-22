import React from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '@navigation/types';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function VendorDetailScreen(): React.JSX.Element {
  const { params } = useRoute<RouteProp<RootStackParamList, 'VendorDetail'>>();
  return (
    <PlaceholderScreen title="Vendor Detail" subtitle={`Vendor #${params.vendorId}`} />
  );
}
