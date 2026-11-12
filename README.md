# Dragon Merge & Maze

(이전 이름: 길막 디펜스)

워크래프트3 유즈맵 젬 TD에서 영감을 받은 미로형 타워 디펜스 웹 게임이에요.
라운드마다 드래곤 5마리를 놓고 1마리만 남기면, 나머지는 돌이 되어 몬스터의 길을 막는 미로가 됩니다.
스테이지마다 지형이 새로 생성돼요.

- 플레이: https://gilmak-defense.pages.dev (main에 저장되면 자동으로 최신 버전이 배포돼요)
- 그래픽 샘플: https://gilmak-defense.pages.dev/sample.html
- 게임 규칙: [RULES.md](RULES.md)
- 파일 구성: `index.html`, `css/style.css`, `js/` (data 수치, map 맵·길찾기, game 규칙, sprites 도트, render 그리기, main 화면, tutorial 튜토리얼)
- 로컬 실행: 폴더에서 `python3 -m http.server` 후 http://localhost:8000 (파일을 직접 열면 모듈이 안 불러와져요)
- 자동 검증: `node tests/sim.mjs 4 2` (봇 4판, 2스테이지까지)

## 버전 저장 방식

작업 단계마다 커밋하고, 플레이해 볼 만한 지점에는 `v0.2`처럼 태그를 붙여요.
예전 버전으로 돌아가고 싶으면 태그 이름을 말해 주세요.
