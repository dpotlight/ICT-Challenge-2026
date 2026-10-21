/* 렌즈+패킷 브랜드 마크. 헤더는 읽고 페이로드는 열지 않는다는 개념을 표현 */
export function BrandMark({ width = 46 }: { width?: number }) {
  const height = Math.round((width * 68) / 128);
  return (
    <svg className="mark" width={width} height={height} viewBox="0 0 128 68" aria-hidden="true">
      <rect x="6" y="22" width="118" height="26" rx="13" fill="var(--panel-2)" stroke="var(--line)" strokeWidth="1" />
      <rect x="6" y="22" width="40" height="26" rx="13" fill="#3b82f6" />
      <line x1="15" y1="30" x2="35" y2="30" stroke="#eff6ff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="36" x2="29" y2="36" stroke="#eff6ff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="15" y1="42" x2="33" y2="42" stroke="#eff6ff" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="54" y="28" width="15" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="73" y="28" width="10" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="87" y="28" width="14" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="105" y="28" width="11" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="54" y="37" width="11" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="69" y="37" width="16" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="89" y="37" width="9" height="4.5" rx="2.25" fill="#9aa6bb" />
      <rect x="102" y="37" width="14" height="4.5" rx="2.25" fill="#9aa6bb" />
      <circle cx="26" cy="35" r="21" fill="none" stroke="var(--lens, #1a2333)" strokeWidth="6" />
      <line x1="41" y1="50" x2="54" y2="63" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
