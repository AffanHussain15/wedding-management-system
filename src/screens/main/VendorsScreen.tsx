import React from 'react';

import { useAppNavigation } from '@navigation/hooks';
import { PlaceholderScreen } from '../_shared/PlaceholderScreen';

export function VendorsScreen(): React.JSX.Element {
  const nav = useAppNavigation();
  return (
    <PlaceholderScreen
      title="Vendors"
      subtitle="Bookings & payments"
      links={[
        { label: 'Open a vendor', onPress: () => nav.navigate('VendorDetail', { vendorId: 1 }) },
        { label: 'Add Vendor', onPress: () => nav.navigate('AddVendor') },
      ]}
    />
  );
}
