// Animated loader: drop loader.svg in /public/brand and use <img>, or inline it.
export function OyelearnLoader({ size = 48 }: { size?: number }) {
  return <img src="/brand/loader.svg" width={size} height={size} alt="Loading" />;
}
