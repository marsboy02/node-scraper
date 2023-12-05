export function TrimEscapeSequence(data: string): string {
    return data.replace(/\t/g, '').replace(/\n/g, '');
}
