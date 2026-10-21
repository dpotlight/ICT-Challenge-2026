"""시연 모드 관문.

발표 중에는 관람자가 누구든 상태를 바꿀 수 없어야 한다. 프론트에서도 요청 자체를
보내지 않지만, 브라우저를 우회해 API 를 직접 부르거나 예전 번들이 캐시에 남아 있는
경우까지 막으려면 서버가 최종 관문이어야 한다.

켜기:  WEBAPP_READONLY=1 로 기동
끄기:  값을 지우고 재기동
"""

from fastapi import HTTPException

import settings

MESSAGE = "시연 모드입니다. 이 서버는 읽기 전용으로 동작하며 등록·삭제·업로드가 반영되지 않습니다."


def guard() -> None:
    """상태를 바꾸는 엔드포인트 첫 줄에서 부른다."""
    if settings.READONLY:
        raise HTTPException(status_code=403, detail=MESSAGE)
