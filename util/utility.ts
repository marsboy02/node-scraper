/**
 * 문자열의 양옆에 생기는 이스케이프 시컨스를 제거하는 함수입니다.
 * @return 이스케이프 시컨스가 제거된 문자열
 */
export function TrimEscapeSequence(data: string): string {
    return data.replace(/\t/g, '').replace(/\n/g, '');
}
