type AuthLocation = Pick<Location, 'hostname' | 'protocol'>;

function isLoopbackHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.localhost')
  );
}

export function isAuthTransportSecure(currentLocation: AuthLocation = window.location): boolean {
  return currentLocation.protocol === 'https:' || isLoopbackHostname(currentLocation.hostname);
}
