
export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const isOTPExpired = (expiresAt: string): boolean => {
  return new Date() > new Date(expiresAt);
};

export const getOTPExpirationTime = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // 10 minutes from now
  return now.toISOString();
};
