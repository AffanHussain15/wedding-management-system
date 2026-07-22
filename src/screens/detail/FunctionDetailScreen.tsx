import React from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';

import type { RootStackParamList } from '@navigation/types';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function FunctionDetailScreen(): React.JSX.Element {
  const { params } = useRoute<RouteProp<RootStackParamList, 'FunctionDetail'>>();
  return (
    <PlaceholderScreen
      title="Function Detail"
      subtitle={`Function #${params.functionId}`}
    />
  );
}
