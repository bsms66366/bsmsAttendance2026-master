const isFalseLike = (value?: string) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no';
};

export const OFFLINE_QUEUE_ENABLED = !isFalseLike(process.env.EXPO_PUBLIC_OFFLINE_QUEUE_ENABLED);
