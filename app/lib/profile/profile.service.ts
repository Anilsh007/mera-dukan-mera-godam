export interface ProfileData {
  userId: string;
  updatedAt: string;
  personal: {
    displayName: string;
    email: string;
    photoURL: string;
    phone: string;
    alternateEmail: string;
  };
  business: {
    shopName: string;
    gstNumber: string;
    businessType: string;
    upiId: string;
    invoicePrefix: string;
  };
  address: {
    address: string;
    district: string;
    state: string;
    pincode: string;
  };
  banking: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  settings: {
    termsAndConditions: string;
  };
}