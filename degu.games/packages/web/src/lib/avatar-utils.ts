export function generateInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getAvatarFallback(name: string) {
    return {
        initials: generateInitials(name),
        bg: 'bg-black',
        text: 'text-white'
    };
}
