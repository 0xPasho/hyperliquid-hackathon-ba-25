/**
 * Cookie utilities for cross-subdomain session sharing
 */

const COOKIE_DOMAIN = process.env.NODE_ENV === 'production'
    ? '.yourdomain.com'  // Replace with your actual domain
    : 'localhost';

/**
 * Set a cookie with domain support for subdomain sharing
 */
export function setCookie(name: string, value: string, days: number = 365): void {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;

    // Set cookie with domain to share across subdomains
    document.cookie = `${name}=${value}; ${expires}; path=/; domain=${COOKIE_DOMAIN}; SameSite=Lax`;

    console.log(`[Cookies] Set cookie: ${name} on domain ${COOKIE_DOMAIN}`);
}

/**
 * Get cookie value by name
 */
export function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
}

/**
 * Delete cookie
 */
export function deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${COOKIE_DOMAIN}`;
    console.log(`[Cookies] Deleted cookie: ${name}`);
}
