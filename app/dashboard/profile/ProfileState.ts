import { ProfileState } from "./useProfile";

const defaultState: ProfileState = {
  personal: {
    displayName: "",
    email: "",
    photoURL: "",
    phone: "",
    alternateEmail: "",
  },
  business: {
    shopName: "",
    gstNumber: "",
    businessType: "retail",
    upiId: "",
    invoicePrefix: "INV",
  },
  address: {
    address: "",
    district: "",
    state: "",
    pincode: "",
  },
  banking: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  },
  settings: {
    termsAndConditions: "Goods once sold will not be taken back or exchanged.",
  },
};